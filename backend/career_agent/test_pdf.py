import requests
import os

def test_pdf():
    url = "http://localhost:8000/api/career-agent/generate-pdf/"
    payload = {
        "history": [
            {"role": "user", "content": "I want to be a Python Dev"},
            {"role": "ai", "content": "Great, you should learn Django."}
        ]
    }
    
    try:
        print("Testing PDF Generation...")
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        if response.status_code == 200:
            content_len = len(response.content)
            print(f"PDF Content Length: {content_len} bytes")
            if content_len < 1000:
                print("PDF too small! Content might be an error or empty.")
                print(f"Content Start: {response.content[:200]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_pdf()
