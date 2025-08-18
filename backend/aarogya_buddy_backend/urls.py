# aarogya_buddy_backend/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/auth/', include('users.urls')), # Include your app's urls
    path('api/v1/medicines/', include('medicines.urls')),
    path('api/v1/symptoms/', include('symptoms.urls')),
    path('api/v1/diet-plans/', include('diet_plans.urls')),
    path('api/v1/reports/', include('report_analysis.urls')),
]
