from django.urls import path
from .views import CareerAdviceView

urlpatterns = [
    path('advice/', CareerAdviceView.as_view(), name='career-advice'),
]
