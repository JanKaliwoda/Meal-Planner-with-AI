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
    list_display = ["user", "dietary_preference"]
    filter_horizontal = ["allergies"]
    list_filter = ["dietary_preference"]

@admin.register(models.IngredientAllData)
class IngredientAllDataAdmin(admin.ModelAdmin):
    list_display = ["name", "get_allergens", "get_dietary_preferences", "recipe_count"]
    list_filter = ["contains_allergens", "dietary_preferences"]
    search_fields = ["name"]
    ordering = ["name"]
    filter_horizontal = ["contains_allergens", "dietary_preferences"]
    readonly_fields = ["recipe_count"]
    actions = ["find_duplicates"]
    
    def recipe_count(self, obj):
        """Show how many recipes use this ingredient"""
        return obj.recipes.count()
    recipe_count.short_description = "Used in recipes"
    
    def get_allergens(self, obj):
        """Display all allergens for this ingredient"""
        allergens = obj.contains_allergens.all()
        if allergens:
            return ", ".join([allergen.name for allergen in allergens])
        return "None"
    get_allergens.short_description = "Allergens"
    
    def get_dietary_preferences(self, obj):
        """Display all dietary preferences for this ingredient"""
        preferences = obj.dietary_preferences.all()
        if preferences:
            return ", ".join([pref.name for pref in preferences])
        return "None"
    get_dietary_preferences.short_description = "Dietary Preferences"
    
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
    list_display = ["name", "created_by", "created_by_ai", "get_ingredients"]
    search_fields = ["name", "description", "steps", "ingredients__name"]
    filter_horizontal = ["ingredients"]

    def get_ingredients(self, obj):
        return ", ".join([ing.name for ing in obj.ingredients.all()])
    get_ingredients.short_description = "Ingredients"
