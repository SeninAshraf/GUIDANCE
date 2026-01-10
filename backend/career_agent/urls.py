from django.urls import path
from .views import CareerAdviceView, ChatPDFView

urlpatterns = [
    path('advice/', CareerAdviceView.as_view(), name='career-advice'),
    path('generate-pdf/', ChatPDFView.as_view(), name='generate-pdf'),
]
