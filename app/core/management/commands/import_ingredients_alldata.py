import csv
from django.core.management.base import BaseCommand
from core.models import IngredientAllData, Allergy, DietaryPreference

class Command(BaseCommand):
    help = "Import ingredients from model_ingredients.csv into IngredientAllData with allergen and dietary tags"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean-existing',
            action='store_true',
            help='Delete existing ingredients before importing',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Simplified allergen mapping - only for common allergens
        self.allergen_mapping = {
            'Milk': ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 
                     'mozzarella', 'cheddar', 'parmesan', 'ricotta', 'cottage', 'buttermilk',
                     'sour cream', 'ice cream', 'condensed milk', 'evaporated milk', 'dairy'],
            'Wheat': ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'barley', 'rye', 'oat',
                      'cereal', 'biscuit', 'cracker', 'bagel', 'pretzel', 'couscous', 'bulgur',
                      'semolina', 'durum', 'spelt', 'kamut', 'triticale', 'gluten'],
            'Tree Nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut',
                         'macadamia', 'brazil nut', 'pine nut', 'chestnut'],
            'Peanuts': ['peanut', 'groundnut'],
            'Soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame', 'soybean'],
            'Eggs': ['egg', 'yolk', 'white', 'mayonnaise', 'meringue'],
            'Fish': ['salmon', 'tuna', 'cod', 'halibut', 'bass', 'trout', 'mackerel', 'sardine',
                    'anchovy', 'herring', 'sole', 'flounder', 'snapper'],
            'Shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'mussel', 'scallop',
                         'crawfish', 'crayfish'],
            'Sesame': ['sesame', 'tahini'],
            'Coconut': ['coconut'],
            'Mustard': ['mustard'],
            'Celery': ['celery'],
            'Lupin': ['lupin'],
            'Molluscs': ['mollusc', 'mollusk', 'snail', 'squid', 'octopus'],
            'Sulphites': ['sulphite', 'sulfite', 'sulfur dioxide']
        }

        # Dietary mapping now loaded from ingredient_map.csv
        self.dietary_mappings = self.load_dietary_mappings('resources/ingredient_map.csv')

    def load_dietary_mappings(self, csv_path):
        dietary_mappings = {}
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                ingredient = row['ingredient'].strip().lower()
                dietary_mappings[ingredient] = {k: int(v) for k, v in row.items() if k != 'ingredient'}
        return dietary_mappings
    
    def get_allergens_for_ingredient(self, ingredient_name):
        """Determine allergens for an ingredient based on its name"""
        allergens = []
        name_lower = ingredient_name.lower()
        
        for allergen, keywords in self.allergen_mapping.items():
            if any(keyword in name_lower for keyword in keywords):
                allergens.append(allergen)
                
        return allergens

    def get_dietary_preferences_for_ingredient(self, ingredient_name):
        """Determine dietary compatibility for an ingredient"""
        preferences = []
        name_lower = ingredient_name.strip().lower()
        mapping = self.dietary_mappings.get(name_lower)
        if mapping:
            preferences = [diet for diet, allowed in mapping.items() if allowed]
            # If it's vegan, it's automatically vegetarian
            if 'Vegan' in preferences and 'Vegetarian' not in preferences:
                preferences.append('Vegetarian')
        return preferences

    def handle(self, *args, **options):
        if options['clean_existing']:
            self.stdout.write('Deleting existing ingredients...')
            IngredientAllData.objects.all().delete()
        
        # Check if allergens and dietary preferences exist
        if not Allergy.objects.exists() or not DietaryPreference.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    'No allergens or dietary preferences found in database.\n'
                    'Please run "python manage.py create_dietary_defaults" first.'
                )
            )
            return
        
        created_count = 0
        skipped_count = 0
        duplicate_count = 0
        duplicate_ingredients = []
        
        try:
            with open('resources/ingredient_map.csv', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row_num, row in enumerate(reader, start=2):
                    ingredient_name = row['ingredient'].strip()
                    if not ingredient_name or len(ingredient_name) < 2:
                        skipped_count += 1
                        continue
                    if IngredientAllData.objects.filter(name__iexact=ingredient_name).exists():
                        duplicate_count += 1
                        duplicate_ingredients.append(ingredient_name)
                        continue
                    try:
                        ingredient = IngredientAllData.objects.create(name=ingredient_name)
                        allergen_names = self.get_allergens_for_ingredient(ingredient_name)
                        for allergen_name in allergen_names:
                            try:
                                allergen = Allergy.objects.get(name=allergen_name)
                                ingredient.contains_allergens.add(allergen)
                            except Allergy.DoesNotExist:
                                pass
                        diet_names = self.get_dietary_preferences_for_ingredient(ingredient_name)
                        for diet_name in diet_names:
                            try:
                                diet = DietaryPreference.objects.get(name=diet_name)
                                ingredient.dietary_preferences.add(diet)
                            except DietaryPreference.DoesNotExist:
                                pass
                        created_count += 1
                        if created_count % 100 == 0:
                            self.stdout.write(f'Processed {created_count} ingredients...')
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'Error creating ingredient "{ingredient_name}": {e}')
                        )
                        skipped_count += 1
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR('File resources/ingredient_map.csv not found')
            )
            return
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\nImport completed!\n'
                f'Created: {created_count} ingredients\n'
                f'Skipped: {skipped_count} (invalid entries)\n'
                f'Duplicates: {duplicate_count} (already exist in database)'
            )
        )
        if duplicate_ingredients:
            self.stdout.write(self.style.WARNING(f'Duplicate ingredients:'))
            for name in duplicate_ingredients:
                self.stdout.write(f'- {name}')