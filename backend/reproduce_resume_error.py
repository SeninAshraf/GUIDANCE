import os
import django
import sys
from io import BytesIO
from django.http import HttpRequest

sys.path.append('/Users/millu/Desktop/GUIDANCE/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from resume_builder.views import GenerateResumeView

def run():
    print("Attempting to generate resume...")
    request = HttpRequest()
    request.method = 'POST'
    request.data = {
        'fullName': 'Test User',
        'email': 'test@example.com',
        'phone': '1234567890',
        'linkedin': 'linkedin.com/in/test',
        'summary': 'Test summary',
        'experience': [],
        'education': [],
        'skills': 'Python, Django'
    }
    
    view = GenerateResumeView()
    try:
        response = view.post(request)
        print("Success! Status code:", response.status_code)
    except Exception as e:
        print("Error encountered:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run()
