import csv
import ast
from django.core.management.base import BaseCommand
from core.models import IngredientAllData, Recipe

class Command(BaseCommand):
    help = "Import recipes from test_dataset.csv"

    def normalize_ingredient_name(self, name):
        """Normalize ingredient names to handle plural/singular forms"""
        name = name.strip().lower()
        
        # Common plural to singular mappings
        plural_to_singular = {
            'tomatoes': 'tomato',
            'potatoes': 'potato',
            'onions': 'onion',
            'carrots': 'carrot',
            'peppers': 'pepper',
            'mushrooms': 'mushroom',
            'garlic cloves': 'garlic',
            'cloves': 'garlic',
            'eggs': 'egg',
            'apples': 'apple',
            'bananas': 'banana',
            'strawberries': 'strawberry',
            'blueberries': 'blueberry',
            'raspberries': 'raspberry',
            'cherries': 'cherry',
            'grapes': 'grape',
            'lemons': 'lemon',
            'limes': 'lime',
            'oranges': 'orange',
            'peaches': 'peach',
            'pears': 'pear',
            'nuts': 'nut',
            'almonds': 'almond',
            'walnuts': 'walnut',
            'cashews': 'cashew',
            'pecans': 'pecan',
            'beans': 'bean',
            'chickpeas': 'chickpea',
            'lentils': 'lentil',
            'peas': 'pea',
            'herbs': 'herb',
            'spices': 'spice',
            'olives': 'olive',
            'capers': 'caper',
            'anchovies': 'anchovy',
            'sardines': 'sardine',
            'shrimp': 'shrimp',
            'scallops': 'scallop',
            'clams': 'clam',
            'mussels': 'mussel',
            'oysters': 'oyster',
        }
        
        # Check if it's a known plural form
        if name in plural_to_singular:
            return plural_to_singular[name]
        
        # Handle common plural endings
        if name.endswith('ies') and len(name) > 3:
            return name[:-3] + 'y'  # berries -> berry
        elif name.endswith('es') and len(name) > 2:
            return name[:-2]  # tomatoes -> tomato
        elif name.endswith('s') and len(name) > 1:
            return name[:-1]  # carrots -> carrot
        
        return name

    def find_ingredient_by_name(self, ingredient_name):
        """Try to find ingredient by exact match or normalized forms"""
        original_name = ingredient_name.strip()
        
        # Try exact match first
        try:
            return IngredientAllData.objects.get(name=original_name)
        except IngredientAllData.DoesNotExist:
            pass
        
        # Try normalized version
        normalized_name = self.normalize_ingredient_name(original_name)
        try:
            return IngredientAllData.objects.get(name=normalized_name)
        except IngredientAllData.DoesNotExist:
            pass
        
        # Try case-insensitive match
        try:
            return IngredientAllData.objects.get(name__iexact=original_name)
        except IngredientAllData.DoesNotExist:
            pass
        
        # Try case-insensitive normalized match
        try:
            return IngredientAllData.objects.get(name__iexact=normalized_name)
        except IngredientAllData.DoesNotExist:
            pass
        
        return None

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean-existing',
            action='store_true',
            help='Delete existing recipes before importing',
        )

    def handle(self, *args, **options):
        if options['clean_existing']:
            self.stdout.write('Deleting existing recipes...')
            deleted_count = Recipe.objects.count()
            Recipe.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} existing recipes.'))
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        missing_ingredients_stats = {}  # Track missing ingredients and their counts
        
        try:
            with open('resources/test_dataset.csv', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                # Limit to first 1000 recipes for testing
                for row_num, row in enumerate(reader, start=1):
                    if row_num > 28000:  # Stop after 1000 recipes
                        self.stdout.write(self.style.SUCCESS(f'Reached 5000 recipe limit, stopping...'))
                        break
                        
                    try:
                        name = row['title'].strip()
                        if not name:
                            self.stdout.write(self.style.WARNING(f'Row {row_num}: Empty recipe name, skipping'))
                            skipped_count += 1
                            continue
                            
                        description = row['ingredients']
                        steps = "\n".join(ast.literal_eval(row['directions']))
                        ingredient_names = ast.literal_eval(row['NER'])
                        
                        # Check if ALL ingredients exist in the database first (with normalization)
                        ingredient_objs = []
                        missing_ingredients = []
                        
                        for ing_name in ingredient_names:
                            if ing_name.strip():  # Only process non-empty ingredient names
                                # Try to find ingredient with normalization
                                ing = self.find_ingredient_by_name(ing_name.strip())
                                if ing:
                                    ingredient_objs.append(ing)
                                else:
                                    # Track missing ingredients
                                    missing_ingredients.append(ing_name.strip())
                        
                        # Only create recipe if ALL ingredients exist
                        if missing_ingredients:
                            # Track missing ingredients for statistics
                            for missing_ing in missing_ingredients:
                                if missing_ing not in missing_ingredients_stats:
                                    missing_ingredients_stats[missing_ing] = 0
                                missing_ingredients_stats[missing_ing] += 1
                            
                            self.stdout.write(
                                self.style.WARNING(
                                    f'Row {row_num}: Skipping recipe "{name}" - missing ingredients: {missing_ingredients[:5]}...'
                                )
                            )
                            skipped_count += 1
                            continue
                        
                        # All ingredients exist, safe to create recipe
                        recipe, created = Recipe.objects.get_or_create(
                            name=name,
                            defaults={
                                'description': description,
                                'steps': steps,
                                'created_by_ai': False,
                            }
                        )
                        
                        # Link all ingredients to the recipe
                        recipe.ingredients.set(ingredient_objs)
                        recipe.save()

                        # Count and log progress
                        if created:
                            created_count += 1
                            status = "Added"
                        else:
                            updated_count += 1
                            status = "Updated"
                            
                        if row_num % 100 == 0:
                            self.stdout.write(f'Processed {row_num} recipes...')
                            
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'Error processing row {row_num}: {e}')
                        )
                        skipped_count += 1
                        continue
                        
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR('File resources/test_dataset.csv not found')
            )
            return

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nImport completed!\n'
                f'Created: {created_count} recipes\n'
                f'Updated: {updated_count} recipes\n'
                f'Skipped: {skipped_count} (missing ingredients)'
            )
        )
        
        # Statistics for missing ingredients
        if missing_ingredients_stats:
            self.stdout.write(
                self.style.WARNING(
                    f'\n=== TOP 10 MISSING INGREDIENTS STATISTICS ===\n'
                )
            )
            
            # Sort by count (descending) and get top 10
            sorted_missing = sorted(missing_ingredients_stats.items(), key=lambda x: x[1], reverse=True)[:10]
            
            for i, (ingredient, count) in enumerate(sorted_missing, 1):
                self.stdout.write(
                    self.style.WARNING(
                        f'{i:2d}. "{ingredient}" - missing in {count} recipes'
                    )
                )
            
            self.stdout.write(
                self.style.WARNING(
                    f'\nTotal unique missing ingredients: {len(missing_ingredients_stats)}'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n🎉 No missing ingredients! All recipes used existing ingredients.'
                )
            )