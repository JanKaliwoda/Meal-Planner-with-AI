from datetime import datetime

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

@api_view(['GET'])
def hello_world(request):
    """Hello world endpoint"""
    return Response({'message': f'Hello world: {datetime.now().isoformat()}'})

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]