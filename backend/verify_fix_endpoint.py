import requests
import json
import os

# Ensure we have a token if auth is required, but for now assuming it might be open or we can test the public part
# The view checks for authentication? 
# In `views.py`: `permission_classes` is default (AllowAny in settings? No, settings has 'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'])
# So we should be able to hit it without token for testing if AllowAny is set.

url = "http://127.0.0.1:8000/api/interview-coach/start/"
data = {
    "job_role": "Software Engineer"
}

print(f"Testing Endpoint: {url}")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except:
        print("Response Text:")
        print(response.text)
        
    if response.status_code == 200 and "questions" in response.json():
        print("\nSUCCESS: Questions generated successfully!")
    else:
        print("\nFAILURE: Endpoint returned error or unexpected format.")

except Exception as e:
    print(f"Request Error: {e}")
