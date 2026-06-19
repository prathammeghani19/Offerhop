"""
Background command: use Exa Websets to batch-populate offers for top city/area/category combos.
Run: python manage.py populate_offers --city bengaluru --area indiranagar
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from api.models import City, Area, Category, Offer
from api.services import exa_service, claude_service

TOP_COMBOS = [
    ('bengaluru', 'indiranagar', 'biryani'),
    ('bengaluru', 'koramangala', 'biryani'),
    ('bengaluru', 'indiranagar', 'craft-beer'),
    ('bengaluru', 'koramangala', 'pizza'),
    ('bengaluru', 'btm-layout', 'biryani'),
]


class Command(BaseCommand):
    help = 'Populate offers via Exa Websets for top combos'

    def add_arguments(self, parser):
        parser.add_argument('--city', type=str, default='')
        parser.add_argument('--area', type=str, default='')
        parser.add_argument('--category', type=str, default='')
        parser.add_argument('--deal-type', type=str, default='ALL')
        parser.add_argument('--use-websets', action='store_true',
                            help='Use Exa Websets (async) instead of search_and_contents')

    def handle(self, *args, **options):
        if not settings.EXA_API_KEY:
            self.stderr.write('EXA_API_KEY not set in .env')
            return
        if not settings.ANTHROPIC_API_KEY:
            self.stderr.write('ANTHROPIC_API_KEY not set in .env')
            return

        city_slug = options['city']
        area_slug = options['area']
        cat_slug = options['category']
        deal_type = options['deal_type']
        use_websets = options['use_websets']

        if city_slug and area_slug and cat_slug:
            combos = [(city_slug, area_slug, cat_slug)]
        else:
            combos = TOP_COMBOS

        for c_slug, a_slug, cat_slug in combos:
            self._populate(c_slug, a_slug, cat_slug, deal_type, use_websets)

    def _populate(self, city_slug, area_slug, cat_slug, deal_type, use_websets):
        try:
            area = Area.objects.select_related('city').get(slug=area_slug, city__slug=city_slug)
            category = Category.objects.get(slug=cat_slug)
        except (Area.DoesNotExist, Category.DoesNotExist) as e:
            self.stderr.write(f'Not found: {e}')
            return

        self.stdout.write(f'Populating: {area.city.name} / {area.name} / {category.name} / {deal_type}')

        if use_websets:
            webset_id = exa_service.create_webset(
                area.city.name, area.name, category.name, deal_type
            )
            if not webset_id:
                self.stderr.write('Webset creation failed')
                return
            self.stdout.write(f'  Webset created: {webset_id}, waiting...')
            raw_results = exa_service.get_webset_items(webset_id)
        else:
            queries = claude_service.build_exa_queries(
                area.city.name, area.name, category.name, deal_type
            )
            self.stdout.write(f'  Queries: {queries}')
            raw_results = exa_service.search_deals(queries, num_results_per_query=8)

        self.stdout.write(f'  Raw results: {len(raw_results)}')

        parsed = claude_service.parse_exa_results(raw_results, area.name, category.name)
        self.stdout.write(f'  Parsed offers: {len(parsed)}')

        for o in parsed:
            try:
                Offer.objects.update_or_create(
                    restaurant_name=o.get('restaurant_name', ''),
                    area=area,
                    defaults={
                        'category': category,
                        'deal_type': o.get('deal_type', 'BOGO'),
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
            except Exception as e:
                self.stderr.write(f'  Save error: {e}')

        area.deal_count = area.offers.count()
        area.save(update_fields=['deal_count'])
        self.stdout.write(self.style.SUCCESS(f'  Done. Area now has {area.deal_count} offers.'))
