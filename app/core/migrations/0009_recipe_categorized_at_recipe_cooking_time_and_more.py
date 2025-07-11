# Generated by Django 5.2.4 on 2025-07-09 13:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_ingredient_notes_alter_shoppinglist_items_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='categorized_at',
            field=models.DateTimeField(blank=True, help_text='When the recipe was categorized', null=True),
        ),
        migrations.AddField(
            model_name='recipe',
            name='cooking_time',
            field=models.CharField(blank=True, choices=[('Under 30 mins', 'Under 30 mins'), ('30-60 mins', '30-60 mins'), ('1-2 hours', '1-2 hours'), ('Over 2 hours', 'Over 2 hours')], help_text='Estimated cooking time', max_length=30, null=True),
        ),
        migrations.AddField(
            model_name='recipe',
            name='cuisine_type',
            field=models.CharField(blank=True, choices=[('Italian', 'Italian'), ('Mexican', 'Mexican'), ('Asian', 'Asian'), ('American', 'American'), ('Mediterranean', 'Mediterranean'), ('Indian', 'Indian'), ('Thai', 'Thai'), ('Chinese', 'Chinese'), ('French', 'French'), ('Greek', 'Greek'), ('Middle Eastern', 'Middle Eastern'), ('Japanese', 'Japanese'), ('Korean', 'Korean'), ('Spanish', 'Spanish'), ('British', 'British'), ('German', 'German'), ('Other', 'Other')], help_text='Cuisine type of the recipe', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='recipe',
            name='difficulty',
            field=models.CharField(blank=True, choices=[('Easy', 'Easy'), ('Medium', 'Medium'), ('Hard', 'Hard')], help_text='Difficulty level of the recipe', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='recipe',
            name='tags',
            field=models.JSONField(blank=True, default=list, help_text='Tags for the recipe (vegetarian, spicy, healthy, etc.)'),
        ),
    ]
