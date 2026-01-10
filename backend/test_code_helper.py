import requests
import json
import time

def test_code_helper():
    base_url = "http://localhost:8000/api/code-helper"
    
    print("\n--- Testing Code Helper API ---")
    
    # Test 1: Get Problem (this triggers Groq or Fallback)
    print("\n1. Fetching a problem (Beginner/Strings)...")
    try:
        t0 = time.time()
        url = f"{base_url}/problem/?difficulty=beginner&category=strings"
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Latency: {time.time() - t0:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("Success! Title:", data.get('title'))
            # print("Steps:", json.dumps(data.get('steps', []), indent=2))
        else:
            print("Error:", response.text)
            
    except Exception as e:
        print(f"Exception during fetch: {e}")

    # Test 2: Validate Thought
    print("\n2. Testing Thought Validation...")
    try:
        t0 = time.time()
        url = f"{base_url}/validate/"
        payload = {
            "thought": "I will reverse the string by iterating backwards.",
            "story": "Reverse a string to open the gate."
        }
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Latency: {time.time() - t0:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print("Success! Correct:", data.get('correct'))
            print("Feedback:", data.get('feedback'))
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Exception during validation: {e}")

if __name__ == "__main__":
    test_code_helper()
