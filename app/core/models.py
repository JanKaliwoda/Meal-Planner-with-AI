from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class DietaryPreference(models.Model):
    """User's dietary lifestyle (e.g., vegan, keto)"""
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Allergy(models.Model):
    """Known allergies a user might have"""
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name
    
class UserProfile(models.Model):
    """Extended user profile storing dietary info and allergies"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    dietary_preferences = models.ManyToManyField(DietaryPreference, blank=True)
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

    def __str__(self):
        return f"{self.name} ({self.quantity})"
    
class IngredientAllData(models.Model):
    name = models.CharField(max_length=100, unique=True)

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

    def __str__(self):
        return self.name
    
class Meal(models.Model):
    """A planned meal with a specific recipe at a specific time"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    date = models.DateField()
    meal_type = models.CharField(
        max_length=50,
        choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner')]
    )

    def __str__(self):
        return f"{self.meal_type.title()} on {self.date} - {self.recipe.name}"
    
class ShoppingList(models.Model):
    """A generated shopping list based on selected recipes"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    items = models.ManyToManyField(Ingredient, through='ShoppingListItem')

    def __str__(self):
        return f"Shopping List ({self.created_at.strftime('%Y-%m-%d')})"
    
class ShoppingListItem(models.Model):
    """Ingredient items tied to a shopping list"""
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.quantity} {self.ingredient.name}"
    