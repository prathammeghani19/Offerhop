import logging
from django.core.cache import cache
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import City, Area, Category, Offer, SavedOffer, SearchHistory
from .serializers import (
    CitySerializer, AreaSerializer, CategorySerializer,
    OfferSerializer, SavedOfferSerializer,
)
from .services import exa_service, claude_service

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

    # Try DB first (populated by background job or previous fetch)
    qs = Offer.objects.filter(area=area)
    if category:
        qs = qs.filter(category=category)
    if deal_type and deal_type != 'ALL':
        qs = qs.filter(deal_type=deal_type)

    if qs.exists() and not refresh:
        session_key = _session_key(request)
        data = OfferSerializer(qs, many=True, context={'session_key': session_key}).data
        payload = {'offers': data, 'source': 'db', 'count': len(data)}
        cache.set(cache_key, payload, settings.CACHE_TTL)
        return Response(payload)

    # Live fetch via Exa
    if not settings.EXA_API_KEY:
        session_key = _session_key(request)
        qs_all = Offer.objects.filter(area=area)
        data = OfferSerializer(qs_all, many=True, context={'session_key': session_key}).data
        return Response({
            'offers': data,
            'source': 'db_fallback',
            'count': len(data),
            'warning': 'EXA_API_KEY not configured in .env',
        })

    try:
        city_name = area.city.name
        area_name = area.name
        category_name = category.name if category else 'food and drinks'

        # Step 1: Build Exa search queries from user context
        queries = claude_service.build_exa_queries(city_name, area_name, category_name, deal_type)
        logger.info(f"Queries: {queries}")

        # Step 2: Exa searches and returns page content
        raw_results = exa_service.search_deals(queries, num_results_per_query=8)
        logger.info(f"Exa returned {len(raw_results)} results")

        # Step 3: Extract structured offer data
        parsed_offers = claude_service.parse_exa_results(raw_results, area_name, category_name)
        logger.info(f"Parsed {len(parsed_offers)} offers")

        # Step 4: Upsert into DB — key on (restaurant_name, area, deal_type)
        saved = []
        for o in parsed_offers:
            try:
                offer, _ = Offer.objects.update_or_create(
                    restaurant_name=o.get('restaurant_name', ''),
                    area=area,
                    deal_type=o.get('deal_type', 'BOGO'),
                    defaults={
                        'category': category,
                        'deal_description': o.get('deal_description', '')[:300],
                        'savings_amount': o.get('savings_amount'),
                        'savings_percent': o.get('savings_percent'),
                        'valid_until': o.get('valid_until') or '',
                        'rating': o.get('rating'),
                        'review_count': o.get('review_count') or 0,
                        'distance_km': o.get('distance_km'),
                        'is_live': bool(o.get('is_live', False)),
                        'source_url': o.get('source_url') or '',
                        'thumbnail_emoji': o.get('thumbnail_emoji') or '🍽',
                    }
                )
                saved.append(offer)
            except Exception as e:
                logger.error(f"Failed to save offer: {e}")

        session_key = _session_key(request)
        data = OfferSerializer(saved, many=True, context={'session_key': session_key}).data
        payload = {'offers': data, 'source': 'live', 'count': len(data)}
        cache.set(cache_key, payload, settings.CACHE_TTL)

        # Update area deal count
        Area.objects.filter(pk=area.pk).update(deal_count=Offer.objects.filter(area=area).count())

        return Response(payload)

    except Exception as e:
        logger.exception(f"Offers fetch failed: {e}")
        return Response({'error': 'Failed to fetch offers', 'detail': str(e)}, status=500)


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
