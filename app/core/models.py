from django.db import models
from django.contrib.auth.models import User

class DietaryPreference(models.Model):
    """User's dietary lifestyle (e.g., vegan, keto)"""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Allergy(models.Model):
    """Known allergies a user might have"""
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name
    
class UserProfile(models.Model):
    """Extended user profile storing dietary info and allergies"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    dietary_preference = models.ForeignKey(DietaryPreference, on_delete=models.SET_NULL, null=True, blank=True)
    allergies = models.ManyToManyField(Allergy, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

class Ingredient(models.Model):
    """Available or needed ingredient"""
    name = models.CharField(max_length=100)
    quantity = models.CharField(max_length=50, blank=True)  # Optional: "2 cups", etc.
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ingredients')
    is_available = models.BooleanField(default=True)
    expiration_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.quantity})"
    
class IngredientAllData(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # Dietary/allergy information for filtering
    contains_allergens = models.ManyToManyField(Allergy, blank=True, related_name='ingredients')
    dietary_preferences = models.ManyToManyField(DietaryPreference, blank=True, related_name='ingredients')
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Ingredient'
        verbose_name_plural = 'Ingredients'

    def __str__(self):
        return self.name
    
class Recipe(models.Model):
    """Represents a recipe in the system"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    steps = models.TextField()
    ingredients = models.ManyToManyField('IngredientAllData', related_name='recipes')
    created_by_ai = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    # Dietary/allergy information for filtering
    contains_allergens = models.ManyToManyField(Allergy, blank=True, related_name='recipes')
    suitable_for_diets = models.ManyToManyField(DietaryPreference, blank=True, related_name='recipes')

    # Add categorization fields
    cuisine_type = models.CharField(
        max_length=50,
        choices=[
            ('Italian', 'Italian'),
            ('Mexican', 'Mexican'),
            ('Asian', 'Asian'),
            ('American', 'American'),
            ('Mediterranean', 'Mediterranean'),
            ('Indian', 'Indian'),
            ('Thai', 'Thai'),
            ('Chinese', 'Chinese'),
            ('French', 'French'),
            ('Greek', 'Greek'),
            ('Middle Eastern', 'Middle Eastern'),
            ('Japanese', 'Japanese'),
            ('Korean', 'Korean'),
            ('Spanish', 'Spanish'),
            ('British', 'British'),
            ('German', 'German'),
            ('Other', 'Other'),
        ],
        null=True,
        blank=True,
        help_text="Cuisine type of the recipe"
    )
    
    difficulty = models.CharField(
        max_length=20,
        choices=[
            ('Easy', 'Easy'),
            ('Medium', 'Medium'),
            ('Hard', 'Hard'),
        ],
        null=True,
        blank=True,
        help_text="Difficulty level of the recipe"
    )
    
    cooking_time = models.CharField(
        max_length=30,
        choices=[
            ('Under 30 mins', 'Under 30 mins'),
            ('30-60 mins', '30-60 mins'),
            ('1-2 hours', '1-2 hours'),
            ('Over 2 hours', 'Over 2 hours'),
        ],
        null=True,
        blank=True,
        help_text="Estimated cooking time"
    )
    
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tags for the recipe (vegetarian, spicy, healthy, etc.)"
    )
    
    # Add timestamp for when categorization was done
    categorized_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the recipe was categorized"
    )

    def __str__(self):
        return self.name
    
    def is_categorized(self):
        """Check if recipe has been categorized"""
        return all([
            self.cuisine_type,
            self.difficulty,
            self.cooking_time
        ])
    
    def get_category_display(self):
        """Get formatted category display"""
        if self.is_categorized():
            return f"{self.cuisine_type} • {self.difficulty} • {self.cooking_time}"
        return "Not categorized"
    
class Meal(models.Model):
    """A planned meal with a specific recipe at a specific time"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    date = models.DateField(null=True, blank=True)
    meal_type = models.CharField(
        max_length=50,
        choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner')],
        null=True,
        blank=True
    )

    def __str__(self):
        meal_type = self.meal_type.title() if self.meal_type else "Meal"
        date = self.date if self.date else "No date"
        recipe_name = self.recipe.name if self.recipe else "No recipe"
        return f"{meal_type} on {date} - {recipe_name}"
    
class ShoppingList(models.Model):
    """A generated shopping list based on selected recipes"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    items = models.ManyToManyField(IngredientAllData, through='ShoppingListItem')

    def __str__(self):
        return f"Shopping List ({self.created_at.strftime('%Y-%m-%d')})"
    
class ShoppingListItem(models.Model):
    """Ingredient items tied to a shopping list"""
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(IngredientAllData, on_delete=models.CASCADE)
    quantity = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.quantity} {self.ingredient.name}"
