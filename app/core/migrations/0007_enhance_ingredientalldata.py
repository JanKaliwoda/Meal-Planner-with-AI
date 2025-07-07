# Generated migration for enhanced IngredientAllData model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_ingredientalldata_contains_allergens_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='ingredientalldata',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='ingredientalldata',
            name='is_verified',
            field=models.BooleanField(default=False, help_text='Whether this ingredient has been manually verified'),
        ),
        migrations.AddField(
            model_name='ingredientalldata',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AlterModelOptions(
            name='ingredientalldata',
            options={'ordering': ['name'], 'verbose_name': 'Ingredient', 'verbose_name_plural': 'Ingredients'},
        ),
    ]
