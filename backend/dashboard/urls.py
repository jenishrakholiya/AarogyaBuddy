from django.urls import path
from .views import DashboardDataView, UpdateMealLogView, LogWeightView

urlpatterns = [
    path('data/', DashboardDataView.as_view(), name='dashboard-data'),
    path('log-meal/', UpdateMealLogView.as_view(), name='log-meal'),
    path('log-weight/', LogWeightView.as_view(), name='log-weight'),
]