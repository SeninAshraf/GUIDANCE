from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/career-agent/', include('career_agent.urls')),
    path('api/resume-builder/', include('resume_builder.urls')),
    path('api/interview-coach/', include('interview_coach.urls')),
]
