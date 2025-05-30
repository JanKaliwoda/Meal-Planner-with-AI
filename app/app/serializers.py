from django.contrib.auth.models import User
from rest_framework import serializers
from core.models import (
    DietaryPreference,
    Allergy,
    UserProfile,
    Ingredient,
    Recipe,
    Meal,
    ShoppingList,
    ShoppingListItem
)


class DietaryPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietaryPreference
        fields = ["id", "name"]


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = ["id", "name"]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    
class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    dietary_preferences = serializers.PrimaryKeyRelatedField(
        many=True, queryset=DietaryPreference.objects.all(), required=False
    )
    allergies = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Allergy.objects.all(), required=False
    )

    class Meta:
        model = UserProfile
        fields = ["id", "user", "dietary_preferences", "allergies"]



class IngredientSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Ingredient
        fields = ["id", "name", "quantity", "is_available", "user"]


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Ingredient.objects.all()
    )
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Recipe
        fields = ["id", "name", "description", "steps", "ingredients", "created_by", "created_by_ai"]


class MealSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    recipe = RecipeSerializer(read_only=True)
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True
    )

    class Meta:
        model = Meal
        fields = ["id", "user", "date", "meal_type", "recipe", "recipe_id"]


class ShoppingListItemSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer(read_only=True)
    ingredient_id = serializers.PrimaryKeyRelatedField(
        queryset=Ingredient.objects.all(),
        source='ingredient',
        write_only=True
    )

    class Meta:
        model = ShoppingListItem
        fields = ["id", "shopping_list", "ingredient", "ingredient_id", "quantity"]


class ShoppingListSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    items = ShoppingListItemSerializer(source='shoppinglistitem_set', many=True, read_only=True)

    class Meta:
        model = ShoppingList
        fields = ["id", "user", "created_at", "items"]