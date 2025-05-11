from django.db import models
from django.contrib.auth.models import User

class Recipe(models.Model):
    """Represents a recipe in the system"""
    name = models.CharField(max_length=255)
    steps = models.TextField()

    def __str__(self):
        return self.name