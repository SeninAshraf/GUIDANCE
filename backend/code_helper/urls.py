from django.urls import path
from .views import MicroProblemView, ValidateThoughtView

urlpatterns = [
    path('problem/', MicroProblemView.as_view(), name='get_problem'),
    path('validate/', ValidateThoughtView.as_view(), name='validate_thought'),
]
