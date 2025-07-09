import re
import sys
import os

from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import generics, viewsets, filters as drf_filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Q, Count
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken

from django_filters import rest_framework as dj_filters
from django_filters.rest_framework import DjangoFilterBackend

from core.models import (
    DietaryPreference,
    Allergy,
    IngredientAllData,
    UserProfile,
    Ingredient,
    Recipe,
    Meal,
    ShoppingList,
    ShoppingListItem,
)

from .serializers import (
    IngredientAllDataSerializer,
    UserSerializer,
    DietaryPreferenceSerializer,
    AllergySerializer,
    UserProfileSerializer,
    IngredientSerializer,
    RecipeSerializer,
    MealSerializer,
    ShoppingListSerializer,
    ShoppingListItemSerializer,
)


# =====================================
# HELPER FUNCTIONS
# =====================================

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
    
    # Check if the allergen is in our map
    for key, values in allergen_map.items():
        if allergen_name.lower() in values:
            return values
    
    # If not found in map, return the allergen itself
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
    
    # Exception: eggplant should not be filtered out even if "egg" is in allergens
    if ingredient_lower == 'eggplant':
        return True
    
    if ingredient_lower == "milk chocolate":
        return True
    
    # Check if ingredient contains any allergen names
    for allergen_name in user_allergen_names:
        if allergen_name.lower() in ingredient_lower:
            return False
    
    return True


# =====================================
# AUTHENTICATION & USER MANAGEMENT
# =====================================

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class CurrentUserView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            from .serializers import UserUpdateSerializer
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        new_password2 = request.data.get("new_password2")

        if not user.check_password(old_password):
            return Response({"detail": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != new_password2:
            return Response({"detail": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=400)

        try:
            # Verify Google token with proper client ID and clock skew tolerance
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(),
                audience=None,  # Accept any client ID for now - you may want to specify your Google client ID here
                clock_skew_in_seconds=10  # Allow 10 seconds of clock skew
            )
            
            email = idinfo["email"]
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            
            # Generate a unique username if the simple format would cause duplicates
            base_username = f"{first_name}_{last_name}".lower()
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            user, created = User.objects.get_or_create(email=email, defaults={
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
            })

            # Create UserProfile if it doesn't exist
            if created or not UserProfile.objects.filter(user=user).exists():
                UserProfile.objects.get_or_create(user=user, defaults={
                    'dietary_preference': None
                })

            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            })

        except ValueError as e:
            print(f"Google token verification failed: {e}")
            return Response({"error": "Invalid token"}, status=400)
        except Exception as e:
            print(f"Google login error: {e}")
            return Response({"error": "Authentication failed"}, status=400)


# =====================================
# USER PROFILE & PREFERENCES
# =====================================

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Ensure user field is set and no duplicate profiles
        user = self.request.user
        if UserProfile.objects.filter(user=user).exists():
            # If profile already exists, update it instead of creating new one
            existing_profile = UserProfile.objects.get(user=user)
            for key, value in serializer.validated_data.items():
                setattr(existing_profile, key, value)
            existing_profile.save()
            return existing_profile
        else:
            serializer.save(user=user)
    
    def create(self, request, *args, **kwargs):
        # Check if user already has a profile
        if UserProfile.objects.filter(user=request.user).exists():
            # Update existing profile instead of creating new one
            profile = UserProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Create new profile
            return super().create(request, *args, **kwargs)

class DietaryPreferenceViewSet(viewsets.ModelViewSet):
    queryset = DietaryPreference.objects.all()
    serializer_class = DietaryPreferenceSerializer
    permission_classes = [IsAuthenticated]


class AllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.all()
    serializer_class = AllergySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search_query = self.request.query_params.get('search', None)
        
        # Define the curated list of 100 most popular allergens
        curated_allergens = [
            # Top 20 most common allergens (4 rows of 5 each)
            'milk', 'eggs', 'peanuts', 'tree nuts', 'soy',
            'fish', 'shellfish', 'wheat', 'sesame', 'gluten',
            'sulphites', 'corn', 'mustard', 'celery', 'lupin',
            'coconut', 'yeast', 'chocolate', 'tomatoes', 'citrus',
            
            # Additional 80 popular allergens
            'almonds', 'walnuts', 'cashews', 'pistachios', 'hazelnuts',
            'brazil nuts', 'pecans', 'macadamia nuts', 'pine nuts', 'chestnuts',
            'shrimp', 'crab', 'lobster', 'oysters', 'mussels', 'clams', 'scallops',
            'salmon', 'tuna', 'cod', 'halibut', 'sardines', 'anchovies',
            'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose',
            'sour cream', 'cream cheese', 'ice cream',
            'barley', 'rye', 'oats', 'spelt', 'kamut', 'triticale',
            'bulgur', 'semolina', 'durum',
            'strawberries', 'kiwi', 'mango', 'pineapple', 'peaches',
            'apples', 'bananas', 'grapes', 'cherries', 'apricots',
            'carrots', 'peppers', 'onions', 'garlic', 'potatoes', 'eggplant', 'spinach', 'lettuce',
            'cinnamon', 'vanilla', 'oregano', 'basil', 'thyme', 'rosemary',
            'paprika', 'cumin', 'turmeric', 'ginger', 'black pepper',
            'avocado', 'cocoa', 'caffeine', 'alcohol', 'vinegar', 'honey', 'maple syrup',
            'artificial sweeteners', 'food coloring', 'preservatives', 'msg', 'sulfur dioxide',
            'beef', 'chicken', 'pork', 'turkey', 'lamb', 'duck', 'goose',
            'chickpeas', 'lentils', 'black beans', 'kidney beans', 'lima beans',
            'green peas', 'pinto beans', 'molluscs'
        ]
        
        # Define the top 20 most popular allergens (4 rows of 5 each)
        top_20_allergens = [
            'milk', 'eggs', 'peanuts', 'tree nuts', 'soy',
            'fish', 'shellfish', 'wheat', 'sesame', 'gluten',
            'sulphites', 'corn', 'mustard', 'celery', 'lupin',
            'coconut', 'yeast', 'chocolate', 'tomatoes', 'citrus'
        ]
        
        # First, limit to only the curated list of 100 allergens
        queryset = queryset.filter(name__in=curated_allergens)
        
        if search_query:
            # If searching, return matching results from the curated list only
            queryset = queryset.filter(name__istartswith=search_query)
        else:
            # If no search, only show top 20 allergens (4 rows of 5)
            queryset = queryset.filter(name__in=top_20_allergens)
        
        return queryset


# =====================================
# INGREDIENT MANAGEMENT
# =====================================

class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Ingredient.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle_availability(self, request, pk=None):
        ingredient = self.get_object()
        ingredient.is_available = not ingredient.is_available
        ingredient.save()
        return Response({"status": "updated", "is_available": ingredient.is_available})

    @action(detail=False, methods=["post"])
    def add_from_global(self, request):
        name = request.data.get("name")
        quantity = request.data.get("quantity", 1)
        expiration_date = request.data.get("expiration_date")
        notes = request.data.get("notes", "")
        
        if not name:
            return Response({"error": "No ingredient name provided."}, status=400)
        
        try:
            base = IngredientAllData.objects.get(name=name)
        except IngredientAllData.DoesNotExist:
            return Response({"error": "Ingredient does not exist."}, status=404)
        
        # Always create a new ingredient entry (allow multiple of same ingredient)
        ingredient_data = {
            "user": request.user,
            "name": base.name,
            "quantity": quantity,
            "expiration_date": expiration_date,
            "notes": notes
        }
        
        # Remove None values
        ingredient_data = {k: v for k, v in ingredient_data.items() if v is not None}
        
        ingredient = Ingredient.objects.create(**ingredient_data)
        
        return Response(IngredientSerializer(ingredient).data)

    @action(detail=True, methods=["patch"])
    def set_quantity(self, request, pk=None):
        ingredient = self.get_object()
        quantity = request.data.get("quantity")
        expiration_date = request.data.get("expiration_date")
        
        if quantity is not None:
            ingredient.quantity = int(quantity)
        if expiration_date:
            ingredient.expiration_date = expiration_date
        
        ingredient.save()
        return Response({
            "status": "updated",
            "quantity": ingredient.quantity,
            "expiration_date": ingredient.expiration_date
        })


class IngredientAllDataViewSet(viewsets.ModelViewSet):
    queryset = IngredientAllData.objects.all()
    serializer_class = IngredientAllDataSerializer
    permission_classes = [AllowAny]
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply search filter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(name__istartswith=search_query)
        
        # Apply dietary preference and allergen filtering if user is authenticated
        if self.request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=self.request.user)
                
                # Filter by dietary preference
                if user_profile.dietary_preference:
                    queryset = queryset.filter(dietary_preferences=user_profile.dietary_preference)
                
                # Exclude ingredients that contain user's allergens using comprehensive filtering
                if user_profile.allergies.exists():
                    user_allergen_names = get_user_allergen_filters(self.request.user)
                    if user_allergen_names:
                        # Filter out unsafe ingredients with exceptions
                        safe_ingredients = []
                        for ingredient in queryset:
                            if is_ingredient_safe_from_allergens(ingredient.name, user_allergen_names):
                                safe_ingredients.append(ingredient.id)
                        
                        queryset = queryset.filter(id__in=safe_ingredients)
                        
                        # Also exclude by contains_allergens relationship
                        user_allergens = user_profile.allergies.all()
                        queryset = queryset.exclude(contains_allergens__in=user_allergens)
                    
            except UserProfile.DoesNotExist:
                pass
        
        return queryset


class IngredientAllDataUnfilteredViewSet(viewsets.ModelViewSet):
    """Ingredient search that filters out user's allergens but not dietary preferences"""
    queryset = IngredientAllData.objects.all()
    serializer_class = IngredientAllDataSerializer
    permission_classes = [AllowAny]
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply search filter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(name__istartswith=search_query)
        
        # Filter out allergens if user is authenticated
        if self.request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=self.request.user)
                if user_profile.allergies.exists():
                    user_allergen_names = get_user_allergen_filters(self.request.user)
                    if user_allergen_names:
                        # Filter out unsafe ingredients with exceptions
                        safe_ingredients = []
                        for ingredient in queryset:
                            if is_ingredient_safe_from_allergens(ingredient.name, user_allergen_names):
                                safe_ingredients.append(ingredient.id)
                        
                        queryset = queryset.filter(id__in=safe_ingredients)
                        
                        # Also exclude by contains_allergens relationship
                        user_allergens = user_profile.allergies.all()
                        queryset = queryset.exclude(contains_allergens__in=user_allergens)
                    
            except UserProfile.DoesNotExist:
                pass
        
        return queryset


# =====================================
# RECIPE MANAGEMENT
# =====================================

class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Recipe.objects.all()
        
        # Apply dietary preference and allergy filtering if user is authenticated
        if self.request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=self.request.user)
                
                # Filter by dietary preference - make it more permissive
                if user_profile.dietary_preference:
                    # Use Q objects to handle cases where the relationship might not exist
                    queryset = queryset.filter(
                        Q(suitable_for_diets=user_profile.dietary_preference) |
                        Q(suitable_for_diets__isnull=True)
                    )
                
                # Exclude recipes that contain user's allergens using comprehensive filtering
                if user_profile.allergies.exists():
                    user_allergen_names = get_user_allergen_filters(self.request.user)
                    if user_allergen_names:
                        # Filter out recipes with unsafe ingredients with exceptions
                        safe_recipes = []
                        for recipe in queryset:
                            recipe_safe = True
                            for ingredient in recipe.ingredients.all():
                                if not is_ingredient_safe_from_allergens(ingredient.name, user_allergen_names):
                                    recipe_safe = False
                                    break
                            if recipe_safe:
                                safe_recipes.append(recipe.id)
                        
                        queryset = queryset.filter(id__in=safe_recipes)
                        
                        # Also exclude by contains_allergens relationship
                        user_allergens = user_profile.allergies.all()
                        queryset = queryset.exclude(contains_allergens__in=user_allergens)
                    
            except UserProfile.DoesNotExist:
                pass
        
        return queryset.distinct()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def add_missing_ingredients_to_shopping_list(self, request, pk=None):
        """Add ingredients from the selected recipe to the user's shopping list"""
        recipe = self.get_object()
        user = request.user

        # Get all ingredient names in the user's fridge
        user_ingredient_names = set(user.ingredients.values_list('name', flat=True))

        # Get all ingredient names required by the recipe
        recipe_ingredient_names = set(recipe.ingredients.values_list('name', flat=True))

        # Find missing ingredients
        missing_ingredient_names = recipe_ingredient_names - user_ingredient_names

        if not missing_ingredient_names:
            return Response({"detail": "All ingredients are already in your fridge."})

        # Get or create the user's current shopping list
        shopping_list, _ = ShoppingList.objects.get_or_create(user=user)

        # Add missing ingredients to the shopping list
        added_items = []
        for name in missing_ingredient_names:
            try:
                ingredient_data = IngredientAllData.objects.get(name=name)
                item, created = ShoppingListItem.objects.get_or_create(
                    shopping_list=shopping_list,
                    ingredient=ingredient_data,
                    defaults={"quantity": "1"}
                )
                if created:
                    added_items.append(name)
            except IngredientAllData.DoesNotExist:
                continue

        return Response({
            "added": list(added_items),
            "detail": f"Added {len(added_items)} missing ingredients to your shopping list."
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matching_recipes(request):
    """Recipe suggestions based on user's available ingredients using pure matching"""
    user_ingredients = request.user.ingredients.filter(is_available=True).values_list('name', flat=True)
    
    if not user_ingredients:
        return Response([])
    
    # Pure matching algorithm: Find recipes that contain ALL the user's ingredients
    # This ensures recipes must have every ingredient from user's storage
    matching = Recipe.objects.filter(
        ingredients__name__in=user_ingredients
    ).annotate(
        matching_count=Count('ingredients', filter=Q(ingredients__name__in=user_ingredients))
    ).filter(
        matching_count=len(user_ingredients)  # Only recipes with ALL user ingredients
    ).order_by('name').distinct()
    
    # Filter out recipes containing user's allergens
    try:
        user_profile = UserProfile.objects.get(user=request.user)
        
        # Filter by dietary preference - make it more permissive
        if user_profile.dietary_preference:
            matching = matching.filter(
                Q(suitable_for_diets=user_profile.dietary_preference) |
                Q(suitable_for_diets__isnull=True)
            )
        
        # Exclude recipes that contain user's allergens using comprehensive filtering
        if user_profile.allergies.exists():
            user_allergen_names = get_user_allergen_filters(request.user)
            if user_allergen_names:
                # Filter out recipes with unsafe ingredients with exceptions
                safe_recipes = []
                for recipe in matching:
                    recipe_safe = True
                    for ingredient in recipe.ingredients.all():
                        if not is_ingredient_safe_from_allergens(ingredient.name, user_allergen_names):
                            recipe_safe = False
                            break
                    if recipe_safe:
                        safe_recipes.append(recipe.id)
                
                matching = matching.filter(id__in=safe_recipes)
                
                # Also exclude by contains_allergens relationship
                user_allergens = user_profile.allergies.all()
                matching = matching.exclude(contains_allergens__in=user_allergens)
            
    except UserProfile.DoesNotExist:
        pass
    
    return Response(RecipeSerializer(matching.distinct(), many=True).data)


class RecipeSearchView(APIView):
    """Pure matching Recipe Search based on ingredients with comprehensive allergen filtering"""
    permission_classes = [AllowAny]

    def post(self, request):
        ingredient_names = request.data.get("ingredients", [])
        if not ingredient_names or not isinstance(ingredient_names, list):
            return Response({"error": "A list of ingredients is required."}, status=400)

        # Remove this entire allergen filtering section for ingredients
        # Users should be able to search with any ingredient
        
        # Ensure all ingredients exist in IngredientAllData
        ingredients_qs = IngredientAllData.objects.filter(name__in=ingredient_names)
        ingredients = list(ingredients_qs.values_list('name', flat=True))

        if not ingredients:
            return Response({"error": "No matching ingredients found."}, status=400)

        # Pure matching algorithm: Find recipes that contain ALL the selected ingredients
        matching_recipes = Recipe.objects.filter(
            ingredients__name__in=ingredients
        ).annotate(
            matching_count=Count('ingredients', filter=Q(ingredients__name__in=ingredients))
        ).filter(
            matching_count=len(ingredients)  # Only recipes with ALL ingredients
        ).order_by('name').distinct()

        # Apply user dietary preferences and allergen filtering if authenticated
        if request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                
                # Filter by dietary preference - make it more permissive
                if user_profile.dietary_preference:
                    matching_recipes = matching_recipes.filter(
                        Q(suitable_for_diets=user_profile.dietary_preference) |
                        Q(suitable_for_diets__isnull=True)
                    )
                
                # Exclude recipes that contain user's allergens using comprehensive filtering
                if user_profile.allergies.exists():
                    user_allergen_names = get_user_allergen_filters(request.user)
                    if user_allergen_names:
                        # Filter out recipes with unsafe ingredients with exceptions
                        safe_recipes = []
                        for recipe in matching_recipes:
                            recipe_safe = True
                            for ingredient in recipe.ingredients.all():
                                if not is_ingredient_safe_from_allergens(ingredient.name, user_allergen_names):
                                    recipe_safe = False
                                    break
                            if recipe_safe:
                                safe_recipes.append(recipe.id)
                        
                        matching_recipes = matching_recipes.filter(id__in=safe_recipes)
                        
                        # Also exclude by contains_allergens relationship
                        user_allergens = user_profile.allergies.all()
                        matching_recipes = matching_recipes.exclude(contains_allergens__in=user_allergens)
                
            except UserProfile.DoesNotExist:
                pass

        # Return the matching recipes
        return Response(RecipeSerializer(matching_recipes, many=True).data)


# =====================================
# MEAL PLANNING
# =====================================

class MealFilter(dj_filters.FilterSet):
    start = dj_filters.DateFilter(field_name="date", lookup_expr="gte")
    end = dj_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Meal
        fields = ["start", "end", "meal_type"]


class MealViewSet(viewsets.ModelViewSet):
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = MealFilter

    def get_queryset(self):
        return Meal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def add_recipe_to_calendar(self, request):
        """
        Assign a recipe to a specific date (and optionally meal_type) for the current user.
        Expects: {"recipe_id": 123, "date": "2025-06-10", "meal_type": "dinner"}
        """
        recipe_id = request.data.get("recipe_id")
        date = request.data.get("date")
        meal_type = request.data.get("meal_type", "dinner")

        if not recipe_id or not date:
            return Response({"error": "recipe_id and date are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return Response({"error": "Recipe not found."}, status=status.HTTP_404_NOT_FOUND)

        # Always create a new meal, even if one exists for this date/type/recipe
        meal = Meal.objects.create(
            user=request.user,
            date=date,
            meal_type=meal_type,
            recipe=recipe
        )

        return Response({
            "id": meal.id,
            "date": meal.date,
            "meal_type": meal.meal_type,
            "recipe": meal.recipe.name,
        }, status=status.HTTP_201_CREATED)


# =====================================
# SHOPPING LIST MANAGEMENT
# =====================================

class ShoppingListViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ShoppingListItemViewSet(viewsets.ModelViewSet):
    queryset = ShoppingListItem.objects.all()
    serializer_class = ShoppingListItemSerializer
    permission_classes = [IsAuthenticated]


# =====================================
# STATISTICS
# =====================================

class MealStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        meals = Meal.objects.filter(user=user)
        total_meals = meals.count()

        meal_type_counts = meals.values("meal_type").annotate(count=Count("meal_type"))

        top_ingredients = (
            Ingredient.objects.filter(user=user)
            .values("name")
            .annotate(count=Count("name"))
            .order_by("-count")[:5]
        )

        return Response({
            "total_meals": total_meals,
            "meal_types": {m["meal_type"]: m["count"] for m in meal_type_counts},
            "top_ingredients": list(top_ingredients),
        })
