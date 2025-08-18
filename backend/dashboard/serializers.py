from rest_framework import serializers
from .models import SymptomLog, WeightLog, DailyMealLog

class SymptomLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SymptomLog
        fields = ['predicted_disease', 'timestamp']

class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = ['weight_kg', 'timestamp']

class DailyMealLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMealLog
        fields = ['date', 'breakfast_completed', 'lunch_completed', 'dinner_completed']
