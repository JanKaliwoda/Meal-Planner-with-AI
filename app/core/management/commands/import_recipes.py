import csv
import ast
from django.core.management.base import BaseCommand
from core.models import IngredientAllData, Recipe

class Command(BaseCommand):
    help = "Import recipes from test_dataset.csv"

    def handle(self, *args, **kwargs):
        with open('resources/test_dataset.csv', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row['title'].strip()
                description = row['ingredients']  # description now equals ingredients column
                steps = "\n".join(ast.literal_eval(row['directions']))  # steps equals directions
                ingredient_names = ast.literal_eval(row['NER'])  # ingredient_names equals NER column
                # Create Recipe
                recipe, _ = Recipe.objects.get_or_create(
                    name=name,
                    defaults={
                        'description': description,
                        'steps': steps,
                        'created_by_ai': False,
                    }
                )
                # Add ingredients to IngredientAllData and link to recipe
                ingredient_objs = []
                for ing_name in ingredient_names:
                    ing, _ = IngredientAllData.objects.get_or_create(
                        name=ing_name.strip()
                    )
                    ingredient_objs.append(ing)
                recipe.ingredients.set(ingredient_objs)  # Link ingredients to recipe
                recipe.save()
        self.stdout.write(self.style.SUCCESS('Recipes imported successfully.'))