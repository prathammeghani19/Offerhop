from django.contrib import admin
from .models import City, Area, Category, Offer, SavedOffer

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ['name', 'deal_count', 'sort_order']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'zone', 'deal_count']
    list_filter = ['city', 'zone']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'is_drink', 'sort_order']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ['restaurant_name', 'area', 'category', 'deal_type', 'deal_description', 'is_live', 'refreshed_at']
    list_filter = ['deal_type', 'is_live', 'area__city', 'category']
    search_fields = ['restaurant_name', 'deal_description']

@admin.register(SavedOffer)
class SavedOfferAdmin(admin.ModelAdmin):
    list_display = ['session_key', 'offer', 'saved_at']
