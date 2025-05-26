from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    dietary_restrictions = models.TextField(blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class Ingredient(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=100)
    quantity = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.name} ({self.quantity})"


class Recipe(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    ingredients = models.ManyToManyField(Ingredient, related_name='recipes')

    def __str__(self):
        return self.title


class MealPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mealplans')
    date = models.DateField()
    recipes = models.ManyToManyField(Recipe, related_name='mealplans')

    def __str__(self):
        return f"Meal Plan for {self.date}"


class ShoppingList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shoppinglists')
    name = models.CharField(max_length=200)
    ingredients = models.ManyToManyField(Ingredient, related_name='shoppinglists')

    def __str__(self):
        return self.name
