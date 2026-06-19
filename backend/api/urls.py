from django.urls import path
from . import views

urlpatterns = [
    path('cities/', views.cities_list),
    path('categories/', views.all_categories),
    path('cities/<slug:city_slug>/areas/', views.areas_list),
    path('areas/<slug:area_slug>/categories/', views.categories_list),
    path('offers/', views.offers_list),
    path('search/', views.search),
    path('search/history/', views.search_history),
    path('saved/', views.saved_list),
    path('saved/<int:offer_id>/toggle/', views.toggle_saved),
    path('admin/login/', views.admin_login),
    path('admin/logout/', views.admin_logout),
    path('admin/import-csv/', views.import_csv),
]
