from django.core.management.base import BaseCommand
from api.models import City, Area, Category, Offer


CITIES = [
    {'name': 'Bangalore',  'slug': 'bangalore',  'icon': '🌆', 'description': '', 'sort_order': 1},
    {'name': 'Delhi',      'slug': 'delhi',      'icon': '🏛',  'description': '', 'sort_order': 2},
    {'name': 'Mumbai',     'slug': 'mumbai',     'icon': '🌊', 'description': '', 'sort_order': 3},
    {'name': 'Gurgaon',    'slug': 'gurgaon',    'icon': '🏙️', 'description': '', 'sort_order': 4},
    {'name': 'Pune',       'slug': 'pune',       'icon': '🎭', 'description': '', 'sort_order': 5},
    {'name': 'Hyderabad',  'slug': 'hyderabad',  'icon': '🕌', 'description': '', 'sort_order': 6},
]

AREAS = {
    'bangalore': [
        {'name': 'Indiranagar',    'slug': 'indiranagar',    'zone': 'East'},
        {'name': 'Koramangala',    'slug': 'koramangala',    'zone': 'South'},
        {'name': 'MG Road',        'slug': 'mg-road',        'zone': 'Central'},
        {'name': 'Brigade Road',   'slug': 'brigade-road',   'zone': 'Central'},
        {'name': 'HSR Layout',     'slug': 'hsr-layout',     'zone': 'South'},
        {'name': 'Whitefield',     'slug': 'whitefield',     'zone': 'East'},
        {'name': 'Marathahalli',   'slug': 'marathahalli',   'zone': 'East'},
        {'name': 'JP Nagar',       'slug': 'jp-nagar',       'zone': 'South'},
        {'name': 'Jayanagar',      'slug': 'jayanagar',      'zone': 'South'},
        {'name': 'BTM Layout',     'slug': 'btm-layout',     'zone': 'South'},
        {'name': 'Hebbal',         'slug': 'hebbal',         'zone': 'North'},
        {'name': 'Yelahanka',      'slug': 'yelahanka',      'zone': 'North'},
    ],
    'delhi': [
        {'name': 'Hauz Khas',          'slug': 'hauz-khas',        'zone': 'South Delhi'},
        {'name': 'Connaught Place',    'slug': 'cp',               'zone': 'Central'},
        {'name': 'Lajpat Nagar',       'slug': 'lajpat-nagar',     'zone': 'South Delhi'},
        {'name': 'Saket',              'slug': 'saket',            'zone': 'South Delhi'},
        {'name': 'Khan Market',        'slug': 'khan-market',      'zone': 'Central'},
        {'name': 'Vasant Kunj',        'slug': 'vasant-kunj',      'zone': 'South Delhi'},
        {'name': 'Rajouri Garden',     'slug': 'rajouri-garden',   'zone': 'West Delhi'},
    ],
    'mumbai': [
        {'name': 'Bandra West',        'slug': 'bandra-west',      'zone': 'Western Suburbs'},
        {'name': 'Lower Parel',        'slug': 'lower-parel',      'zone': 'Central'},
        {'name': 'Andheri West',       'slug': 'andheri-west',     'zone': 'Western Suburbs'},
        {'name': 'Juhu',               'slug': 'juhu',             'zone': 'Western Suburbs'},
        {'name': 'Colaba',             'slug': 'colaba',           'zone': 'South Mumbai'},
        {'name': 'Powai',              'slug': 'powai',            'zone': 'Eastern Suburbs'},
        {'name': 'Worli',              'slug': 'worli',            'zone': 'Central'},
    ],
    'gurgaon': [
        {'name': 'Sector 29',          'slug': 'sector-29',        'zone': 'Old Gurgaon'},
        {'name': 'Cyber City',         'slug': 'cyber-city',       'zone': 'DLF'},
        {'name': 'Golf Course Road',   'slug': 'golf-course-road', 'zone': 'South Gurgaon'},
        {'name': 'MG Road',            'slug': 'mg-road-gurgaon',  'zone': 'Central'},
        {'name': 'DLF Phase 4',        'slug': 'dlf-phase-4',      'zone': 'DLF'},
        {'name': 'Sohna Road',         'slug': 'sohna-road',       'zone': 'South Gurgaon'},
    ],
    'pune': [
        {'name': 'Koregaon Park',      'slug': 'koregaon-park',    'zone': 'East Pune'},
        {'name': 'Baner',              'slug': 'baner',            'zone': 'West Pune'},
        {'name': 'Viman Nagar',        'slug': 'viman-nagar',      'zone': 'East Pune'},
        {'name': 'FC Road',            'slug': 'fc-road',          'zone': 'Central'},
        {'name': 'Kothrud',            'slug': 'kothrud',          'zone': 'West Pune'},
        {'name': 'Aundh',              'slug': 'aundh',            'zone': 'North West'},
    ],
    'hyderabad': [
        {'name': 'Banjara Hills',      'slug': 'banjara-hills',    'zone': 'West'},
        {'name': 'Jubilee Hills',      'slug': 'jubilee-hills',    'zone': 'West'},
        {'name': 'Madhapur',           'slug': 'madhapur',         'zone': 'West'},
        {'name': 'Gachibowli',         'slug': 'gachibowli',       'zone': 'West'},
        {'name': 'Hitech City',        'slug': 'hitech-city',      'zone': 'West'},
        {'name': 'Kondapur',           'slug': 'kondapur',         'zone': 'West'},
    ],
}

CATEGORIES = [
    # ── Drinks ──────────────────────────────────────────────────────────────
    {'name': 'Beer',            'slug': 'beer',           'icon': '🍺', 'is_drink': True,  'sort_order': 1},
    {'name': 'Cocktails',       'slug': 'cocktails',      'icon': '🍹', 'is_drink': True,  'sort_order': 2},
    {'name': 'Mocktails',       'slug': 'mocktails',      'icon': '🥤', 'is_drink': True,  'sort_order': 3},
    {'name': 'Craft Beer',      'slug': 'craft-beer',     'icon': '🍻', 'is_drink': True,  'sort_order': 4},
    {'name': 'Spirits',         'slug': 'spirits',        'icon': '🥃', 'is_drink': True,  'sort_order': 5},
    # ── Food ────────────────────────────────────────────────────────────────
    {'name': 'Biryani',         'slug': 'biryani',        'icon': '🍛', 'is_drink': False, 'sort_order': 6},
    {'name': 'Pizza',           'slug': 'pizza',          'icon': '🍕', 'is_drink': False, 'sort_order': 7},
    {'name': 'Burger',          'slug': 'burger',         'icon': '🍔', 'is_drink': False, 'sort_order': 8},
    {'name': 'Sandwich',        'slug': 'sandwich',       'icon': '🥪', 'is_drink': False, 'sort_order': 9},
    {'name': 'Wrap & Rolls',    'slug': 'wrap-rolls',     'icon': '🌯', 'is_drink': False, 'sort_order': 10},
    {'name': 'Bakery',          'slug': 'bakery',         'icon': '🥐', 'is_drink': False, 'sort_order': 11},
    {'name': 'Desserts',        'slug': 'desserts',       'icon': '🍰', 'is_drink': False, 'sort_order': 12},
    {'name': 'Healthy Meals',   'slug': 'healthy-meals',  'icon': '🥗', 'is_drink': False, 'sort_order': 13},
    {'name': 'Tea & Snacks',    'slug': 'tea-snacks',     'icon': '🫖', 'is_drink': False, 'sort_order': 14},
    {'name': 'Chinese',         'slug': 'chinese',        'icon': '🥡', 'is_drink': False, 'sort_order': 15},
    {'name': 'Pasta',           'slug': 'pasta',          'icon': '🍝', 'is_drink': False, 'sort_order': 16},
    {'name': 'South Indian',    'slug': 'south-indian',   'icon': '🥘', 'is_drink': False, 'sort_order': 17},
    {'name': 'North Indian',    'slug': 'north-indian',   'icon': '🍲', 'is_drink': False, 'sort_order': 18},
    {'name': 'Shakes & Ice Cream', 'slug': 'shakes',     'icon': '🍦', 'is_drink': False, 'sort_order': 19},
    {'name': 'Sweets',          'slug': 'sweets',         'icon': '🧁', 'is_drink': False, 'sort_order': 20},
]

DEMO_OFFERS = [
    # Bangalore – Indiranagar
    {
        'restaurant_name': 'Meghana Foods',
        'area_slug': 'indiranagar', 'city_slug': 'bangalore', 'category_slug': 'biryani',
        'deal_type': 'BOGO', 'deal_description': 'BOGO Biryani',
        'savings_amount': 220, 'valid_until': 'Valid till 11 PM',
        'rating': 4.6, 'review_count': 1240, 'distance_km': 0.4,
        'is_live': True, 'thumbnail_emoji': '🍛',
    },
    {
        'restaurant_name': 'Biryani Blues',
        'area_slug': 'indiranagar', 'city_slug': 'bangalore', 'category_slug': 'biryani',
        'deal_type': 'COMBO', 'deal_description': 'Combo ₹299 for 2',
        'savings_amount': 150, 'valid_until': 'Today only',
        'rating': 4.2, 'review_count': 340, 'distance_km': 0.8,
        'is_live': False, 'thumbnail_emoji': '🍛',
    },
    {
        'restaurant_name': 'The Biere Club',
        'area_slug': 'indiranagar', 'city_slug': 'bangalore', 'category_slug': 'craft-beer',
        'deal_type': 'BOGO', 'deal_description': 'BOGO Craft Pints 4-7 PM',
        'savings_amount': 350, 'valid_until': 'Happy hours 4–7 PM',
        'rating': 4.5, 'review_count': 780, 'distance_km': 0.6,
        'is_live': True, 'thumbnail_emoji': '🍺',
    },
    # Gurgaon – Sector 29
    {
        'restaurant_name': 'Farzi Cafe',
        'area_slug': 'sector-29', 'city_slug': 'gurgaon', 'category_slug': 'cocktails',
        'deal_type': 'BOGO', 'deal_description': 'BOGO Cocktails 5-8 PM',
        'savings_amount': 400, 'valid_until': 'Happy hours 5–8 PM',
        'rating': 4.4, 'review_count': 2100, 'distance_km': 0.2,
        'is_live': True, 'thumbnail_emoji': '🍹',
    },
    {
        'restaurant_name': 'Social',
        'area_slug': 'sector-29', 'city_slug': 'gurgaon', 'category_slug': 'craft-beer',
        'deal_type': 'PERCENT_OFF', 'deal_description': '30% off on food + drinks',
        'savings_percent': 30, 'savings_amount': 300, 'valid_until': 'Weekdays till 7 PM',
        'rating': 4.3, 'review_count': 3200, 'distance_km': 0.3,
        'is_live': True, 'thumbnail_emoji': '🍺',
    },
    # Pune – Koregaon Park
    {
        'restaurant_name': 'Malaka Spice',
        'area_slug': 'koregaon-park', 'city_slug': 'pune', 'category_slug': 'cocktails',
        'deal_type': 'BOGO', 'deal_description': 'BOGO Cocktails',
        'savings_amount': 350, 'valid_until': 'Till 8 PM daily',
        'rating': 4.5, 'review_count': 890, 'distance_km': 0.5,
        'is_live': True, 'thumbnail_emoji': '🍹',
    },
    # Delhi – Hauz Khas
    {
        'restaurant_name': 'Imperfecto',
        'area_slug': 'hauz-khas', 'city_slug': 'delhi', 'category_slug': 'cocktails',
        'deal_type': 'BOGO', 'deal_description': 'BOGO on all cocktails',
        'savings_amount': 450, 'valid_until': 'Happy hours 5–8 PM',
        'rating': 4.3, 'review_count': 1800, 'distance_km': 0.1,
        'is_live': True, 'thumbnail_emoji': '🍹',
    },
    # Mumbai – Bandra
    {
        'restaurant_name': "Pizza Express",
        'area_slug': 'bandra-west', 'city_slug': 'mumbai', 'category_slug': 'pizza',
        'deal_type': 'BOGO', 'deal_description': 'BOGO on any Classic Pizza',
        'savings_amount': 499, 'valid_until': 'Weekends only',
        'rating': 4.1, 'review_count': 1560, 'distance_km': 0.3,
        'is_live': True, 'thumbnail_emoji': '🍕',
    },
    # Hyderabad – Banjara Hills
    {
        'restaurant_name': 'Paradise Biryani',
        'area_slug': 'banjara-hills', 'city_slug': 'hyderabad', 'category_slug': 'biryani',
        'deal_type': 'COMBO', 'deal_description': 'Combo Biryani ₹399 for 2',
        'savings_amount': 200, 'valid_until': 'Daily lunch 12–3 PM',
        'rating': 4.7, 'review_count': 5400, 'distance_km': 0.4,
        'is_live': True, 'thumbnail_emoji': '🍛',
    },
]


class Command(BaseCommand):
    help = 'Seed cities, areas, categories and demo offers'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear all data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('Clearing existing data...')
            City.objects.all().delete()
            Category.objects.all().delete()

        # Remove cities no longer in the list
        city_slugs = {c['slug'] for c in CITIES}
        removed = City.objects.exclude(slug__in=city_slugs)
        if removed.exists():
            self.stdout.write(f'Removing old cities: {[c.slug for c in removed]}')
            removed.delete()

        # Remove categories no longer in the list
        cat_slugs = {c['slug'] for c in CATEGORIES}
        stale_cats = Category.objects.exclude(slug__in=cat_slugs)
        if stale_cats.exists():
            self.stdout.write(f'Removing old categories: {[c.slug for c in stale_cats]}')
            stale_cats.delete()

        self.stdout.write('Seeding cities...')
        city_map = {}
        for c in CITIES:
            city, _ = City.objects.update_or_create(slug=c['slug'], defaults=c)
            city_map[c['slug']] = city

        self.stdout.write('Seeding areas...')
        area_map = {}
        for city_slug, areas in AREAS.items():
            city = city_map.get(city_slug)
            if not city:
                continue
            for a in areas:
                area, _ = Area.objects.update_or_create(
                    city=city, slug=a['slug'],
                    defaults={'name': a['name'], 'zone': a['zone']}
                )
                area_map[a['slug']] = area

        self.stdout.write('Seeding categories...')
        cat_map = {}
        for c in CATEGORIES:
            cat, _ = Category.objects.update_or_create(slug=c['slug'], defaults=c)
            cat_map[c['slug']] = cat

        self.stdout.write('Seeding demo offers...')
        for o in DEMO_OFFERS:
            area = area_map.get(o['area_slug'])
            cat  = cat_map.get(o['category_slug'])
            if not area or not cat:
                self.stdout.write(f"  Skipping {o['restaurant_name']} — area/cat not found")
                continue
            Offer.objects.update_or_create(
                restaurant_name=o['restaurant_name'],
                area=area,
                defaults={
                    'category':        cat,
                    'deal_type':       o['deal_type'],
                    'deal_description': o['deal_description'],
                    'savings_amount':  o.get('savings_amount'),
                    'savings_percent': o.get('savings_percent'),
                    'valid_until':     o.get('valid_until', ''),
                    'rating':          o.get('rating'),
                    'review_count':    o.get('review_count', 0),
                    'distance_km':     o.get('distance_km'),
                    'is_live':         o.get('is_live', False),
                    'thumbnail_emoji': o.get('thumbnail_emoji', '🍽'),
                }
            )

        # Sync deal counts
        for area in Area.objects.all():
            area.deal_count = area.offers.count()
            area.save(update_fields=['deal_count'])
        for city in City.objects.all():
            city.deal_count = Offer.objects.filter(area__city=city).count()
            city.save(update_fields=['deal_count'])

        self.stdout.write(self.style.SUCCESS('Seed complete.'))
