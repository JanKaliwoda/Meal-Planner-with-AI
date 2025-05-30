from datetime import datetime

from rest_framework.decorators import api_view

from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import generics, viewsets
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

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

from .serializers import (
    UserSerializer,
    DietaryPreferenceSerializer,
    AllergySerializer,
    UserProfileSerializer,
    IngredientSerializer,
    RecipeSerializer,
    MealSerializer,
    ShoppingListSerializer,
    ShoppingListItemSerializer
)

@api_view(['GET'])
def hello_world(request):
    """Hello world endpoint"""
    return Response({'message': f'Hello world: {datetime.now().isoformat()}'})

class CreateUserView(generics.CreateAPIView):

        queryset = User.objects.all()
        serializer_class = UserSerializer
        permission_classes = [AllowAny]

class DietaryPreferenceViewSet(viewsets.ModelViewSet):
    queryset = DietaryPreference.objects.all()
    serializer_class = DietaryPreferenceSerializer
    permission_classes = [IsAuthenticated]


class AllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.all()
    serializer_class = AllergySerializer
    permission_classes = [IsAuthenticated]


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]


class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Ingredient.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Recipe.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MealViewSet(viewsets.ModelViewSet):
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Meal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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