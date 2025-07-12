import openai
import json
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db.models import Q
from core.models import Recipe
from django.utils import timezone

class Command(BaseCommand):
    help = "Categorize meals using AI to assign cuisine type, difficulty, and cooking time"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        openai.api_key = getattr(settings, 'OPENAI_API_KEY', None)
        
        self.cuisine_types = [
            'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 
            'Indian', 'Thai', 'Chinese', 'French', 'Greek', 'Middle Eastern',
            'Japanese', 'Korean', 'Spanish', 'British', 'German', 'Other'
        ]
        
        self.difficulty_levels = ['Easy', 'Medium', 'Hard']
        self.cooking_time_ranges = ['Under 30 mins', '30-60 mins', '1-2 hours', 'Over 2 hours']

    def add_arguments(self, parser):
        parser.add_argument(
            '--recipe-id',
            type=int,
            help='Categorize a specific recipe by ID',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=10515,
            help='Limit number of recipes to categorize (default: 100)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show categorization results without saving to database',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-categorize recipes that already have categories',
        )

    def categorize_meal_with_ai(self, recipe):
        """Use OpenAI to categorize a single meal"""
        if not openai.api_key:
            return self.fallback_categorization(recipe)
        
        # Get ingredient names
        ingredient_names = [ing.name for ing in recipe.ingredients.all()]
        
        prompt = f"""
Categorize this meal based on the following information:
- Name: {recipe.name}
- Ingredients: {', '.join(ingredient_names) if ingredient_names else 'Not specified'}
- Instructions: {recipe.steps[:500] if recipe.steps else 'Not specified'}
- Description: {recipe.description[:200] if recipe.description else 'Not specified'}

Please categorize this meal and respond with JSON in this exact format:
{{
    "cuisineType": "one of: {', '.join(self.cuisine_types)}",
    "difficulty": "one of: {', '.join(self.difficulty_levels)}",
    "cookingTime": "one of: {', '.join(self.cooking_time_ranges)}",
    "tags": ["array of relevant tags like vegetarian, spicy, healthy, etc."]
}}

Base your decisions on:
- Cuisine type: ingredients, cooking methods, dish name
- Difficulty: number of steps, complexity of techniques, ingredients
- Cooking time: complexity of preparation and cooking methods
- Tags: dietary restrictions, flavor profiles, meal type
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a culinary expert that categorizes meals. Respond only with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=200
            )

            categorization = json.loads(response.choices[0].message.content)
            return self.validate_and_format_response(categorization)
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'AI categorization failed for "{recipe.name}": {e}')
            )
            return self.fallback_categorization(recipe)

    def fallback_categorization(self, recipe):
        """Rule-based fallback categorization"""
        return {
            'cuisine_type': self.determine_cuisine_by_keywords(recipe),
            'difficulty': self.determine_difficulty_by_complexity(recipe),
            'cooking_time': self.determine_cooking_time_by_steps(recipe),
            'tags': self.generate_basic_tags(recipe)
        }

    def determine_cuisine_by_keywords(self, recipe):
        """Determine cuisine type based on keywords"""
        text = f"{recipe.name} {recipe.description} {recipe.steps}".lower()
        ingredient_names = [ing.name.lower() for ing in recipe.ingredients.all()]
        all_text = f"{text} {' '.join(ingredient_names)}"
        
        cuisine_keywords = {
            'Italian': [
                'pasta', 'pizza', 'risotto', 'parmesan', 'mozzarella', 'basil', 'oregano',
                'acini de pepe', 'pancetta', 'marsala wine', 'prosciutto', 'romano cheese',
                'ricotta cheese', 'ricotta', 'ricotta salata'
            ],
            'Mexican': [
                'taco', 'burrito', 'salsa', 'avocado', 'cilantro', 'lime', 'cumin',
                'agave', 'anchovy', 'anchovy paste', 'anchovy fillets', 'chipotle peppers',
                'chipotle', 'jalapeno peppers', 'jalapeno'
            ],
            'Asian': [
                'soy sauce', 'ginger', 'sesame', 'rice', 'noodles', 'stir fry',
                'bean sprouts', 'bok choy', 'bamboo shoots', 'miso paste', 'red miso',
                'white miso', 'shiitake mushrooms', 'shiitake', 'wasabi', 'wasabi paste'
            ],
            'Indian': [
                'curry', 'turmeric', 'garam masala', 'naan', 'basmati', 'cardamom',
                'ground cardamom', 'cardamom pods', 'ghee', 'paneer'
            ],
            'Mediterranean': [
                'olive oil', 'feta', 'olives', 'lemon', 'herbs', 'tomatoes',
                'artichoke', 'artichoke hearts', 'artichoke bottoms', 'chickpeas',
                'couscous', 'figs', 'dried figs'
            ],
            'Thai': [
                'coconut milk', 'lemongrass', 'thai', 'pad', 'curry',
                'galangal', 'thai basil', 'fish sauce'
            ],
            'Chinese': [
                'soy sauce', 'rice', 'ginger', 'garlic', 'chinese', 'wok',
                'water chestnuts', 'hoisin sauce'
            ],
            'French': [
                'butter', 'wine', 'cream', 'french', 'baguette', 'brie',
                'brie cheese', 'camembert cheese', 'creme fraiche', 'shallots'
            ],
            'Greek': [
                'feta', 'olives', 'olive oil', 'greek', 'yogurt', 'lemon',
                'kalamata olives'
            ],
            'American': [
                'burger', 'bbq', 'american', 'cheese', 'bacon',
                'bacon bits', 'ranch dressing', 'peanut butter',
                'creamy peanut butter', 'marshmallows'
            ],
            'Middle Eastern': [
                'tahini', 'zaatar', 'pita bread', 'harissa',
                'lamb', 'ground lamb', 'lamb chops', 'lamb shanks', 'lamb shoulder', 'lamb stew'
            ],
            'Japanese': [
                'miso paste', 'red miso', 'white miso', 'mirin',
                'sake', 'nori', 'wasabi', 'wasabi paste'
            ],
            'Korean': [
                'kimchi', 'sesame oil', 'toasted sesame oil'
            ],
            'Spanish': [
                'chorizo', 'chorizo sausage', 'saffron', 'saffron threads',
                'manchego cheese', 'paprika', 'smoked paprika', 'sweet paprika', 'paella rice'
            ],
            'British': [
                'worcestershire sauce', 'worcestershire', 'mincemeat', 'custard', 'custard powder'
            ],
            'German': [
                'bratwurst', 'sauerkraut', 'dry mustard', 'mustard', 'brown mustard',
                'honey mustard', 'grain mustard', 'mustard greens', 'mustard oil',
                'mustard powder', 'mustard seed', 'whole grain mustard', 'pretzels'
            ]
        }

        for cuisine, keywords in cuisine_keywords.items():
            if any(keyword in all_text for keyword in keywords):
                return cuisine
        
        return 'Other'

    def determine_difficulty_by_complexity(self, recipe):
        """Determine difficulty based on recipe complexity"""
        steps = recipe.steps or ''
        ingredient_count = recipe.ingredients.count()
        
        complex_words = ['marinate', 'reduce', 'fold', 'temper', 'braise', 'julienne', 
                        'caramelize', 'sauté', 'deglaze', 'emulsify']
        complexity_score = sum(1 for word in complex_words if word in steps.lower())
        
        step_count = len(steps.split('\n')) if steps else 0
        
        if ingredient_count <= 5 and complexity_score == 0 and step_count <= 5:
            return 'Easy'
        elif ingredient_count <= 10 and complexity_score <= 2 and step_count <= 10:
            return 'Medium'
        else:
            return 'Hard'

    def determine_cooking_time_by_steps(self, recipe):
        """Determine cooking time based on recipe steps"""
        steps = recipe.steps or ''
        
        # Look for time indicators
        time_indicators = {
            'Under 30 mins': ['quick', 'fast', '15 min', '20 min', '30 min', 'instant'],
            '30-60 mins': ['45 min', '1 hour', '60 min'],
            '1-2 hours': ['1.5 hour', '2 hour', '90 min', '120 min'],
            'Over 2 hours': ['3 hour', '4 hour', 'overnight', 'slow cook']
        }
        
        for time_range, indicators in time_indicators.items():
            if any(indicator in steps.lower() for indicator in indicators):
                return time_range
        
        # Fallback based on complexity
        ingredient_count = recipe.ingredients.count()
        if ingredient_count <= 5:
            return 'Under 30 mins'
        elif ingredient_count <= 10:
            return '30-60 mins'
        else:
            return '1-2 hours'

    def generate_basic_tags(self, recipe):
        """Generate basic tags based on ingredients and name"""
        tags = []
        text = f"{recipe.name} {recipe.description}".lower()
        ingredient_names = [ing.name.lower() for ing in recipe.ingredients.all()]
        all_text = f"{text} {' '.join(ingredient_names)}"
        
        # Check for dietary tags
        if not any(meat in all_text for meat in ['beef', 'chicken', 'pork', 'fish', 'meat']):
            tags.append('vegetarian')
        
        if not any(dairy in all_text for dairy in ['milk', 'cheese', 'butter', 'cream']):
            tags.append('dairy-free')
        
        if any(spicy in all_text for spicy in ['spicy', 'hot', 'chili', 'pepper']):
            tags.append('spicy')
        
        if any(healthy in all_text for healthy in ['healthy', 'salad', 'fresh', 'light']):
            tags.append('healthy')
        
        if any(comfort in all_text for comfort in ['comfort', 'hearty', 'rich']):
            tags.append('comfort-food')
        
        return tags

    def validate_and_format_response(self, categorization):
        """Validate and format AI response"""
        return {
            'cuisine_type': categorization.get('cuisineType', 'Other') if categorization.get('cuisineType') in self.cuisine_types else 'Other',
            'difficulty': categorization.get('difficulty', 'Medium') if categorization.get('difficulty') in self.difficulty_levels else 'Medium',
            'cooking_time': categorization.get('cookingTime', 'Under 30 mins') if categorization.get('cookingTime') in self.cooking_time_ranges else 'Under 30 mins',
            'tags': categorization.get('tags', [])[:10] if isinstance(categorization.get('tags'), list) else []
        }

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        recipe_id = options['recipe_id']
        limit = options['limit']
        
        if not openai.api_key:
            self.stdout.write(
                self.style.WARNING('OpenAI API key not found. Using fallback categorization only.')
            )
        
        # Get recipes to categorize
        if recipe_id:
            try:
                recipes = [Recipe.objects.get(id=recipe_id)]
            except Recipe.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Recipe with ID {recipe_id} not found'))
                return
        else:
            if force:
                recipes = Recipe.objects.all()[:limit]
            else:
                # Only categorize recipes without categories
                recipes = Recipe.objects.filter(
                    Q(cuisine_type__isnull=True) | 
                    Q(difficulty__isnull=True) | 
                    Q(cooking_time__isnull=True)
                )[:limit]
        
        if not recipes:
            self.stdout.write(self.style.SUCCESS('No recipes need categorization!'))
            return
        
        self.stdout.write(f'Categorizing {len(recipes)} recipes...')
        
        categorized_count = 0
        failed_count = 0
        
        for i, recipe in enumerate(recipes, 1):
            try:
                self.stdout.write(f'Processing {i}/{len(recipes)}: {recipe.name}')
                
                # Categorize the recipe
                categorization = self.categorize_meal_with_ai(recipe)
                
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  Would categorize as: {categorization["cuisine_type"]}, '
                            f'{categorization["difficulty"]}, {categorization["cooking_time"]}'
                        )
                    )
                    if categorization['tags']:
                        self.stdout.write(f'  Tags: {", ".join(categorization["tags"])}')
                else:
                    # Save to database
                    recipe.cuisine_type = categorization['cuisine_type']
                    recipe.difficulty = categorization['difficulty']
                    recipe.cooking_time = categorization['cooking_time']
                    recipe.tags = categorization['tags']
                    recipe.categorized_at = timezone.now()
                    recipe.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  Categorized as: {categorization["cuisine_type"]}, '
                            f'{categorization["difficulty"]}, {categorization["cooking_time"]}'
                        )
                    )
                
                categorized_count += 1
                
                # Rate limiting to avoid API limits
                if openai.api_key and i % 10 == 0:
                    time.sleep(1)
                    
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'  Failed to categorize "{recipe.name}": {e}')
                )
                failed_count += 1
                continue
        
        # Summary
        action = "Would categorize" if dry_run else "Categorized"
        self.stdout.write(
            self.style.SUCCESS(
                f'\n{action} {categorized_count} recipes successfully!'
            )
        )
        
        if failed_count > 0:
            self.stdout.write(
                self.style.WARNING(f'Failed to categorize {failed_count} recipes')
            )
