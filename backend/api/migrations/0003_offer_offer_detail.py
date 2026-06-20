from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_adminsession'),
    ]

    operations = [
        migrations.AddField(
            model_name='offer',
            name='offer_detail',
            field=models.TextField(blank=True, default=''),
        ),
    ]
