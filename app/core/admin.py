from django.contrib import admin
from core import models

@admin.register(models.Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ["id", "name"]
    search_fields = ["name"]

@admin.register(models.DietaryPreference)
class DietaryPreferenceAdmin(admin.ModelAdmin):
    list_display = ["id", "name"]
    search_fields = ["name"]

@admin.register(models.UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user"]
    filter_horizontal = ["allergies", "dietary_preferences"]

@admin.register(models.Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ["name", "quantity", "is_available", "user"]
    list_filter = ["is_available"]
    search_fields = ["name", "user__username"]

@admin.register(models.Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ["name", "created_by", "created_by_ai"]
    filter_horizontal = ["ingredients"]

@admin.register(models.Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ["user", "meal_type", "date", "recipe"]

@admin.register(models.ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at"]

@admin.register(models.ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    list_display = ["shopping_list", "ingredient", "quantity"]
