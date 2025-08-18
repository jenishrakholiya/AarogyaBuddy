from django.db import models

class Medicine(models.Model):
    """
    Stores information about both Allopathic and Ayurvedic medicines.
    """
    medicine_name = models.CharField(max_length=255, unique=True, primary_key=True)
    medicine_type = models.CharField(max_length=50) # 'Allopathic' or 'Ayurvedic'
    treats_disease = models.CharField(max_length=255, db_index=True)
    frequency = models.CharField(max_length=100, blank=True, null=True)
    meal_relation = models.CharField(max_length=100, blank=True, null=True)
    routine = models.TextField(blank=True, null=True)
    side_effects = models.TextField(blank=True, null=True)
    contraindications = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.medicine_name} ({self.medicine_type})"
