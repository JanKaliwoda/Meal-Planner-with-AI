from django.core.management.base import BaseCommand
from core.models import DietaryPreference, Allergy


class Command(BaseCommand):
    help = 'Create default dietary preferences and allergies'

    def handle(self, *args, **kwargs):
        # Default dietary preferences from ingredient_map.csv
        import csv
        dietary_preferences = []
        with open('resources/ingredient_map.csv', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)
            dietary_preferences = header[1:]  # skip 'ingredient' column

        # 100 most common allergic products (all lowercase for matching)
        # Top 20 most common allergens for quick selection (4 rows of 5)
        popular_allergies = [
            # Row 1 - Most common
            'milk', 'eggs', 'peanuts', 'tree nuts', 'soy',
            # Row 2 - Common seafood and grains  
            'fish', 'shellfish', 'wheat', 'sesame', 'gluten',
            # Row 3 - Other common allergens
            'sulphites', 'corn', 'mustard', 'celery', 'lupin',
            # Row 4 - Less common but notable
            'coconut', 'yeast', 'chocolate', 'tomatoes', 'citrus'
        ]
        
        other_allergies = [
            # Dairy products
            'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose',
            'sour cream', 'cream cheese', 'ice cream',
            
            # Nuts and seeds
            'almonds', 'walnuts', 'cashews', 'pecans', 'pistachios', 'hazelnuts',
            'brazil nuts', 'macadamia nuts', 'pine nuts', 'chestnuts', 'sunflower seeds',
            'pumpkin seeds', 'chia seeds', 'flax seeds',
            
            # Grains and gluten-containing
            'barley', 'rye', 'oats', 'spelt', 'kamut', 'triticale',
            'bulgur', 'semolina', 'durum', 'malt',
            
            # Seafood and fish
            'crab', 'lobster', 'shrimp', 'oysters', 'mussels', 'clams', 'scallops',
            'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'anchovies', 'molluscs',
            
            # Fruits
            'strawberries', 'kiwi', 'mango', 'pineapple', 'oranges', 'lemons', 'limes',
            'grapefruit', 'peaches', 'apples', 'bananas', 'grapes', 'cherries', 'apricots',
            'berries', 'melons',
            
            # Vegetables  
            'carrots', 'peppers', 'potatoes', 'eggplant', 'spinach', 'lettuce',
            'onions', 'garlic', 'avocado', 'beets', 'cucumber', 'zucchini',
            
            # Spices and herbs
            'cinnamon', 'vanilla', 'oregano', 'basil', 'thyme', 'rosemary',
            'paprika', 'cumin', 'turmeric', 'ginger', 'black pepper', 'chili',
            'nutmeg', 'cloves', 'cardamom',
            
            # Meat and poultry
            'beef', 'chicken', 'pork', 'turkey', 'lamb', 'duck', 'goose',
            
            # Legumes
            'chickpeas', 'lentils', 'black beans', 'kidney beans', 'lima beans',
            'green peas', 'pinto beans', 'navy beans', 'garbanzo beans',
            
            # Other common allergens
            'honey', 'maple syrup', 'artificial sweeteners', 'food coloring',
            'preservatives', 'msg', 'sulfur dioxide', 'vinegar', 'caffeine',
            'alcohol', 'cocoa', 'carrageenan', 'xanthan gum', 'sodium benzoate'
            
            # Specific nuts
            'cashews', 'pecans', 'pistachios', 'hazelnuts',
            'brazil nuts', 'macadamia nuts', 'pine nuts', 'chestnuts',
            
            # Dairy products
            'cream', 'yogurt', 'whey', 'casein', 'lactose',
            'sour cream', 'cream cheese', 'ice cream',
            
            # Grains and gluten
            'barley', 'rye', 'oats', 'spelt', 'kamut', 'triticale',
            'bulgur', 'semolina', 'durum',
            
            # Seafood
            'crab', 'lobster', 'oysters', 'mussels', 'clams', 'scallops',
            'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'anchovies',
            
            # Fruits
            'strawberries', 'kiwi', 'mango', 'pineapple', 'citrus', 'peaches',
            'apples', 'bananas', 'grapes', 'cherries', 'apricots',
            
            # Vegetables
            'carrots', 'peppers', 'corn',
            'potatoes', 'eggplant', 'spinach', 'lettuce',
            
            # Spices and herbs
            'cinnamon', 'vanilla', 'oregano', 'basil', 'thyme', 'rosemary',
            'paprika', 'cumin', 'turmeric', 'ginger', 'black pepper',
            
            # Other common allergens
            'coconut', 'avocado', 'cocoa', 'caffeine', 'alcohol',
            'vinegar', 'yeast', 'honey', 'maple syrup', 'artificial sweeteners',
            'food coloring', 'preservatives', 'msg', 'sulfur dioxide',
            
            # Meat and poultry
            'pork', 'turkey', 'lamb', 'duck', 'goose',
            
            # Legumes
            'chickpeas', 'lentils', 'black beans', 'kidney beans', 'lima beans',
            'green peas', 'pinto beans'
        ]
        
        # Combine popular first, then others
        allergies = popular_allergies + other_allergies

        # Create dietary preferences
        created_prefs = 0
        for pref_name in dietary_preferences:
            pref, created = DietaryPreference.objects.get_or_create(name=pref_name)
            if created:
                created_prefs += 1
                self.stdout.write(f"Created dietary preference: {pref_name}")

        # Create allergies
        created_allergies = 0
        for allergy_name in allergies:
            allergy, created = Allergy.objects.get_or_create(name=allergy_name)
            if created:
                created_allergies += 1
                self.stdout.write(f"Created allergy: {allergy_name}")

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_prefs} dietary preferences and {created_allergies} allergies'
            )
        )
