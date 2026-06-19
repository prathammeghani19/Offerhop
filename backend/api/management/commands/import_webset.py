"""
Import offers from an Exa Webset CSV file.

Usage:
  python manage.py import_webset <csv_file> --area=koramangala --city=bangalore --category=beer --deal-type=BOGO

deal-type choices: BOGO, COMBO, PERCENT_OFF
If omitted, deal type is auto-detected from offer text.
"""
import csv
import re
from django.core.management.base import BaseCommand, CommandError
from api.models import City, Area, Category, Offer

CATEGORY_EMOJI = {
    'beer': '🍺', 'cocktails': '🍹', 'mocktails': '🥤',
    'craft-beer': '🍻', 'spirits': '🥃', 'biryani': '🍛',
    'pizza': '🍕', 'burger': '🍔', 'sandwich': '🥪',
    'wrap-rolls': '🌯', 'bakery': '🥐', 'desserts': '🍰',
    'healthy-meals': '🥗', 'tea-snacks': '🫖', 'chinese': '🥡',
    'pasta': '🍝', 'south-indian': '🥘', 'north-indian': '🍲',
    'shakes': '🍦', 'sweets': '🧁',
}

_BOGO_RE = re.compile(r'bogo|buy\s*one\s*get\s*one|1\s*\+\s*1|buy\s*1\s*get\s*1', re.I)
_COMBO_RE = re.compile(r'\bcombo\b|for\s*2\b|meal\s*deal', re.I)
_PCT_RE = re.compile(r'\d+\s*%\s*off|\d+\s*percent\s*off', re.I)
_PCT_VAL = re.compile(r'(\d+)\s*%\s*off', re.I)
_INR_RE = re.compile(r'(?:₹|rs\.?\s*)(\d[\d,]*)', re.I)
_VALID_RE = re.compile(r'((?:valid|till|until|today|weekends?|happy\s*hour|daily)[^\.\n]{0,60})', re.I)
_RATING_RE = re.compile(r'(\d\.\d)\s*(?:/5|★|stars?)', re.I)


def _detect_deal_type(text):
    if _BOGO_RE.search(text): return 'BOGO'
    if _COMBO_RE.search(text): return 'COMBO'
    if _PCT_RE.search(text): return 'PERCENT_OFF'
    return 'BOGO'


def _clean_title(title):
    title = re.sub(r'\s*[|\-–]\s*(Bangalore|Bengaluru|Book Table|Order Online|Zomato|Swiggy|Dineout).*', '', title, flags=re.I)
    return title.strip()[:200]


class Command(BaseCommand):
    help = 'Import offers from an Exa Webset CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str)
        parser.add_argument('--area', required=True, help='Area slug e.g. koramangala')
        parser.add_argument('--city', required=True, help='City slug e.g. bangalore')
        parser.add_argument('--category', required=True, help='Category slug e.g. beer')
        parser.add_argument('--deal-type', default='', help='Force deal type: BOGO / COMBO / PERCENT_OFF')
        parser.add_argument('--clear', action='store_true', help='Delete existing offers for this area+category before import')

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        area_slug = options['area']
        city_slug = options['city']
        category_slug = options['category']
        forced_deal_type = options['deal_type'].upper() if options['deal_type'] else ''

        try:
            city = City.objects.get(slug=city_slug)
        except City.DoesNotExist:
            raise CommandError(f"City '{city_slug}' not found. Run seed_data first.")

        try:
            area = Area.objects.get(slug=area_slug, city=city)
        except Area.DoesNotExist:
            raise CommandError(f"Area '{area_slug}' not found under {city.name}.")

        try:
            category = Category.objects.get(slug=category_slug)
        except Category.DoesNotExist:
            raise CommandError(f"Category '{category_slug}' not found.")

        emoji = CATEGORY_EMOJI.get(category_slug, '🍽')

        if options['clear']:
            deleted, _ = Offer.objects.filter(area=area, category=category).delete()
            self.stdout.write(f'Cleared {deleted} existing offers for {area.name} / {category.name}')

        imported = 0
        skipped = 0

        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Only import rows where all criteria passed
                criteria_cols = [k for k in row if '(Criterion)' in k]
                if any(row.get(c, '').strip().lower() == 'no' for c in criteria_cols):
                    skipped += 1
                    continue

                url = row.get('URL', '').strip()
                title = _clean_title(row.get('Title', ''))
                offer_summary = row.get('Offer Summary (Result)', '').strip()
                offer_details = row.get('Offer Details (Result)', '').strip()
                description_col = row.get('Description', '').strip()

                if not title and not url:
                    skipped += 1
                    continue

                combined_text = f"{offer_summary} {offer_details} {description_col}"

                deal_type = forced_deal_type or _detect_deal_type(combined_text)
                if deal_type not in ('BOGO', 'COMBO', 'PERCENT_OFF'):
                    deal_type = 'BOGO'

                deal_description = offer_summary[:300] if offer_summary else f'{deal_type.replace("_", " ").title()} {category.name}'

                savings_percent = None
                m = _PCT_VAL.search(combined_text)
                if m:
                    v = int(m.group(1))
                    savings_percent = v if 5 <= v <= 80 else None

                savings_amount = None
                for m in _INR_RE.finditer(combined_text):
                    try:
                        v = float(m.group(1).replace(',', ''))
                        if v <= 5000:
                            savings_amount = v
                            break
                    except ValueError:
                        pass

                valid_until = ''
                m = _VALID_RE.search(combined_text)
                if m:
                    valid_until = m.group(1).strip()[:80]

                rating = None
                m = _RATING_RE.search(combined_text)
                if m:
                    try:
                        v = float(m.group(1))
                        rating = v if 1.0 <= v <= 5.0 else None
                    except ValueError:
                        pass

                is_live = bool(re.search(r'happy\s*hour|open\s*now|today|daily', combined_text, re.I))

                Offer.objects.update_or_create(
                    restaurant_name=title,
                    area=area,
                    deal_type=deal_type,
                    defaults={
                        'category': category,
                        'deal_description': deal_description,
                        'savings_amount': savings_amount,
                        'savings_percent': savings_percent,
                        'valid_until': valid_until,
                        'rating': rating,
                        'review_count': 0,
                        'is_live': is_live,
                        'source_url': url[:500],
                        'thumbnail_emoji': emoji,
                    }
                )
                imported += 1
                self.stdout.write(f'  ✓ {title[:60]}')

        # Sync deal counts
        area.deal_count = area.offers.count()
        area.save(update_fields=['deal_count'])
        city.deal_count = Offer.objects.filter(area__city=city).count()
        city.save(update_fields=['deal_count'])

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — imported {imported}, skipped {skipped} rows.'
        ))
