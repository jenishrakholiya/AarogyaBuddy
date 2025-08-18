from django.db import models
from django.conf import settings
from django.utils import timezone


class SymptomLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    predicted_disease = models.CharField(max_length=255)  # E.g., "Common Cold"
    timestamp = models.DateTimeField(default=timezone.now)  # For accurate history ordering
    # Add other fields as needed (e.g., symptoms JSONField for details)

    class Meta:
        ordering = ['-timestamp']  # Latest first for UX in history widget

    def __str__(self):
        return f"{self.user.username} - {self.predicted_disease} ({self.timestamp.date()})"


class WeightLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    timestamp = models.DateField(default=timezone.now)  # Date-only for daily logging
    weight_kg = models.FloatField()  # Precise float for accurate charts

    class Meta:
        unique_together = [('user', 'timestamp')]  # One log per user per day
        ordering = ['timestamp']  # Chronological for progress charts

    def __str__(self):
        return f"{self.user.username} - {self.weight_kg}kg on {self.timestamp}"


class DailyMealLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    breakfast_completed = models.BooleanField(default=False)
    lunch_completed = models.BooleanField(default=False)
    dinner_completed = models.BooleanField(default=False)

    class Meta:
        unique_together = [('user', 'date')]  # One log per user per day for accuracy
        ordering = ['-date']  # Latest first

    def __str__(self):
        return f"{self.user.username} - {self.date}"