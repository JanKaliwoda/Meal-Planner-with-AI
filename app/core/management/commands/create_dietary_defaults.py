from django.core.management.base import BaseCommand
from core.models import DietaryPreference, Allergy


class Command(BaseCommand):
    help = 'Create default dietary preferences and allergies'

    def handle(self, *args, **kwargs):
        # Default dietary preferences
        dietary_preferences = [
            'Vegetarian',
            'Vegan',
            'Gluten-Free',
            'Dairy-Free',
            'Keto',
            'Paleo',
            'Low-Carb',
            'Mediterranean',
            'Pescatarian',
            'Raw Food',
            'Whole30',
            'Low-Fat',
            'High-Protein',
            'Diabetic-Friendly',
            'Heart-Healthy'
        ]

        # Default allergies
        allergies = [
            'Peanuts',
            'Tree Nuts',
            'Milk',
            'Eggs',
            'Wheat',
            'Soy',
            'Fish',
            'Shellfish',
            'Sesame',
            'Mustard',
            'Celery',
            'Lupin',
            'Molluscs',
            'Sulphites',
            'Coconut'
        ]

        # Create dietary preferences
        created_prefs = 0
        for pref_name in dietary_preferences:
            pref, created = DietaryPreference.objects.get_or_create(name=pref_name)
            if created:
                created_prefs += 1
                self.stdout.write(f"Created dietary preference: {pref_name}")

        # Create allergies
        created_allergies = 0
        for allergy_name in allergies:
            allergy, created = Allergy.objects.get_or_create(name=allergy_name)
            if created:
                created_allergies += 1
                self.stdout.write(f"Created allergy: {allergy_name}")

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_prefs} dietary preferences and {created_allergies} allergies'
            )
        )
