import csv
import io
import logging
from django.core.cache import cache
from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import City, Area, Category, Offer, SavedOffer, SearchHistory
from .serializers import (
    CitySerializer, AreaSerializer, CategorySerializer,
    OfferSerializer, SavedOfferSerializer,
)
from .services import claude_service

logger = logging.getLogger(__name__)


def _session_key(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


# ── Cities ──────────────────────────────────────────────────────────────────

@api_view(['GET'])
def cities_list(request):
    cities = City.objects.all()
    return Response(CitySerializer(cities, many=True).data)


# ── Areas ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
def areas_list(request, city_slug):
    try:
        city = City.objects.get(slug=city_slug)
    except City.DoesNotExist:
        return Response({'error': 'City not found'}, status=404)

    areas = city.areas.all()
    serializer = AreaSerializer(areas, many=True)
    return Response({'city': CitySerializer(city).data, 'areas': serializer.data})


# ── Categories ──────────────────────────────────────────────────────────────

@api_view(['GET'])
def categories_list(request, area_slug):
    try:
        area = Area.objects.select_related('city').get(slug=area_slug)
    except Area.DoesNotExist:
        return Response({'error': 'Area not found'}, status=404)

    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True, context={'area_slug': area_slug})
    return Response({'area': AreaSerializer(area).data, 'categories': serializer.data})


# ── Offers ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
def offers_list(request):
    area_slug = request.GET.get('area', '')
    category_slug = request.GET.get('category', '')
    deal_type = request.GET.get('deal_type', 'ALL')
    refresh = request.GET.get('refresh', '0') == '1'

    if not area_slug:
        return Response({'error': 'area parameter is required'}, status=400)

    cache_key = f"offers:{area_slug}:{category_slug}:{deal_type}"

    if not refresh:
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

    try:
        area = Area.objects.select_related('city').get(slug=area_slug)
    except Area.DoesNotExist:
        return Response({'error': 'Area not found'}, status=404)

    category = None
    if category_slug:
        try:
            category = Category.objects.get(slug=category_slug)
        except Category.DoesNotExist:
            pass

    # Serve from DB — offers are imported via import_webset management command
    qs = Offer.objects.filter(area=area)
    if category:
        qs = qs.filter(category=category)
    if deal_type and deal_type != 'ALL':
        qs = qs.filter(deal_type=deal_type)

    session_key = _session_key(request)
    data = OfferSerializer(qs, many=True, context={'session_key': session_key}).data
    payload = {'offers': data, 'source': 'db', 'count': len(data)}
    cache.set(cache_key, payload, settings.CACHE_TTL)
    return Response(payload)


# ── Search ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
def search(request):
    q = request.GET.get('q', '').strip()
    if not q:
        return Response({'results': [], 'recent': []})

    session_key = _session_key(request)

    # Save to history
    SearchHistory.objects.create(session_key=session_key, query=q)

    # Search DB
    offers = Offer.objects.filter(restaurant_name__icontains=q) | \
             Offer.objects.filter(deal_description__icontains=q) | \
             Offer.objects.filter(area__name__icontains=q)

    data = OfferSerializer(offers[:20], many=True, context={'session_key': session_key}).data
    return Response({'results': data, 'count': len(data)})


@api_view(['GET'])
def search_history(request):
    session_key = _session_key(request)
    history = SearchHistory.objects.filter(session_key=session_key)[:10]
    data = [{'query': h.query, 'searched_at': h.searched_at} for h in history]
    return Response({'history': data})


# ── Saved ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def saved_list(request):
    session_key = _session_key(request)
    saved = SavedOffer.objects.filter(session_key=session_key).select_related('offer')
    return Response(SavedOfferSerializer(saved, many=True).data)


@api_view(['POST'])
def toggle_saved(request, offer_id):
    session_key = _session_key(request)
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response({'error': 'Offer not found'}, status=404)

    saved, created = SavedOffer.objects.get_or_create(
        session_key=session_key,
        offer=offer,
    )
    if not created:
        saved.delete()
        return Response({'saved': False})

    return Response({'saved': True})


# ── Admin: CSV Import ─────────────────────────────────────────────────────────

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def import_csv(request):
    csv_file = request.FILES.get('csv_file')
    area_slug = request.POST.get('area_slug', '').strip()
    city_slug = request.POST.get('city_slug', '').strip()
    category_slug = request.POST.get('category_slug', '').strip()

    if not csv_file or not area_slug or not city_slug or not category_slug:
        return Response({'error': 'csv_file, area_slug, city_slug, category_slug are all required'}, status=400)

    try:
        city = City.objects.get(slug=city_slug)
    except City.DoesNotExist:
        return Response({'error': f"City '{city_slug}' not found"}, status=404)

    try:
        area = Area.objects.get(slug=area_slug, city=city)
    except Area.DoesNotExist:
        return Response({'error': f"Area '{area_slug}' not found under {city.name}"}, status=404)

    try:
        category = Category.objects.get(slug=category_slug)
    except Category.DoesNotExist:
        return Response({'error': f"Category '{category_slug}' not found"}, status=404)

    # Parse CSV
    try:
        content = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
    except Exception as e:
        return Response({'error': f'Failed to read CSV: {e}'}, status=400)

    if not rows:
        return Response({'error': 'CSV file is empty'}, status=400)

    # Claude validates + structures
    parsed_offers = claude_service.parse_csv_rows(
        rows,
        city_name=city.name,
        area_name=area.name,
        category_name=category.name,
        category_slug=category_slug,
    )

    # Upsert into DB
    saved_offers = []
    for o in parsed_offers:
        try:
            offer, _ = Offer.objects.update_or_create(
                restaurant_name=o['restaurant_name'],
                area=area,
                deal_type=o['deal_type'],
                defaults={
                    'category': category,
                    'deal_description': o.get('deal_description', '')[:300],
                    'savings_amount': o.get('savings_amount'),
                    'savings_percent': o.get('savings_percent'),
                    'valid_until': o.get('valid_until') or '',
                    'rating': o.get('rating'),
                    'review_count': o.get('review_count') or 0,
                    'is_live': bool(o.get('is_live', False)),
                    'source_url': o.get('source_url') or '',
                    'thumbnail_emoji': o.get('thumbnail_emoji') or '🍽',
                }
            )
            saved_offers.append(offer)
        except Exception as e:
            logger.error(f"Failed to save offer '{o.get('restaurant_name')}': {e}")

    # Sync deal counts
    area.deal_count = area.offers.count()
    area.save(update_fields=['deal_count'])
    city.deal_count = Offer.objects.filter(area__city=city).count()
    city.save(update_fields=['deal_count'])

    # Bust cache for this area
    cache.delete(f"offers:{area_slug}:{category_slug}:ALL")

    session_key = _session_key(request)
    data = OfferSerializer(saved_offers, many=True, context={'session_key': session_key}).data

    return Response({
        'imported': len(saved_offers),
        'total_rows': len(rows),
        'skipped': len(rows) - len(parsed_offers),
        'offers': data,
    })
