from datetime import datetime
import re
import sys
import os

from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import generics, viewsets, filters as drf_filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Count
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken

from django_filters import rest_framework as dj_filters
from django_filters.rest_framework import DjangoFilterBackend

sys.path.append(os.path.join(os.path.dirname(__file__), '../resources'))
from actual_ai import get_weighted_phrase_embedding, find_recipes_by_ingredients

from django.db.models import Q
from .serializers import UserSerializer
from rest_framework import status

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

#  User Registration
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

#  User Profile Management
class CurrentUserView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            from .serializers import UserUpdateSerializer
            return UserUpdateSerializer
        from .serializers import UserSerializer
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

#  Dietary Preferences
class DietaryPreferenceViewSet(viewsets.ModelViewSet):
    queryset = DietaryPreference.objects.all()
    serializer_class = DietaryPreferenceSerializer
    permission_classes = [IsAuthenticated]


#  Allergies
class AllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.all()
    serializer_class = AllergySerializer
    permission_classes = [IsAuthenticated]


#  User Profile
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


#  Ingredient Management 
class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return only ingredients belonging to the current user ("fridge" contents)
        return Ingredient.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # When creating a new ingredient, automatically assign it to the current user
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle_availability(self, request, pk=None):
        # Toggle the availability status of a specific ingredient
        ingredient = self.get_object()
        ingredient.is_available = not ingredient.is_available
        ingredient.save()
        return Response({"status": "updated", "is_available": ingredient.is_available})

    @action(detail=False, methods=["post"])
    def add_from_global(self, request):
        # Add an ingredient from the global list (IngredientAllData) to the user's fridge
        name = request.data.get("name")
        quantity = request.data.get("quantity", 1)
        expiration_date = request.data.get("expiration_date")  # Accept expiration date from frontend
        if not name:
            return Response({"error": "No ingredient name provided."}, status=400)
        try:
            base = IngredientAllData.objects.get(name=name)
        except IngredientAllData.DoesNotExist:
            return Response({"error": "Ingredient does not exist."}, status=404)
        # Get or create the ingredient for the user, and update quantity/expiration if it already exists
        ingredient, created = Ingredient.objects.get_or_create(
            user=request.user, name=base.name,
            defaults={"quantity": quantity, "expiration_date": expiration_date}
        )
        if not created:
            ingredient.quantity += int(quantity)
            if expiration_date:
                ingredient.expiration_date = expiration_date
            ingredient.save()
        return Response(IngredientSerializer(ingredient).data)

    @action(detail=True, methods=["patch"])
    def set_quantity(self, request, pk=None):
        # Set a new quantity (and optionally expiration date) for a specific ingredient in the user's fridge
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
    


#  Ingredient All Data (for global search)
class IngredientAllDataViewSet(viewsets.ModelViewSet):
    queryset = IngredientAllData.objects.all()
    serializer_class = IngredientAllDataSerializer
    permission_classes = [IsAuthenticated]


#  Recipes
class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Recipe.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


#  Meal Planning with Filtering
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


#  Shopping List
class ShoppingListViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


#  Shopping List Items
class ShoppingListItemViewSet(viewsets.ModelViewSet):
    queryset = ShoppingListItem.objects.all()
    serializer_class = ShoppingListItemSerializer
    permission_classes = [IsAuthenticated]


#  Stats Endpoint
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


# Global ingredient search (used to add to user's own list)
class GlobalIngredientSearchView(generics.ListAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [drf_filters.SearchFilter]
    search_fields = ['name']


# Recipe suggestions based on user's available ingredients
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def matching_recipes(request):
    user_ingredients = request.user.ingredients.filter(is_available=True).values_list('name', flat=True)
    matching = Recipe.objects.filter(ingredients__name__in=user_ingredients).distinct()
    return Response(RecipeSerializer(matching, many=True).data)

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=400)

        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request())
            email = idinfo["email"]
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            username = f"{first_name}_{last_name}".lower()

            user, created = User.objects.get_or_create(email=email, defaults={
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
            })

            if created:
                UserProfile.objects.create(user=user)

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

        except ValueError:
            return Response({"error": "Invalid token"}, status=400)
        


def normalize_title(title):
    # Remove content inside parentheses, including the parentheses
    title = re.sub(r'\(.*?\)', '', title)
    # Normalize the title
    return title.strip().lower().replace("’", "'").replace("`", "'").replace("”", '"').replace("“", '"')

# AI Recipe Search based on ingredients
class AIRecipeSearchView(APIView):
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

        # Use the AI function to get recipe titles
        recipe_titles = find_recipes_by_ingredients(ingredients)

        # Normalize all DB recipe names once
        db_recipes = list(Recipe.objects.all())
        normalized_db = {normalize_title(r.name): r for r in db_recipes}

        # Find recipes by normalized title
        matched_recipes = []
        for ai_title in recipe_titles:
            norm_ai_title = normalize_title(ai_title)
            if norm_ai_title in normalized_db:
                matched_recipes.append(normalized_db[norm_ai_title])

        # Serialize recipes with ingredients and other information
        serialized_recipes = []
        for recipe in matched_recipes:
            serialized_recipes.append({
                "id": recipe.id,
                "name": recipe.name,
                "ingredients": list(recipe.ingredients.values_list('name', flat=True)),
            })
                

        print(f"AIRecipeSearchView: Found {len(matched_recipes)} recipes for {ingredients}")
        print("AI returned recipe titles:", recipe_titles)
        return Response(RecipeSerializer(matched_recipes, many=True).data)
    