from django.urls import path
from .auth_views import login_view, signup_view

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/signup/', signup_view, name='signup'),
]
