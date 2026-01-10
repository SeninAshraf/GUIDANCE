import requests
import json

url = "http://127.0.0.1:8000/api/interview-coach/end-session/"

data = {
    "history": [
        {"question": "Tell me about yourself.", "answer": "I am a software engineer."}
    ],
    "stats": {
        "focus_score": 85,
        "posture_score": 90
    }
}

# Simulate request WITHOUT Authorization header (unauthenticated user)
headers = {
    'Content-Type': 'application/json'
    # 'Authorization': ... intentionally missing
}

print(f"Testing PDF Generation Endpoint: {url}")
try:
    response = requests.post(url, json=data, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        if response.headers.get('Content-Type') == 'application/pdf':
            print("\nSUCCESS: PDF received!")
            # Save it to check if it's valid
            with open('test_report.pdf', 'wb') as f:
                f.write(response.content)
            print("Saved to test_report.pdf")
        else:
            print("\nFAILURE: Response is 200 but not PDF.")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            print(response.text[:500])
    else:
        print("\nFAILURE: Endpoint returned error.")
        print(response.text)

except Exception as e:
    print(f"Request Error: {e}")
