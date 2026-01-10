import os
import django
import sys

sys.path.append('/Users/millu/Desktop/GUIDANCE/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.test import APIClient

def run():
    print("Attempting to generate resume via APIClient...")
    client = APIClient()
    data = {
        'fullName': 'Test User',
        'email': 'test@example.com',
        'phone': '1234567890',
        'linkedin': 'linkedin.com/in/test',
        'summary': 'Test summary with emoji 🚀',
        'experience': [{
            'title': 'Developer',
            'company': 'Tech Corp',
            'duration': '2020-2023',
            'description': 'Wrote code 💻'
        }],
        'education': [],
        'skills': 'Python, Django, ⭐'
    }
    
    try:
        # Simulate invalid token
        client.credentials(HTTP_AUTHORIZATION='Token invalidtoken123')
        response = client.post('/api/resume-builder/generate/', data, format='json')
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Response Content:")
            print(response.content.decode())
    except Exception as e:
        print("Error encountered:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run()
