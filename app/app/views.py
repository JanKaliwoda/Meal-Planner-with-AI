from datetime import datetime

from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import generics, viewsets, filters as drf_filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Count

from django_filters import rest_framework as dj_filters
from django_filters.rest_framework import DjangoFilterBackend

from core.models import (
    DietaryPreference,
    Allergy,
    UserProfile,
    Ingredient,
    Recipe,
    Meal,
    ShoppingList,
    ShoppingListItem,
)

from .serializers import (
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


#  Basic Hello World
@api_view(['GET'])
def hello_world(request):
    return Response({'message': f'Hello world: {datetime.now().isoformat()}'})


#  User Registration
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


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
        return Ingredient.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle_availability(self, request, pk=None):
        ingredient = self.get_object()
        ingredient.is_available = not ingredient.is_available
        ingredient.save()
        return Response({"status": "updated", "is_available": ingredient.is_available})


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
