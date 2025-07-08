from django.core.management.base import BaseCommand
from core.models import IngredientAllData, Recipe
from django.db.models import Count

class Command(BaseCommand):
    help = 'Delete all ingredients that are not used in any recipes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find ingredients that are not linked to any recipes
        unused_ingredients = IngredientAllData.objects.annotate(
            recipe_count=Count('recipes')
        ).filter(recipe_count=0)
        
        unused_count = unused_ingredients.count()
        
        if unused_count == 0:
            self.stdout.write(
                self.style.SUCCESS('No unused ingredients found! All ingredients are linked to recipes.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {unused_count} unused ingredients:')
            )
            
            # Show first 20 ingredients that would be deleted
            for ingredient in unused_ingredients[:20]:
                self.stdout.write(f'  - {ingredient.name}')
            
            if unused_count > 20:
                self.stdout.write(f'  ... and {unused_count - 20} more')
                
            self.stdout.write(
                self.style.WARNING(f'\nRun without --dry-run to actually delete these ingredients.')
            )
        else:
            # Show some examples before deletion
            self.stdout.write(
                self.style.WARNING(f'Deleting {unused_count} unused ingredients...')
            )
            
            # Show first 10 ingredients being deleted
            examples = list(unused_ingredients[:10].values_list('name', flat=True))
            for ingredient_name in examples:
                self.stdout.write(f'  Deleting: {ingredient_name}')
            
            if unused_count > 10:
                self.stdout.write(f'  ... and {unused_count - 10} more')
            
            # Actually delete the ingredients
            deleted_count = unused_ingredients.delete()[0]
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} unused ingredients!')
            )
            
            # Show remaining ingredient count
            remaining_count = IngredientAllData.objects.count()
            self.stdout.write(
                self.style.SUCCESS(f'Remaining ingredients in database: {remaining_count}')
            )
