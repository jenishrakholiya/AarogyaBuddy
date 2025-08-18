from django.urls import path
from .views import ReportAnalysisView

urlpatterns = [
    path('analyze/', ReportAnalysisView.as_view(), name='report-analysis'),
]
