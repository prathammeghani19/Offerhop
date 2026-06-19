from django.db import models


class City(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=10, default='🏙')
    description = models.CharField(max_length=200, blank=True)
    deal_count = models.IntegerField(default=0)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'cities'

    def __str__(self):
        return self.name


class Area(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='areas')
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    zone = models.CharField(max_length=50, blank=True)
    deal_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('city', 'slug')
        ordering = ['zone', 'name']

    def __str__(self):
        return f'{self.name}, {self.city.name}'


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=10, default='🍽')
    is_drink = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


DEAL_TYPE_CHOICES = [
    ('BOGO', 'Buy One Get One'),
    ('COMBO', 'Combo Deal'),
    ('PERCENT_OFF', '% Off'),
]


class Offer(models.Model):
    restaurant_name = models.CharField(max_length=200)
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='offers')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='offers')
    deal_type = models.CharField(max_length=20, choices=DEAL_TYPE_CHOICES)
    deal_description = models.CharField(max_length=300)
    savings_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    savings_percent = models.IntegerField(null=True, blank=True)
    valid_until = models.CharField(max_length=100, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    review_count = models.IntegerField(default=0)
    distance_km = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    is_live = models.BooleanField(default=False)
    source_url = models.URLField(blank=True)
    thumbnail_emoji = models.CharField(max_length=10, default='🍽')
    created_at = models.DateTimeField(auto_now_add=True)
    refreshed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-savings_amount', '-is_live']

    def __str__(self):
        return f'{self.restaurant_name} — {self.deal_description}'


class SavedOffer(models.Model):
    session_key = models.CharField(max_length=40)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='saves')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session_key', 'offer')
        ordering = ['-saved_at']


class SearchHistory(models.Model):
    session_key = models.CharField(max_length=40)
    query = models.CharField(max_length=300)
    city = models.CharField(max_length=100, blank=True)
    result_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-searched_at']


class AdminSession(models.Model):
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
