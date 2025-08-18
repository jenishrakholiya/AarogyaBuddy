from django.urls import path
from .views import DietPlanView

urlpatterns = [
    path('generate/', DietPlanView.as_view(), name='generate-diet-plan'),
]