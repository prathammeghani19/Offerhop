from django.http import HttpResponse
from .models import City, Area, Category, Offer


def sitemap_xml(request):
    urls = [
        ('https://offerhop.in/',       '1.0', 'daily'),
        ('https://offerhop.in/search', '0.6', 'weekly'),
        ('https://offerhop.in/saved',  '0.4', 'weekly'),
    ]

    try:
        cities     = list(City.objects.all())
        areas      = list(Area.objects.select_related('city').all())
        categories = list(Category.objects.all())

        # Areas that actually have offers — boost their priority
        active_area_ids = set(
            Offer.objects.values_list('area_id', flat=True).distinct()
        )
        # Category slugs that have offers per area
        active_pairs = set(
            Offer.objects.values_list('area_id', 'category_id').distinct()
        )
        cat_id_map = {c.id: c for c in categories}

        for city in cities:
            urls.append((f'https://offerhop.in/{city.slug}', '0.9', 'daily'))

        for area in areas:
            priority = '0.9' if area.id in active_area_ids else '0.7'
            urls.append((
                f'https://offerhop.in/{area.city.slug}/{area.slug}',
                priority, 'daily'
            ))
            for cat in categories:
                has_offers = (area.id, cat.id) in active_pairs
                priority   = '0.85' if has_offers else '0.6'
                urls.append((
                    f'https://offerhop.in/{area.city.slug}/{area.slug}/{cat.slug}',
                    priority, 'daily'
                ))
    except Exception:
        pass

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, priority, changefreq in urls:
        lines.append(
            f'  <url><loc>{loc}</loc>'
            f'<changefreq>{changefreq}</changefreq>'
            f'<priority>{priority}</priority></url>'
        )
    lines.append('</urlset>')

    return HttpResponse('\n'.join(lines), content_type='application/xml')
