from django.urls import path
from .views import GenerateResumeView

urlpatterns = [
    path('generate/', GenerateResumeView.as_view(), name='generate-resume'),
]
