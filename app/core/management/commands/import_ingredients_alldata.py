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
            # Match names from create_dietary_defaults.py
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
        
        self.dietary_mapping = {
            # Match names from create_dietary_defaults.py
            'Vegan': [
                # Vegetables (specific names from CSV)
                'broccoli', 'spinach', 'lettuce', 'carrots', 'cabbage', 'cauliflower', 
                'celery', 'cucumber', 'onion', 'garlic', 'tomato', 'potato', 'squash',
                'bell', 'pepper', 'chili', 'jalapeno', 'serrano', 'mushroom', 'corn',
                'peas', 'beans', 'lentil', 'chickpea', 'asparagus', 'radishes', 'leeks',
                'scallions', 'shallots', 'parsley', 'cilantro', 'basil', 'oregano', 'sage',
                'rosemary', 'thyme', 'dill', 'chives', 'ginger', 'beets', 'turnip',
                'kale', 'chard', 'arugula', 'endive', 'radicchio', 'fennel', 'artichoke',
                'okra', 'eggplant', 'zucchini', 'pumpkin', 'sweet potato', 'yam',
                
                # Fruits (specific names from CSV)
                'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'cherry', 'peach', 'pear',
                'pineapple', 'mango', 'papaya', 'kiwi', 'avocado', 'coconut',
                'cranberry', 'apricot', 'plum', 'watermelon', 'cantaloupe', 'honeydew',
                'grapefruit', 'tangerine', 'mandarin', 'pomegranate', 'guava',
                'passion fruit', 'dates', 'figs', 'raisins', 'prunes',
                
                # Grains and legumes
                'rice', 'quinoa', 'oats', 'barley', 'wheat', 'corn', 'millet',
                'buckwheat', 'bulgur', 'couscous', 'pasta', 'bread', 'flour',
                'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
                'pinto beans', 'navy beans', 'lima beans', 'split peas',
                
                # Nuts and seeds
                'almonds', 'walnuts', 'cashews', 'pecans', 'hazelnuts', 'pistachios',
                'macadamia', 'pine nuts', 'sunflower seeds', 'pumpkin seeds',
                'sesame seeds', 'flax seeds', 'chia seeds', 'hemp seeds',
                
                # Oils and vinegars
                'olive oil', 'coconut oil', 'sunflower oil', 'sesame oil', 'canola oil',
                'vinegar', 'balsamic vinegar', 'apple cider vinegar',
                
                # Plant-based proteins
                'tofu', 'tempeh', 'seitan', 'nutritional yeast',
                
                # Sweeteners
                'maple syrup', 'agave', 'molasses', 'date syrup',
                
                # Herbs and spices
                'cumin', 'paprika', 'turmeric', 'coriander', 'cardamom', 'cinnamon',
                'nutmeg', 'cloves', 'bay leaves', 'saffron', 'vanilla'
            ],
            
            'Vegetarian': [
                # All vegan foods PLUS dairy and eggs
                # Vegetables (specific names from CSV)
                'broccoli', 'spinach', 'lettuce', 'carrots', 'cabbage', 'cauliflower', 
                'celery', 'cucumber', 'onion', 'garlic', 'tomato', 'potato', 'squash',
                'bell pepper', 'chili', 'jalapeno', 'serrano', 'mushroom', 'corn',
                'peas', 'beans', 'lentil', 'chickpea', 'asparagus', 'radishes', 'leeks',
                'scallions', 'shallots', 'parsley', 'cilantro', 'basil', 'oregano', 'sage',
                'rosemary', 'thyme', 'dill', 'chives', 'ginger', 'beets', 'turnip',
                'kale', 'chard', 'arugula', 'endive', 'radicchio', 'fennel', 'artichoke',
                'okra', 'eggplant', 'zucchini', 'pumpkin', 'sweet potato', 'yam',
                
                # Fruits (specific names from CSV)
                'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'cherry', 'peach', 'pear',
                'pineapple', 'mango', 'papaya', 'kiwi', 'avocado', 'coconut',
                'cranberry', 'apricot', 'plum', 'watermelon', 'cantaloupe', 'honeydew',
                'grapefruit', 'tangerine', 'mandarin', 'pomegranate', 'guava',
                'passion fruit', 'dates', 'figs', 'raisins', 'prunes',
                
                # Grains and legumes
                'rice', 'quinoa', 'oats', 'barley', 'wheat', 'corn', 'millet',
                'buckwheat', 'bulgur', 'couscous', 'pasta', 'bread', 'flour',
                'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
                'pinto beans', 'navy beans', 'lima beans', 'split peas',
                
                # Nuts and seeds
                'almonds', 'walnuts', 'cashews', 'pecans', 'hazelnuts', 'pistachios',
                'macadamia', 'pine nuts', 'sunflower seeds', 'pumpkin seeds',
                'sesame seeds', 'flax seeds', 'chia seeds', 'hemp seeds',
                
                # Oils and vinegars
                'olive oil', 'coconut oil', 'sunflower oil', 'sesame oil', 'canola oil',
                'vinegar', 'balsamic vinegar', 'apple cider vinegar',
                
                # Plant-based proteins
                'tofu', 'tempeh', 'seitan', 'nutritional yeast',
                
                # Sweeteners (vegan ones)
                'maple syrup', 'agave', 'molasses', 'date syrup',
                
                # Herbs and spices
                'cumin', 'paprika', 'turmeric', 'coriander', 'cardamom', 'cinnamon',
                'nutmeg', 'allspice', 'cloves', 'bay leaf', 'saffron', 'vanilla',
                
                # PLUS vegetarian-specific items (dairy and eggs)
                'egg', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
                'cottage cheese', 'ricotta', 'mozzarella', 'cheddar', 'parmesan',
                'swiss', 'brie', 'gouda', 'feta', 'mascarpone', 'cream cheese',
                'buttermilk', 'ice cream', 'honey', 'ghee'
            ],
            
            'Keto': [
                # High fat, low carb foods
                'avocado', 'olive oil', 'coconut oil', 'butter', 'ghee', 'cheese',
                'cheddar', 'mozzarella', 'swiss', 'brie', 'gouda', 'parmesan',
                'cream', 'sour cream', 'cottage cheese', 'ricotta', 'mascarpone',
                'nuts', 'seeds', 'almonds', 'walnuts', 'pecans', 'macadamia',
                'hazelnuts', 'cashews', 'brazil nuts', 'pine nuts',
                'olives', 'fatty fish', 'salmon', 'mackerel', 'sardines', 'tuna',
                'eggs', 'meat', 'beef', 'chicken', 'turkey', 'pork', 'lamb',
                'poultry', 'bacon', 'sausage', 'ham',
                'leafy greens', 'spinach', 'kale', 'arugula', 'lettuce',
                'broccoli', 'cauliflower', 'zucchini', 'asparagus', 'bell pepper',
                'mushrooms', 'cucumber', 'celery', 'radishes', 'brussels sprouts',
                'cabbage', 'bok choy', 'green beans', 'snow peas'
            ],
            
            'Paleo': [
                # Whole foods, no grains/legumes/dairy - specific ingredients
                # Meats and proteins
                'beef', 'chicken', 'turkey', 'pork', 'lamb', 'venison', 'bison',
                'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'mackerel', 'trout',
                'shrimp', 'crab', 'lobster', 'scallops', 'eggs',
                
                # Vegetables (paleo-friendly)
                'broccoli', 'spinach', 'lettuce', 'carrots', 'cabbage', 'cauliflower',
                'celery', 'cucumber', 'onion', 'garlic', 'tomato', 'bell pepper',
                'mushroom', 'asparagus', 'radishes', 'leeks', 'kale', 'chard',
                'arugula', 'fennel', 'artichoke', 'okra', 'eggplant', 'zucchini',
                'pumpkin', 'sweet potato', 'beets', 'turnip',
                
                # Fruits
                'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'cherry', 'peach', 'pear',
                'pineapple', 'mango', 'papaya', 'kiwi', 'avocado', 'coconut',
                'cranberry', 'apricot', 'plum', 'watermelon', 'cantaloupe',
                'grapefruit', 'dates', 'figs',
                
                # Nuts and seeds
                'almonds', 'walnuts', 'cashews', 'pecans', 'hazelnuts', 'pistachios',
                'macadamia', 'pine nuts', 'sunflower seeds', 'pumpkin seeds',
                'sesame seeds', 'flax seeds', 'chia seeds',
                
                # Oils and fats
                'olive oil', 'coconut oil', 'avocado oil', 'ghee',
                
                # Herbs and spices
                'basil', 'oregano', 'sage', 'rosemary', 'thyme', 'dill', 'chives',
                'ginger', 'cumin', 'paprika', 'turmeric', 'coriander', 'cardamom',
                'cinnamon', 'nutmeg', 'allspice', 'cloves', 'bay leaf', 'vanilla',
                
                # Natural sweeteners
                'honey', 'maple syrup'
            ],
            
            'Gluten-Free': [
                # No wheat, barley, rye, oats (unless certified GF) - specific ingredients
                # Gluten-free grains and starches
                'rice', 'quinoa', 'corn', 'potato', 'sweet potato', 'buckwheat',
                'millet', 'amaranth', 'teff', 'sorghum', 'tapioca', 'arrowroot',
                
                # All meats and proteins (naturally gluten-free)
                'beef', 'chicken', 'turkey', 'pork', 'lamb', 'venison', 'bison',
                'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'mackerel', 'trout',
                'shrimp', 'crab', 'lobster', 'scallops', 'eggs',
                
                # All dairy (naturally gluten-free)
                'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
                'cottage cheese', 'ricotta', 'mozzarella', 'cheddar', 'parmesan',
                
                # All vegetables (naturally gluten-free)
                'broccoli', 'spinach', 'lettuce', 'carrots', 'cabbage', 'cauliflower',
                'celery', 'cucumber', 'onion', 'garlic', 'tomato', 'bell pepper',
                'mushroom', 'corn', 'peas', 'asparagus', 'radishes', 'leeks',
                'kale', 'chard', 'arugula', 'fennel', 'artichoke', 'okra',
                'eggplant', 'zucchini', 'pumpkin', 'beets', 'turnip',
                
                # All fruits (naturally gluten-free)
                'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'cherry', 'peach', 'pear',
                'pineapple', 'mango', 'papaya', 'kiwi', 'avocado', 'coconut',
                'cranberry', 'apricot', 'plum', 'watermelon', 'cantaloupe',
                
                # Legumes (naturally gluten-free)
                'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
                'pinto beans', 'navy beans', 'lima beans', 'split peas',
                
                # Nuts and seeds (naturally gluten-free)
                'almonds', 'walnuts', 'cashews', 'pecans', 'hazelnuts', 'pistachios',
                'macadamia', 'pine nuts', 'sunflower seeds', 'pumpkin seeds',
                'sesame seeds', 'flax seeds', 'chia seeds', 'hemp seeds'
            ],
            
            'Dairy-Free': [
                # No milk products - specific ingredients
                # All meats and proteins
                'beef', 'chicken', 'turkey', 'pork', 'lamb', 'venison', 'bison',
                'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'mackerel', 'trout',
                'shrimp', 'crab', 'lobster', 'scallops', 'eggs',
                
                # All vegetables
                'broccoli', 'spinach', 'lettuce', 'carrots', 'cabbage', 'cauliflower',
                'celery', 'cucumber', 'onion', 'garlic', 'tomato', 'bell pepper',
                'mushroom', 'corn', 'peas', 'asparagus', 'radishes', 'leeks',
                'kale', 'chard', 'arugula', 'fennel', 'artichoke', 'okra',
                'eggplant', 'zucchini', 'pumpkin', 'sweet potato', 'beets', 'turnip',
                
                # All fruits
                'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'cherry', 'peach', 'pear',
                'pineapple', 'mango', 'papaya', 'kiwi', 'avocado', 'coconut',
                'cranberry', 'apricot', 'plum', 'watermelon', 'cantaloupe',
                
                # All grains
                'rice', 'quinoa', 'oats', 'barley', 'wheat', 'corn', 'millet',
                'buckwheat', 'bulgur', 'pasta', 'bread',
                
                # All legumes
                'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
                'pinto beans', 'navy beans', 'lima beans', 'split peas',
                
                # All nuts and seeds
                'almonds', 'walnuts', 'cashews', 'pecans', 'hazelnuts', 'pistachios',
                'macadamia', 'pine nuts', 'sunflower seeds', 'pumpkin seeds',
                'sesame seeds', 'flax seeds', 'chia seeds', 'hemp seeds',
                
                # Dairy alternatives
                'coconut milk', 'almond milk', 'soy milk', 'oat milk', 'rice milk',
                'cashew milk', 'hemp milk', 'nutritional yeast', 'coconut cream'
            ],
            
            'Low-Carb': [
                # Similar to keto but slightly more flexible
                'meat', 'beef', 'chicken', 'turkey', 'pork', 'fish', 'salmon', 'tuna',
                'poultry', 'eggs', 'cheese', 'leafy greens', 'spinach', 'lettuce',
                'broccoli', 'cauliflower', 'zucchini', 'asparagus', 'bell pepper',
                'mushrooms', 'cucumber', 'celery', 'avocado', 'nuts', 'seeds',
                'almonds', 'walnuts', 'cashews', 'hazelnuts', 'pecans',
                'olive oil', 'coconut oil', 'butter', 'cream', 'sour cream',
                'cottage cheese', 'ricotta', 'cheddar', 'mozzarella', 'swiss',
                'cabbage', 'kale', 'arugula', 'radishes', 'brussels sprouts',
                'green beans', 'snow peas', 'bok choy', 'watercress'
            ],
            
            'Mediterranean': [
                # Mediterranean diet staples - specific ingredients
                # Fish and seafood
                'salmon', 'tuna', 'sardines', 'mackerel', 'anchovies', 'sea bass',
                'shrimp', 'mussels', 'clams', 'octopus', 'squid',
                
                # Vegetables
                'tomatoes', 'olives', 'onions', 'garlic', 'bell pepper', 'eggplant',
                'zucchini', 'artichoke', 'spinach', 'arugula', 'cucumber',
                'lettuce', 'broccoli', 'cauliflower', 'fennel',
                
                # Fruits
                'lemon', 'orange', 'grape', 'fig', 'pomegranate', 'apple',
                'pear', 'melon', 'watermelon', 'peach', 'apricot',
                
                # Grains and legumes
                'wheat', 'barley', 'oats', 'rice', 'bulgur', 'pasta', 'bread',
                'chickpeas', 'lentils', 'beans', 'fava beans',
                
                # Nuts and seeds
                'almonds', 'walnuts', 'pine nuts', 'pistachios', 'sesame seeds',
                
                # Dairy
                'feta cheese', 'ricotta', 'parmesan', 'yogurt', 'goat cheese',
                
                # Oils and condiments
                'olive oil', 'olives', 'capers', 'vinegar', 'balsamic vinegar',
                
                # Herbs and spices
                'basil', 'oregano', 'rosemary', 'thyme', 'parsley', 'mint',
                'sage', 'bay leaf', 'garlic', 'onion'
            ],
            
            'Pescatarian': [
                # Vegetarian plus fish/seafood - specific ingredients
                # All vegetarian foods (fruits, vegetables, grains, dairy, eggs)
                'broccoli', 'spinach', 'lettuce', 'carrots', 'cabbage', 'cauliflower',
                'celery', 'cucumber', 'onion', 'garlic', 'tomato', 'bell pepper',
                'mushroom', 'corn', 'peas', 'asparagus', 'kale', 'zucchini',
                
                'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry',
                'blueberry', 'raspberry', 'cherry', 'peach', 'pear', 'avocado',
                
                'rice', 'quinoa', 'oats', 'pasta', 'bread', 'beans', 'lentils',
                'chickpeas', 'almonds', 'walnuts', 'cashews',
                
                'milk', 'cheese', 'yogurt', 'butter', 'eggs',
                
                # PLUS fish and seafood
                'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'mackerel',
                'trout', 'sea bass', 'flounder', 'sole', 'snapper',
                'shrimp', 'crab', 'lobster', 'scallops', 'mussels',
                'clams', 'oysters', 'squid', 'octopus'
            ],
            
            'Whole30': [
                # Whole30 compliant foods - specific ingredients from database
                'meat', 'beef', 'chicken', 'turkey', 'pork', 'lamb', 'bacon',
                'poultry', 'fish', 'salmon', 'tuna', 'cod', 'halibut', 'trout',
                'seafood', 'shrimp', 'crab', 'lobster', 'scallops', 'eggs',
                'vegetables', 'broccoli', 'spinach', 'cauliflower', 'carrots',
                'bell pepper', 'onion', 'garlic', 'tomato', 'cucumber', 'celery',
                'asparagus', 'zucchini', 'mushrooms', 'cabbage', 'kale', 'lettuce',
                'sweet potato', 'butternut squash', 'acorn squash', 'pumpkin',
                'fruits', 'apple', 'banana', 'orange', 'berries', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'grape', 'pineapple',
                'mango', 'papaya', 'melon', 'watermelon', 'peach', 'pear',
                'apricot', 'plum', 'cherry', 'avocado', 'coconut',
                'nuts', 'seeds', 'almonds', 'walnuts', 'cashews', 'pecans',
                'macadamia', 'hazelnuts', 'pine nuts', 'sunflower seeds',
                'pumpkin seeds', 'sesame seeds', 'flax seeds', 'chia seeds',
                'olive oil', 'coconut oil', 'avocado oil', 'ghee',
                'herbs', 'spices', 'basil', 'oregano', 'thyme', 'rosemary',
                'parsley', 'cilantro', 'dill', 'sage', 'mint', 'chives',
                'garlic powder', 'onion powder', 'paprika', 'cumin', 'turmeric',
                'coriander', 'cardamom', 'cinnamon', 'nutmeg', 'ginger',
                'black pepper', 'sea salt', 'himalayan salt'
            ],
            
            'Low-Fat': [
                # Low fat options - specific ingredients from database
                'vegetables', 'broccoli', 'spinach', 'cauliflower', 'carrots',
                'bell pepper', 'onion', 'garlic', 'tomato', 'cucumber', 'celery',
                'asparagus', 'zucchini', 'mushrooms', 'cabbage', 'kale', 'lettuce',
                'sweet potato', 'potato', 'butternut squash', 'pumpkin',
                'fruits', 'apple', 'banana', 'orange', 'berries', 'strawberry',
                'blueberry', 'raspberry', 'blackberry', 'grape', 'pineapple',
                'mango', 'papaya', 'melon', 'watermelon', 'peach', 'pear',
                'apricot', 'plum', 'cherry', 'cantaloupe', 'honeydew',
                'whole grains', 'rice', 'brown rice', 'quinoa', 'oats',
                'barley', 'bulgur', 'millet', 'buckwheat', 'whole wheat',
                'lean protein', 'chicken breast', 'turkey breast', 'fish',
                'salmon', 'tuna', 'cod', 'halibut', 'tilapia', 'sole',
                'poultry breast', 'egg whites', 'skim milk', 'low-fat yogurt',
                'cottage cheese', 'ricotta', 'part-skim mozzarella',
                'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
                'pinto beans', 'navy beans', 'lima beans', 'split peas',
                'tofu', 'tempeh', 'seitan'
            ],
            
            'High-Protein': [
                # High protein foods - specific ingredients from database
                'meat', 'beef', 'chicken', 'turkey', 'pork', 'lamb', 'venison',
                'poultry', 'fish', 'salmon', 'tuna', 'cod', 'halibut', 'trout',
                'mackerel', 'sardines', 'tilapia', 'sole', 'flounder',
                'seafood', 'shrimp', 'crab', 'lobster', 'scallops', 'mussels',
                'clams', 'oysters', 'squid', 'octopus',
                'eggs', 'egg whites', 'whole eggs',
                'dairy', 'cheese', 'cottage cheese', 'ricotta', 'cheddar',
                'mozzarella', 'swiss', 'parmesan', 'gouda', 'feta',
                'greek yogurt', 'regular yogurt', 'milk', 'skim milk',
                'beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans',
                'pinto beans', 'navy beans', 'lima beans', 'split peas',
                'soybeans', 'edamame', 'tofu', 'tempeh', 'seitan',
                'quinoa', 'buckwheat', 'amaranth', 'hemp seeds',
                'nuts', 'seeds', 'almonds', 'walnuts', 'cashews', 'pecans',
                'hazelnuts', 'pine nuts', 'sunflower seeds', 'pumpkin seeds',
                'chia seeds', 'flax seeds', 'hemp hearts',
                'protein powder', 'whey protein', 'casein protein',
                'pea protein', 'soy protein', 'rice protein',
                'spirulina', 'nutritional yeast', 'hemp protein'
            ]
        }

    
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
        preferences = set()
        name_lower = ingredient_name.lower()
        
        for diet_name, keywords in self.dietary_mapping.items():
            if any(keyword.lower() in name_lower for keyword in keywords):
                preferences.add(diet_name)
        
        # If it's vegan, it's automatically vegetarian
        if 'Vegan' in preferences:
            preferences.add('Vegetarian')
            
        return list(preferences)

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
        
        try:
            with open('resources/model_ingredients.csv', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # Skip header row
                
                for row_num, row in enumerate(reader, start=2):
                    if not row or not row[0].strip():
                        skipped_count += 1
                        continue
                        
                    ingredient_name = row[0].strip()
                    
                    # Basic validation - ingredient name should not be empty
                    if not ingredient_name or len(ingredient_name) < 2:
                        skipped_count += 1
                        continue
                    
                    # Check if ingredient already exists in database
                    if IngredientAllData.objects.filter(name__iexact=ingredient_name).exists():
                        duplicate_count += 1
                        continue
                    
                    try:
                        # Create the ingredient
                        ingredient = IngredientAllData.objects.create(
                            name=ingredient_name
                        )
                        
                        # Add allergen tags
                        allergen_names = self.get_allergens_for_ingredient(ingredient_name)
                        for allergen_name in allergen_names:
                            try:
                                allergen = Allergy.objects.get(name=allergen_name)
                                ingredient.contains_allergens.add(allergen)
                            except Allergy.DoesNotExist:
                                pass
                        
                        # Add dietary preference tags
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
                self.style.ERROR('File resources/model_ingredients.csv not found')
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