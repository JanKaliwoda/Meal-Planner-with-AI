import re

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
    RecipeCategorizationSerializer,
    MealSerializer,
    ShoppingListSerializer,
    ShoppingListItemSerializer,
)
from django.utils import timezone


# =====================================
# HELPER FUNCTIONS (imported from helpers.py)
# =====================================
from .helpers import (
    HARD_DIETS,
    SOFT_DIETS,
    get_dietary_filter_type,
    filter_and_prioritize_recipes,
    get_user_allergen_filters,
    is_ingredient_safe_from_allergens,
)
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

    @action(detail=True, methods=['post'])
    def categorize(self, request, pk=None):
        """Manually categorize a recipe"""
        recipe = self.get_object()
        serializer = RecipeCategorizationSerializer(recipe, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save(categorized_at=timezone.now())
            return Response({
                'message': 'Recipe categorized successfully',
                'categorization': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def categorized(self, request):
        """Get all categorized recipes with filtering"""
        queryset = self.get_queryset().filter(
            cuisine_type__isnull=False,
            difficulty__isnull=False,
            cooking_time__isnull=False
        )
        
        # Filter by categorization fields
        cuisine_type = request.query_params.get('cuisine_type')
        difficulty = request.query_params.get('difficulty')
        cooking_time = request.query_params.get('cooking_time')
        tags = request.query_params.get('tags')
        
        if cuisine_type:
            queryset = queryset.filter(cuisine_type=cuisine_type)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if cooking_time:
            queryset = queryset.filter(cooking_time=cooking_time)
        if tags:
            tag_list = tags.split(',')
            for tag in tag_list:
                queryset = queryset.filter(tags__contains=[tag.strip()])
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def category_stats(self, request):
        """Get categorization statistics"""
        total_recipes = self.get_queryset().count()
        categorized_recipes = self.get_queryset().filter(
            cuisine_type__isnull=False,
            difficulty__isnull=False,
            cooking_time__isnull=False
        ).count()
        
        # Get distribution stats
        cuisine_stats = self.get_queryset().exclude(
            cuisine_type__isnull=True
        ).values('cuisine_type').annotate(count=Count('id')).order_by('-count')
        
        difficulty_stats = self.get_queryset().exclude(
            difficulty__isnull=True
        ).values('difficulty').annotate(count=Count('id')).order_by('-count')
        
        cooking_time_stats = self.get_queryset().exclude(
            cooking_time__isnull=True
        ).values('cooking_time').annotate(count=Count('id')).order_by('-count')
        
        return Response({
            'total_recipes': total_recipes,
            'categorized_recipes': categorized_recipes,
            'categorization_percentage': round((categorized_recipes / total_recipes) * 100, 2) if total_recipes > 0 else 0,
            'cuisine_distribution': list(cuisine_stats),
            'difficulty_distribution': list(difficulty_stats),
            'cooking_time_distribution': list(cooking_time_stats)
        })
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options for categorization"""
        return Response({
            'cuisine_types': [choice[0] for choice in Recipe._meta.get_field('cuisine_type').choices],
            'difficulties': [choice[0] for choice in Recipe._meta.get_field('difficulty').choices],
            'cooking_times': [choice[0] for choice in Recipe._meta.get_field('cooking_time').choices],
            'popular_tags': self.get_popular_tags()
        })
    
    def get_popular_tags(self):
        """Get most popular tags from categorized recipes"""
        from collections import Counter
        
        recipes_with_tags = self.get_queryset().exclude(tags=[])
        all_tags = []
        
        for recipe in recipes_with_tags:
            all_tags.extend(recipe.tags)
        
        tag_counts = Counter(all_tags)
        return [tag for tag, count in tag_counts.most_common(20)]


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

        # Apply dietary preference filtering (from request or user profile) using suitable_for_diets
        diet_value = request.data.get('diet')
        diet_obj = None
        if diet_value:
            try:
                # Accept both integer (ID) and string (name)
                if isinstance(diet_value, int) or (isinstance(diet_value, str) and str(diet_value).isdigit()):
                    diet_obj = DietaryPreference.objects.get(id=int(diet_value))
                else:
                    diet_obj = DietaryPreference.objects.get(name__iexact=str(diet_value))
                matching_recipes = matching_recipes.filter(suitable_for_diets=diet_obj)
            except DietaryPreference.DoesNotExist:
                matching_recipes = matching_recipes.none()
        elif request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                if user_profile.dietary_preference:
                    diet_obj = user_profile.dietary_preference
                    matching_recipes = matching_recipes.filter(suitable_for_diets=diet_obj)
            except UserProfile.DoesNotExist:
                pass

        
        # 2. Allergen filtering (only for authenticated users)
        if request.user.is_authenticated:
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                if user_profile.allergies.exists():
                    user_allergen_names = get_user_allergen_filters(request.user)
                    if user_allergen_names:
                        # Get the searched ingredient names in lowercase for comparison
                        searched_ingredients_lower = [name.lower() for name in ingredients]
                        # Build Q objects to exclude recipes with unsafe ingredients, except searched ones
                        # First, get all unsafe ingredient names except searched ones
                        unsafe_ingredient_names = [name for name in user_allergen_names if name not in searched_ingredients_lower]
                        if unsafe_ingredient_names:
                            matching_recipes = matching_recipes.exclude(
                                ingredients__name__in=unsafe_ingredient_names
                            )
                        # Also exclude by contains_allergens relationship, but allow searched ingredients
                        user_allergens = user_profile.allergies.all()
                        allergen_names_lower = [allergy.name.lower() for allergy in user_allergens]
                        conflicting_allergens = [allergen for allergen in user_allergens if allergen.name.lower() not in searched_ingredients_lower]
                        if conflicting_allergens:
                            matching_recipes = matching_recipes.exclude(contains_allergens__in=conflicting_allergens)
            except UserProfile.DoesNotExist:
                pass

        # Pagination: get limit and offset from query params
        try:
            limit = int(request.query_params.get('limit', 50))
            offset = int(request.query_params.get('offset', 0))
        except Exception:
            limit = 50
            offset = 0

        # Calculate total_count BEFORE slicing for pagination
        total_count = matching_recipes.count() if hasattr(matching_recipes, 'count') else len(matching_recipes)
        # If matching_recipes is a queryset, slice it; if it's a list, slice as list
        if hasattr(matching_recipes, 'all') or hasattr(matching_recipes, 'count'):
            recipes_page = matching_recipes[offset:offset+limit]
        else:
            recipes_page = matching_recipes[offset:offset+limit] if isinstance(matching_recipes, list) else []
        serializer = RecipeSerializer(recipes_page, many=True)

        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'offset': offset,
            'limit': limit,
            'has_more': (offset + limit) < total_count
        })
    
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
        # Allow creation without date/meal_type (for meal templates)
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
