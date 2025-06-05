from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from app.views import GoogleLoginView
from app.views import CreateUserView
from app.views import (
    DietaryPreferenceViewSet,
    AllergyViewSet,
    UserProfileViewSet,
    CurrentUserView,
    ChangePasswordView,
    IngredientViewSet,
    RecipeViewSet,
    MealViewSet,
    ShoppingListViewSet,
    ShoppingListItemViewSet,
    MealStatsView,
    IngredientAllDataViewSet,
    GlobalIngredientSearchView,
    matching_recipes
)

router = DefaultRouter()
router.register('dietary-preferences', DietaryPreferenceViewSet, basename='dietary-preference')
router.register('allergies', AllergyViewSet, basename='allergy')
router.register('user-profiles', UserProfileViewSet, basename='user-profile')
router.register('ingredients', IngredientViewSet, basename='ingredient')
router.register('recipes', RecipeViewSet, basename='recipe')
router.register('meals', MealViewSet, basename='meal')
router.register('shopping-lists', ShoppingListViewSet, basename='shopping-list')
router.register('shopping-list-items', ShoppingListItemViewSet, basename='shopping-list-item')
router.register('ingredient-all-data', IngredientAllDataViewSet, basename='ingredient-all-data')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/register/', CreateUserView.as_view(), name='register'),
    path('api/user/profile/', CurrentUserView.as_view(), name='current-user'),
    path('api/user/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/token/', TokenObtainPairView.as_view(), name='get_token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('api-auth/', include('rest_framework.urls')),
    
    path('api/', include(router.urls)),
    path("api/stats/summary/", MealStatsView.as_view(), name="meal-stats"),
    path("api/ingredient-search/", GlobalIngredientSearchView.as_view(), name="ingredient-search"),
    path("api/matching-recipes/", matching_recipes, name="matching-recipes"),

    path("api/user/google-login/", GoogleLoginView.as_view(), name="google-login"),
]
