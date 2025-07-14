"""
Helper functions for dietary filtering, allergen filtering, and normalization.
"""
import re
from django.db.models import Case, When, IntegerField
from core.models import UserProfile

# --- Dietary filtering logic ---
HARD_DIETS = {
    'Dairy-Free',
    'Gluten-Free',
    'Vegan',
    'Vegetarian',
    'Keto',
    'Pescatarian',
    'Diabetic-Friendly',
}
SOFT_DIETS = {
    'Heart-Healthy',
    'High-Protein',
    'Low-Fat',
    'Low-Carb',
    'Mediterranean',
}

__all__ = [
    'HARD_DIETS',
    'SOFT_DIETS',
    'get_dietary_filter_type',
    'split_diets_for_popup_and_account',
    'filter_and_prioritize_recipes',
    'normalize_title',
    'get_related_allergens',
    'get_user_allergen_filters',
    'is_ingredient_safe_from_allergens',
]

def get_dietary_filter_type(diet_name):
    """Return 'hard' if diet should strictly exclude, 'soft' if only prioritize, else None."""
    if diet_name in HARD_DIETS:
        return 'hard'
    if diet_name in SOFT_DIETS:
        return 'soft'
    return None

def split_diets_for_popup_and_account(diet_names):
    """Divide diet names into hard and soft for frontend popups/account editing."""
    hard = [d for d in diet_names if d in HARD_DIETS]
    soft = [d for d in diet_names if d in SOFT_DIETS]
    return {'hard': hard, 'soft': soft}

def filter_and_prioritize_recipes(recipes, user_diets):
    """
    Given a queryset of recipes and a list of user diet names:
    - Exclude recipes not matching any hard diet.
    - Prioritize (sort to top) recipes matching any soft diet.
    """
    hard_diets = [d for d in user_diets if d in HARD_DIETS]
    soft_diets = [d for d in user_diets if d in SOFT_DIETS]
    for diet in hard_diets:
        recipes = recipes.filter(suitable_for_diets__name=diet)
    if soft_diets:
        recipes = recipes.annotate(
            soft_priority=Case(
                When(suitable_for_diets__name__in=soft_diets, then=1),
                default=0,
                output_field=IntegerField(),
            )
        ).order_by('-soft_priority')
    return recipes.distinct()

def normalize_title(title):
    """Normalize recipe title for comparison"""
    title = re.sub(r'\(.*?\)', '', title)
    return title.strip().lower().replace("'", "'").replace("`", "'").replace(""", '"').replace(""", '"')

def get_related_allergens(allergen_name):
    """Get all related allergen names for comprehensive filtering"""
    allergen_map = {
        'milk': ['milk', 'dairy', 'lactose', 'casein', 'whey', 'butter', 'cream', 'cheese', 'yogurt', 'sour cream', 'cream cheese', 'ice cream'],
        'eggs': ['eggs', 'egg', 'egg white', 'egg yolk', 'albumin'],
        'peanuts': ['peanuts', 'peanut', 'peanut butter', 'groundnut'],
        'tree nuts': ['almonds', 'walnuts', 'cashews', 'pistachios', 'hazelnuts', 'brazil nuts', 'pecans', 'macadamia nuts', 'pine nuts', 'chestnuts', 'tree nuts'],
        'soy': ['soy', 'soya', 'soybean', 'tofu', 'tempeh', 'miso', 'soy sauce', 'edamame'],
        'fish': ['fish', 'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'anchovies', 'mackerel', 'trout'],
        'shellfish': ['shellfish', 'shrimp', 'crab', 'lobster', 'oysters', 'mussels', 'clams', 'scallops', 'prawns'],
        'wheat': ['wheat', 'flour', 'bread', 'pasta', 'cereals', 'crackers', 'cookies'],
        'sesame': ['sesame', 'sesame seeds', 'tahini', 'sesame oil'],
        'gluten': ['gluten', 'wheat', 'barley', 'rye', 'oats', 'spelt', 'kamut', 'triticale', 'bulgur', 'semolina', 'durum'],
        'sulphites': ['sulphites', 'sulfites', 'sulfur dioxide', 'sodium sulfite'],
        'corn': ['corn', 'maize', 'corn starch', 'corn syrup', 'cornmeal'],
        'mustard': ['mustard', 'mustard seeds', 'dijon mustard'],
        'celery': ['celery', 'celery seeds', 'celeriac'],
        'lupin': ['lupin', 'lupine'],
        'coconut': ['coconut', 'coconut oil', 'coconut milk', 'coconut cream'],
        'yeast': ['yeast', 'nutritional yeast', 'bakers yeast'],
        'chocolate': ['chocolate', 'cocoa', 'cacao', 'dark chocolate', 'milk chocolate'],
        'tomatoes': ['tomatoes', 'tomato', 'tomato sauce', 'ketchup', 'marinara'],
        'citrus': ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'tangerine'],
    }
    for key, values in allergen_map.items():
        if allergen_name.lower() in values:
            return values
    return [allergen_name.lower()]

def get_user_allergen_filters(user):
    """Get comprehensive allergen filter for a user"""
    try:
        user_profile = UserProfile.objects.get(user=user)
        if user_profile.allergies.exists():
            all_allergen_names = set()
            for allergy in user_profile.allergies.all():
                related_allergens = get_related_allergens(allergy.name)
                all_allergen_names.update(related_allergens)
            return list(all_allergen_names)
    except UserProfile.DoesNotExist:
        pass
    return []

def is_ingredient_safe_from_allergens(ingredient_name, user_allergen_names):
    """Check if an ingredient is safe from user's allergens, with exceptions"""
    ingredient_lower = ingredient_name.lower()
    if ingredient_lower == 'eggplant':
        return True
    if ingredient_lower == "milk chocolate":
        return True
    for allergen_name in user_allergen_names:
        if allergen_name.lower() in ingredient_lower:
            return False
    return True
