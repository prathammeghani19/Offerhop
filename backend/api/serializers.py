from rest_framework import serializers
from .models import City, Area, Category, Offer, SavedOffer


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ['id', 'name', 'slug', 'zone', 'deal_count']


class CitySerializer(serializers.ModelSerializer):
    deal_count = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = ['id', 'name', 'slug', 'icon', 'description', 'deal_count']

    def get_deal_count(self, obj):
        from .models import Offer
        return Offer.objects.filter(area__city=obj).count()


class CityDetailSerializer(serializers.ModelSerializer):
    areas = AreaSerializer(many=True, read_only=True)

    class Meta:
        model = City
        fields = ['id', 'name', 'slug', 'icon', 'description', 'deal_count', 'areas']


class CategorySerializer(serializers.ModelSerializer):
    deal_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'is_drink', 'deal_count']

    def get_deal_count(self, obj):
        area_slug = self.context.get('area_slug')
        if area_slug:
            return obj.offers.filter(area__slug=area_slug).count()
        return obj.offers.count()


class OfferSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source='area.name', read_only=True)
    city_name = serializers.CharField(source='area.city.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            'id', 'restaurant_name', 'area_name', 'city_name', 'category_name',
            'deal_type', 'deal_description', 'offer_detail', 'savings_amount', 'savings_percent',
            'valid_until', 'rating', 'review_count', 'distance_km',
            'is_live', 'is_pre_book', 'is_bank_offer', 'source_url', 'thumbnail_emoji', 'is_saved',
        ]

    def get_is_saved(self, obj):
        session_key = self.context.get('session_key')
        if session_key:
            return obj.saves.filter(session_key=session_key).exists()
        return False


class SavedOfferSerializer(serializers.ModelSerializer):
    offer = OfferSerializer(read_only=True)

    class Meta:
        model = SavedOffer
        fields = ['id', 'offer', 'saved_at']
