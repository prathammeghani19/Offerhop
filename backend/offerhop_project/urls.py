from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from api.views_seo import sitemap_xml

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('sitemap.xml', sitemap_xml),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
