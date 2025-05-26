from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import User, Ingredient, Recipe, MealPlan, ShoppingList

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'dietary_restrictions']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )
        user.dietary_restrictions = validated_data.get('dietary_restrictions', '')
        user.save()
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))
        return super().update(instance, validated_data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'quantity']

class RecipeSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, read_only=True)
    ingredient_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Ingredient.objects.all(), write_only=True, source='ingredients'
    )

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'description', 'ingredients', 'ingredient_ids']

class MealPlanSerializer(serializers.ModelSerializer):
    recipes = RecipeSerializer(many=True, read_only=True)
    recipe_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Recipe.objects.all(), write_only=True, source='recipes'
    )

    class Meta:
        model = MealPlan
        fields = ['id', 'date', 'recipes', 'recipe_ids']

class ShoppingListSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, read_only=True)
    ingredient_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Ingredient.objects.all(), write_only=True, source='ingredients'
    )

    class Meta:
        model = ShoppingList
        fields = ['id', 'name', 'ingredients', 'ingredient_ids']
