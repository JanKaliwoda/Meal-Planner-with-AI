from django.contrib import admin
from django.urls import path, include

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from app.views import hello_world, CreateUserView
from app.views import (
    DietaryPreferenceViewSet,
    AllergyViewSet,
    UserProfileViewSet,
    IngredientViewSet,
    RecipeViewSet,
    MealViewSet,
    ShoppingListViewSet,
    ShoppingListItemViewSet
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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/hello-world/', hello_world),
    path('api/user/register/', CreateUserView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='get_token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('api-auth/', include('rest_framework.urls')),
    
    path('api/', include(router.urls)),
]