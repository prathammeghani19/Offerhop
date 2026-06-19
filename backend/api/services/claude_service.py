"""
Claude-powered query builder and result parser for OffferHop.

Two uses:
  1. build_exa_queries() — Claude generates diverse, targeted Exa search queries
  2. parse_exa_results() — Claude reads raw page content and extracts structured offer data
     (regex fallback if Claude is unavailable)
"""
import re
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

_CATEGORY_EMOJI = {
    'beer': '🍺', 'cocktails': '🍹', 'mocktails': '🥤',
    'craft beer': '🍻', 'craft-beer': '🍻', 'spirits': '🥃',
    'biryani': '🍛', 'pizza': '🍕', 'burger': '🍔', 'burgers': '🍔',
    'sandwich': '🥪', 'wrap & rolls': '🌯', 'wrap-rolls': '🌯',
    'bakery': '🥐', 'desserts': '🍰', 'healthy meals': '🥗', 'healthy-meals': '🥗',
    'tea & snacks': '🫖', 'tea-snacks': '🫖', 'chinese': '🥡',
    'pasta': '🍝', 'south indian': '🥘', 'south-indian': '🥘',
    'north indian': '🍲', 'north-indian': '🍲',
    'shakes & ice cream': '🍦', 'shakes': '🍦',
    'sweets': '🧁',
}

_DEAL_TERMS = {
    'BOGO':        ('BOGO "buy one get one"', 'buy one get one free', '1+1 offer'),
    'COMBO':       ('combo meal deal',        'combo offer',          'combo deal'),
    'PERCENT_OFF': ('percent off discount',   '% off offer',          'flat discount'),
    'ALL':         ('food deal offer',        'restaurant discount',  'special offer'),
}


def _get_claude():
    import anthropic
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


# ── Webset CSV → Structured Offers (Claude validation layer) ──────────────────

def parse_csv_rows(rows: list, city_name: str, area_name: str, category_name: str, category_slug: str) -> list:
    """
    Send webset CSV rows to Claude for structured extraction + validation.
    Returns a list of validated offer dicts ready for DB upsert.
    Falls back to regex if Claude is unavailable.
    """
    if not rows:
        return []

    emoji = _emoji_for(category_slug)

    if settings.ANTHROPIC_API_KEY:
        try:
            return _claude_parse_csv(rows, city_name, area_name, category_name, category_slug, emoji)
        except Exception as e:
            logger.error(f"Claude CSV parsing failed: {e}")

    return _regex_parse_csv(rows, area_name, category_name, emoji)


def _claude_parse_csv(rows, city_name, area_name, category_name, category_slug, emoji):
    entries = []
    for i, r in enumerate(rows):
        title = (r.get('Title') or '').strip()
        url = (r.get('URL') or '').strip()
        summary = (r.get('Offer Summary (Result)') or '').strip()
        details = (r.get('Offer Details (Result)') or '').strip()
        desc = (r.get('Description') or '')[:300].strip()
        entries.append(
            f"[{i+1}] {title}\nURL: {url}\nOffer: {summary}\nDetails: {details}\nDesc: {desc}"
        )

    prompt = f"""You are structuring restaurant deal data for OffferHop, a food & drink deals app for Indian cities.

Category: {category_name}
Area: {area_name}, City: {city_name}

For each entry below, extract the deal and return a JSON array.

SCHEMA (each object):
{{
  "restaurant_name": "Clean venue name only (no city/platform suffixes)",
  "deal_type": "BOGO" or "COMBO" or "PERCENT_OFF",
  "deal_description": "One punchy line describing the exact deal, max 150 chars",
  "savings_amount": null or number in INR,
  "savings_percent": null or integer 5-80,
  "valid_until": null or short string like "Daily till 7 PM",
  "rating": null or float 1.0-5.0,
  "is_live": true or false,
  "source_url": "exact URL from entry",
  "include": true or false
}}

RULES:
- "include": true only if this is a real restaurant deal (happy hours, BOGO, combo, % off food/drinks)
- "include": false for bank/card offers, fintech cashback, delivery promo codes
- Happy hour beer/cocktail deals → BOGO
- Set menus / combo platters → COMBO
- Percentage discounts → PERCENT_OFF

ENTRIES:
{chr(10).join(entries)}

Return ONLY the JSON array."""

    client = _get_claude()
    msg = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=4096,
        messages=[{'role': 'user', 'content': prompt}],
    )

    parsed = _extract_json_array(msg.content[0].text.strip())
    if not parsed:
        logger.warning("Claude returned no parseable JSON; falling back to regex")
        return _regex_parse_csv(rows, area_name, category_name, emoji)

    offers = []
    for o in parsed:
        if not o.get('include', True):
            continue
        name = str(o.get('restaurant_name') or '').strip()[:200]
        url = str(o.get('source_url') or '').strip()
        if not name:
            continue
        dtype = o.get('deal_type', 'BOGO')
        if dtype not in ('BOGO', 'COMBO', 'PERCENT_OFF'):
            dtype = 'BOGO'
        offers.append({
            'restaurant_name': name,
            'deal_type': dtype,
            'deal_description': str(o.get('deal_description') or '')[:300],
            'savings_amount': _safe_float(o.get('savings_amount')),
            'savings_percent': _safe_int(o.get('savings_percent')),
            'valid_until': str(o.get('valid_until') or '')[:80],
            'rating': _safe_float(o.get('rating')),
            'review_count': 0,
            'is_live': bool(o.get('is_live', False)),
            'source_url': url[:500],
            'thumbnail_emoji': emoji,
        })

    logger.info(f"Claude validated {len(offers)}/{len(rows)} CSV rows as real offers")
    return offers


def _regex_parse_csv(rows, area_name, category_name, emoji):
    results = []
    for r in rows:
        title = (r.get('Title') or '').strip()
        url = (r.get('URL') or '').strip()
        text = ' '.join([
            r.get('Offer Summary (Result)') or '',
            r.get('Offer Details (Result)') or '',
            r.get('Description') or '',
        ])
        if not text.strip():
            continue

        dtype = _detect_deal_type_csv(text)
        results.append({
            'restaurant_name': _clean_title_csv(title)[:200],
            'deal_type': dtype,
            'deal_description': (r.get('Offer Summary (Result)') or f'{dtype} {category_name}')[:300],
            'savings_amount': None,
            'savings_percent': None,
            'valid_until': '',
            'rating': None,
            'review_count': 0,
            'is_live': bool(re.search(r'happy.?hour|open now|daily|today', text, re.I)),
            'source_url': url[:500],
            'thumbnail_emoji': emoji,
        })
    return results


def _detect_deal_type_csv(text):
    if re.search(r'bogo|buy.?one.?get.?one|1\+1|buy 1 get 1', text, re.I): return 'BOGO'
    if re.search(r'\bcombo\b|for 2\b|set menu|meal deal', text, re.I): return 'COMBO'
    if re.search(r'\d+\s*%\s*off|\d+ percent off', text, re.I): return 'PERCENT_OFF'
    return 'BOGO'


def _clean_title_csv(title):
    title = re.sub(r'\s*[|\-–]\s*(Bangalore|Bengaluru|Book Table|Order Online|Zomato|Swiggy|Dineout|EazyDiner).*', '', title, flags=re.I)
    return title.strip()


# ── Query Building ────────────────────────────────────────────────────────────

def build_exa_queries(city: str, area: str, category: str, deal_type: str) -> list:
    """
    Use Claude to generate 5 diverse Exa search queries for deal discovery.
    Falls back to templates if Claude is unavailable.
    """
    if settings.ANTHROPIC_API_KEY:
        try:
            return _claude_build_queries(city, area, category, deal_type)
        except Exception as e:
            logger.error(f"Claude query generation failed: {e}")

    return _template_queries(city, area, category, deal_type)


def _claude_build_queries(city, area, category, deal_type):
    deal_label = {
        'BOGO':        'BOGO / buy one get one free',
        'COMBO':       'combo meal / bundle deals',
        'PERCENT_OFF': 'percent off / flat discount offers',
        'ALL':         'food and drink deals and discounts',
    }.get(deal_type, 'food deals')

    prompt = f"""Generate 5 diverse search queries to find {deal_label} for {category} restaurants in {area}, {city}, India.

Mix sources: restaurant websites, food blogs, deal aggregators (Zomato, EazyDiner, Dineout), review sites.
Use Indian deal terms: BOGO, combo, happy hours, flat off, 1+1, buy one get one.
Target active deals (2024-2025).

Return exactly 5 queries, one per line, no numbering, no explanations."""

    client = _get_claude()
    msg = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=250,
        messages=[{'role': 'user', 'content': prompt}],
    )
    lines = [re.sub(r'^\d+[\.\)]\s*', '', l).strip()
             for l in msg.content[0].text.strip().split('\n')]
    queries = [q for q in lines if q and len(q) > 10]
    return queries[:5] if queries else _template_queries(city, area, category, deal_type)


def _template_queries(city, area, category, deal_type):
    terms = _DEAL_TERMS.get(deal_type, _DEAL_TERMS['ALL'])
    aggregators = 'site:zomato.com OR site:eazydiner.com OR site:dineout.co.in'
    return [
        f"{terms[0]} {category} restaurants {area} {city} India",
        f"{terms[1]} {category} {area} {city} {aggregators}",
        f"{terms[2]} {category} restaurant {area} {city} 2024 2025",
        f"{category} BOGO combo happy hour deal {area} {city}",
        f"best {category} deals offers {area} {city} India",
    ]


# ── Result Parsing ────────────────────────────────────────────────────────────

def parse_exa_results(raw_results: list, area: str, category: str) -> list:
    """
    Extract structured offer data from Exa raw results.
    Uses Claude when available; falls back to regex.
    """
    if not raw_results:
        return []

    if settings.ANTHROPIC_API_KEY:
        try:
            return _claude_parse(raw_results, area, category)
        except Exception as e:
            logger.error(f"Claude parsing failed: {e}")

    return _regex_parse(raw_results, area, category)


def _claude_parse(raw_results, area, category):
    emoji = _emoji_for(category)

    # Build a compact context block — cap at 15 results, 600 chars text each
    pages = []
    for i, r in enumerate(raw_results[:15]):
        title = (r.get('title') or '')[:100]
        url = r.get('url', '')
        text = (r.get('text') or '')[:600]
        hi = ' | '.join((r.get('highlights') or [])[:3])
        pages.append(f"[{i+1}] {title}\n{url}\n{text}\nHIGHLIGHTS: {hi}")

    prompt = f"""Extract food and drink deals from these {len(pages)} web pages about {category} in {area}, India.

PAGES:
{chr(10).join(pages)}

Return a JSON array. Each element = one confirmed restaurant deal. Omit pages with no deals.

Schema:
{{
  "restaurant_name": "clean name (remove platform/city/delivery noise)",
  "deal_type": "BOGO" | "COMBO" | "PERCENT_OFF",
  "deal_description": "short phrase e.g. 'BOGO Biryani', '30% off order', 'Combo ₹299 for 2'",
  "savings_amount": <INR number or null>,
  "savings_percent": <integer 5-80 or null>,
  "valid_until": "e.g. 'Valid till 11 PM' or null",
  "rating": <float out of 5 or null>,
  "review_count": <integer or null>,
  "is_live": <true if deal clearly active>,
  "source_url": "exact URL from above"
}}

Rules:
- Only include restaurant-offered deals (BOGO, happy hours, combo meals, flat % off food/drinks)
- SKIP: bank card offers, fintech/payment app cashback, voucher purchases, credit card discounts
- SKIP: delivery app promo codes or coupon codes
- 1 entry per restaurant unless they have truly different deal types (e.g. BOGO + Combo)
- BOGO=buy-one-get-one, COMBO=bundle/set meal, PERCENT_OFF=% discount on food bill
Return ONLY the JSON array."""

    client = _get_claude()
    msg = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=4096,
        messages=[{'role': 'user', 'content': prompt}],
    )

    raw = msg.content[0].text.strip()
    parsed_list = _extract_json_array(raw)
    if parsed_list is None:
        logger.warning("Claude returned no parseable JSON array; falling back to regex")
        return _regex_parse(raw_results, area, category)

    emoji = _emoji_for(category)
    offers = []
    for o in parsed_list:
        name = str(o.get('restaurant_name') or '').strip()[:120]
        url  = str(o.get('source_url') or '').strip()
        if not name or not url:
            continue
        dtype = o.get('deal_type', 'BOGO')
        if dtype not in ('BOGO', 'COMBO', 'PERCENT_OFF'):
            dtype = 'BOGO'
        offers.append({
            'restaurant_name':  name,
            'deal_type':        dtype,
            'deal_description': str(o.get('deal_description') or '')[:300],
            'savings_amount':   _safe_float(o.get('savings_amount')),
            'savings_percent':  _safe_int(o.get('savings_percent')),
            'valid_until':      str(o.get('valid_until') or '')[:80],
            'rating':           _safe_float(o.get('rating')),
            'review_count':     _safe_int(o.get('review_count')) or 0,
            'distance_km':      None,
            'is_live':          bool(o.get('is_live', False)),
            'source_url':       url[:500],
            'thumbnail_emoji':  emoji,
        })

    logger.info(f"Claude extracted {len(offers)} offers from {len(raw_results)} Exa results")
    return offers


def _extract_json_array(text: str):
    """
    Extract a JSON array from Claude's response.
    Handles: raw arrays, markdown code blocks, truncated output.
    Returns the parsed list or None.
    """
    # Strip markdown fences
    cleaned = re.sub(r'```(?:json)?\s*', '', text).strip()
    cleaned = re.sub(r'```\s*$', '', cleaned).strip()

    # Try the whole cleaned string first
    if cleaned.startswith('['):
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass  # truncated — try recovery below

    # Find the opening bracket
    start = cleaned.find('[')
    if start == -1:
        return None

    candidate = cleaned[start:]

    # Try as-is
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    # Recover truncated array: find last complete JSON object
    # Walk backwards to find the last '}'
    last_close = candidate.rfind('}')
    if last_close == -1:
        return None
    truncated = candidate[:last_close + 1].rstrip().rstrip(',') + ']'
    try:
        result = json.loads(truncated)
        logger.info(f"Recovered {len(result)} items from truncated Claude JSON")
        return result
    except json.JSONDecodeError:
        return None


def _safe_float(val):
    try:
        f = float(val)
        return f if 0 < f < 100000 else None
    except (TypeError, ValueError):
        return None


def _safe_int(val):
    try:
        return int(float(val))
    except (TypeError, ValueError):
        return None


def _emoji_for(category: str) -> str:
    return _CATEGORY_EMOJI.get(category.lower().replace(' ', '-'),
           _CATEGORY_EMOJI.get(category.lower(), '🍽'))


# ── Regex Fallback ────────────────────────────────────────────────────────────

_BOGO_RE   = [re.compile(p, re.I) for p in [r'\bbogo\b', r'buy\s*one\s*get\s*one', r'\b1\s*\+\s*1\b', r'buy\s*1\s*get\s*1']]
_COMBO_RE  = [re.compile(p, re.I) for p in [r'\bcombo\b', r'₹\s*\d+\s*for\s*2', r'meal\s*deal']]
_PCT_RE    = [re.compile(p, re.I) for p in [r'\d+\s*%\s*off', r'\d+\s*percent\s*off', r'flat\s*\d+\s*%']]
_INR_SAVE  = re.compile(r'(?:save|saved|off|discount)\s+(?:₹|rs\.?\s*)(\d[\d,]*)', re.I)
_PCT       = re.compile(r'(?:flat\s+)?(\d+)\s*%\s*off', re.I)
_RATING    = re.compile(r'(\d\.\d)\s*(?:/5|★|⭐|stars?|rated|\n\d+\n(?:Dining|Delivery)\s+Ratings|\s*\(\d+\))', re.I)
_RATING_SA = re.compile(r'^(\d\.\d)\s*$', re.M)
_VALID     = re.compile(r'((?:valid|flat|till|until|expires?|today|weekends?|happy\s*hour|limited)[^\.\n\|]{0,60})', re.I)
_REVIEW_CT = re.compile(r'(\d[\d,]+)\s*(?:reviews?|ratings?|votes?)', re.I)
_DIST      = re.compile(r'(\d+(?:\.\d+)?)\s*km', re.I)
_TITLE_NOISE = re.compile(
    r'(?:\s*[,|·\-]\s*(?:Indiranagar|Koramangala|Bengaluru|Bangalore|Hyderabad|Mumbai|Delhi|Kolkata|Jaipur'
    r'|Gurgaon|Gurugram|Pune|Banjara|Hauz Khas|Bandra|Zomato|Swiggy|EazyDiner|Dineout|Magicpin'
    r'|MagicPin|Tripadvisor|Google|Maps|Order Online|order online|Reserve Your Table|Save \d+%\s*on\s*'
    r'|online delivery).*)$',
    re.I
)
_TITLE_PREFIX = re.compile(r'^(?:Save\s+\d+%\s+on\s+|Order\s+online\s+[-–]\s+)', re.I)


def _detect_deal_type(text):
    if any(p.search(text) for p in _BOGO_RE):  return 'BOGO'
    if any(p.search(text) for p in _COMBO_RE): return 'COMBO'
    if any(p.search(text) for p in _PCT_RE):   return 'PERCENT_OFF'
    return 'BOGO'


def _deal_desc(deal_type, text, category):
    if deal_type == 'BOGO':        return f'BOGO {category.title()}'
    if deal_type == 'COMBO':
        m = re.search(r'₹\s*(\d[\d,]*)\s*for\s*2', text, re.I)
        return f'Combo ₹{m.group(1)} for 2' if m else 'Combo Deal'
    if deal_type == 'PERCENT_OFF':
        m = _PCT.search(text)
        return f'{m.group(1)}% off order' if m else '% Off Deal'
    return 'Special Offer'


def _clean_name(title, url):
    if title:
        t = _TITLE_PREFIX.sub('', title)
        t = _TITLE_NOISE.sub('', t).strip()
        if t: return t[:120]
    m = re.search(r'https?://(?:www\.)?([^/]+)', url)
    return m.group(1).split('.')[0].title() if m else 'Restaurant'


def _regex_parse(raw_results, area, category):
    emoji = _emoji_for(category)
    offers = []
    for r in raw_results:
        url   = r.get('url', '')
        title = r.get('title') or ''
        body  = (r.get('text') or '') + ' '.join(r.get('highlights') or [])
        if not body.strip():
            continue
        dtype = _detect_deal_type(body)
        desc  = _deal_desc(dtype, body, category)
        name  = _clean_name(title, url)

        savings_amount = None
        m = _INR_SAVE.search(body)
        if m:
            try:
                v = float(m.group(1).replace(',', ''))
                savings_amount = v if v <= 5000 else None
            except ValueError:
                pass

        savings_percent = None
        m = _PCT.search(body)
        if m:
            try:
                v = int(m.group(1))
                savings_percent = v if 5 <= v <= 80 else None
            except ValueError:
                pass

        rating = None
        m = _RATING.search(body)
        if m:
            try:
                v = float(m.group(1))
                rating = v if 1.0 <= v <= 5.0 else None
            except ValueError:
                pass
        if rating is None:
            for raw_r in _RATING_SA.findall(body):
                try:
                    v = float(raw_r)
                    if 1.0 <= v <= 5.0:
                        rating = v
                        break
                except ValueError:
                    pass

        review_count = 0
        m = _REVIEW_CT.search(body)
        if m:
            try:
                review_count = int(m.group(1).replace(',', ''))
            except ValueError:
                pass

        valid_until = ''
        m = _VALID.search(body)
        if m:
            valid_until = m.group(1).strip()[:80]

        distance_km = None
        m = _DIST.search(body)
        if m:
            try:
                d = float(m.group(1))
                distance_km = d if d < 50 else None
            except ValueError:
                pass

        offers.append({
            'restaurant_name':  name,
            'deal_type':        dtype,
            'deal_description': desc,
            'savings_amount':   savings_amount,
            'savings_percent':  savings_percent,
            'valid_until':      valid_until,
            'rating':           rating,
            'review_count':     review_count,
            'distance_km':      distance_km,
            'is_live':          any(p in body.lower() for p in ['open now', 'today', 'tonight', 'happy hour']),
            'source_url':       url,
            'thumbnail_emoji':  emoji,
        })

    logger.info(f"Regex parsed {len(offers)} offers from {len(raw_results)} Exa results")
    return offers
