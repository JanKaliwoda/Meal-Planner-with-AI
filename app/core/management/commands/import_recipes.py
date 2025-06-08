import csv
import ast
from django.core.management.base import BaseCommand
from core.models import IngredientAllData, Recipe

class Command(BaseCommand):
    help = "Import recipes from test_dataset.csv"

    def handle(self, *args, **kwargs):
        with open('resources/test_dataset.csv', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            counter = 1
            for row in reader:
                name = row['title'].strip()
                description = row['ingredients']
                steps = "\n".join(ast.literal_eval(row['directions']))
                ingredient_names = ast.literal_eval(row['NER'])
                
                # Create Recipe
                recipe, created = Recipe.objects.get_or_create(
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
                recipe.ingredients.set(ingredient_objs)
                recipe.save()

                # Print progress message
                status = "Added" if created else "Updated"
                self.stdout.write(f"{status} recipe number {counter}: {name}")
                counter += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully processed {counter-1} recipes.'))