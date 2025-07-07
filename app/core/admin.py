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

@admin.register(models.IngredientAllData)
class IngredientAllDataAdmin(admin.ModelAdmin):
    list_display = ["name", "is_verified", "recipe_count", "created_at", "updated_at"]
    list_filter = ["is_verified", "created_at", "contains_allergens", "dietary_preferences"]
    search_fields = ["name"]
    ordering = ["name"]
    filter_horizontal = ["contains_allergens", "dietary_preferences"]
    readonly_fields = ["created_at", "updated_at", "recipe_count"]
    actions = ["mark_as_verified", "mark_as_unverified", "find_duplicates"]
    
    def recipe_count(self, obj):
        """Show how many recipes use this ingredient"""
        return obj.recipes.count()
    recipe_count.short_description = "Used in recipes"
    
    def mark_as_verified(self, request, queryset):
        """Mark selected ingredients as verified"""
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"{updated} ingredients marked as verified.")
    mark_as_verified.short_description = "Mark selected ingredients as verified"
    
    def mark_as_unverified(self, request, queryset):
        """Mark selected ingredients as unverified"""
        updated = queryset.update(is_verified=False)
        self.message_user(request, f"{updated} ingredients marked as unverified.")
    mark_as_unverified.short_description = "Mark selected ingredients as unverified"
    
    def find_duplicates(self, request, queryset):
        """Find potential duplicates among selected ingredients"""
        from difflib import SequenceMatcher
        
        ingredients = list(queryset.order_by('name'))
        duplicates_found = []
        
        for i, ing1 in enumerate(ingredients):
            for ing2 in ingredients[i+1:]:
                similarity = SequenceMatcher(None, ing1.name.lower(), ing2.name.lower()).ratio()
                if similarity > 0.8:
                    duplicates_found.append(f"{ing1.name} ↔ {ing2.name} ({similarity:.0%})")
        
        if duplicates_found:
            message = "Potential duplicates found:\n" + "\n".join(duplicates_found[:10])
            if len(duplicates_found) > 10:
                message += f"\n... and {len(duplicates_found) - 10} more"
        else:
            message = "No potential duplicates found."
            
        self.message_user(request, message)
    find_duplicates.short_description = "Find potential duplicates in selection"

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
