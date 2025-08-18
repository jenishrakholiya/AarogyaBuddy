from django.urls import path
from .views import MedicineSearchView

urlpatterns = [
    path('search/', MedicineSearchView.as_view(), name='medicine-search'),
]