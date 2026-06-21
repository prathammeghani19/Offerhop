from django.http import HttpResponse
from .models import City, Area, Category, Offer


def sitemap_xml(request):
    urls = [
        ('https://offerhop.in/', '1.0', 'daily'),
        ('https://offerhop.in/search', '0.5', 'weekly'),
        ('https://offerhop.in/saved', '0.3', 'weekly'),
    ]

    try:
        for city in City.objects.all():
            urls.append((f'https://offerhop.in/{city.slug}', '0.9', 'daily'))
            for area in Area.objects.filter(city=city):
                urls.append((f'https://offerhop.in/{city.slug}/{area.slug}', '0.9', 'daily'))
                cat_ids = (Offer.objects
                           .filter(area=area)
                           .values_list('category_id', flat=True)
                           .distinct())
                for cat in Category.objects.filter(id__in=cat_ids):
                    urls.append((
                        f'https://offerhop.in/{city.slug}/{area.slug}/{cat.slug}',
                        '0.8', 'daily'
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
