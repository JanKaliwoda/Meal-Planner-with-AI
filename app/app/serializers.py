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
    ShoppingListItem,
    IngredientAllData
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
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "password2"]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        user.is_active = True  # ✅ Ensure active
        user.save()
        UserProfile.objects.create(user=user)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "username"]

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    dietary_preference = serializers.PrimaryKeyRelatedField(
        queryset=DietaryPreference.objects.all(), required=False, allow_null=True
    )
    allergies = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Allergy.objects.all(), required=False
    )

    class Meta:
        model = UserProfile
        fields = ["id", "user", "dietary_preference", "allergies"]



class IngredientSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Ingredient
        fields = ["id", "name", "quantity", "is_available", "user", 'expiration_date', 'notes']


class IngredientAllDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngredientAllData
        fields = ["id", "name"]


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = IngredientAllDataSerializer(many=True, read_only=True)
    created_by = serializers.ReadOnlyField(source='created_by.username')
    
    # Add categorization fields
    cuisine_type = serializers.CharField(read_only=True)
    difficulty = serializers.CharField(read_only=True)
    cooking_time = serializers.CharField(read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        read_only=True
    )
    categorized_at = serializers.DateTimeField(read_only=True)
    is_categorized = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            "id", "name", "description", "steps", "ingredients", "created_by", 
            "created_by_ai", "cuisine_type", "difficulty", "cooking_time", 
            "tags", "categorized_at", "is_categorized", "category_display"
        ]
    
    def get_is_categorized(self, obj):
        return obj.is_categorized()
    
    def get_category_display(self, obj):
        return obj.get_category_display()


# Add a serializer for categorization updates
class RecipeCategorizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ['cuisine_type', 'difficulty', 'cooking_time', 'tags']
        
    def validate_cuisine_type(self, value):
        valid_cuisines = [choice[0] for choice in Recipe._meta.get_field('cuisine_type').choices]
        if value not in valid_cuisines:
            raise serializers.ValidationError(f"Invalid cuisine type. Must be one of: {valid_cuisines}")
        return value
    
    def validate_difficulty(self, value):
        valid_difficulties = [choice[0] for choice in Recipe._meta.get_field('difficulty').choices]
        if value not in valid_difficulties:
            raise serializers.ValidationError(f"Invalid difficulty. Must be one of: {valid_difficulties}")
        return value
    
    def validate_cooking_time(self, value):
        valid_times = [choice[0] for choice in Recipe._meta.get_field('cooking_time').choices]
        if value not in valid_times:
            raise serializers.ValidationError(f"Invalid cooking time. Must be one of: {valid_times}")
        return value
    
    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 tags allowed")
        return value

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
    ingredient = IngredientAllDataSerializer(read_only=True)
    ingredient_id = serializers.PrimaryKeyRelatedField(
        queryset=IngredientAllData.objects.all(),
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