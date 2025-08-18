import pandas as pd
from django.core.management.base import BaseCommand
from medicines.models import Medicine
import os

class Command(BaseCommand):
    help = 'Loads medicine data from the professional_synthetic_dataset.csv file'

    def handle(self, *args, **kwargs):
        # Path to the CSV file (assuming it's in the root of your backend project)
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '..', 'professional_synthetic_dataset.csv')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found at {file_path}. Please place the CSV in the root of the backend project.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Found CSV file at: {file_path}'))
        df = pd.read_csv(file_path)
        
        medicines_to_create = []

        for _, row in df.iterrows():
            # Process Allopathic medicine
            allo_name = str(row['allopathic_medicine']).strip()
            if allo_name and allo_name.lower() != 'nan':
                medicines_to_create.append(
                    Medicine(
                        medicine_name=allo_name,
                        medicine_type='Allopathic',
                        treats_disease=row['prognosis'],
                        frequency=row['allopathic_frequency'],
                        meal_relation=row['allopathic_meal_relation'],
                        routine=row['allopathic_routine'],
                        side_effects=row['allopathic_side_effects'],
                        contraindications=row['allopathic_contraindications']
                    )
                )

            # Process Ayurvedic medicine
            ayur_name = str(row['ayurvedic_medicine']).strip()
            if ayur_name and ayur_name.lower() != 'nan':
                 medicines_to_create.append(
                    Medicine(
                        medicine_name=ayur_name,
                        medicine_type='Ayurvedic',
                        treats_disease=row['prognosis'],
                        frequency=row['ayurvedic_frequency'],
                        meal_relation=row['ayurvedic_meal_relation'],
                        routine=row['ayurvedic_routine'],
                        side_effects=row['ayurvedic_side_effects'],
                        contraindications=row['ayurvedic_contraindications']
                    )
                )

        # Use bulk_create for efficiency, ignoring conflicts for duplicate medicine names
        Medicine.objects.bulk_create(medicines_to_create, ignore_conflicts=True)

        self.stdout.write(self.style.SUCCESS(f'Successfully loaded or updated {len(medicines_to_create)} medicine records.'))