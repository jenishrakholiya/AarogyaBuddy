from django.urls import path
from .views import SymptomCheckerView

urlpatterns = [
    path('check/', SymptomCheckerView.as_view(), name='symptom-check'),
]