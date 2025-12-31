from django.urls import path
from .views import StartInterviewView, AnalyzePerformanceView, EndInterviewView

urlpatterns = [
    path('start/', StartInterviewView.as_view(), name='start-interview'),
    path('analyze/', AnalyzePerformanceView.as_view(), name='analyze-performance'),
    path('end-session/', EndInterviewView.as_view(), name='end-session'),
]
