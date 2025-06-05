import csv
from django.core.management.base import BaseCommand
from core.models import IngredientAllData

class Command(BaseCommand):
    help = "Import ingredients from ingredients.csv into IngredientAllData"

    def handle(self, *args, **kwargs):
        with open('resources/ingredients.csv', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or not row[0].strip():
                    continue  # Skip empty lines
                name = row[0].strip()
                if name and not IngredientAllData.objects.filter(name=name).exists():
                    IngredientAllData.objects.create(name=name)
        self.stdout.write(self.style.SUCCESS('Ingredients imported successfully.'))