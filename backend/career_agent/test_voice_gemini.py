import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_voice_agent_gemini():
    url = "http://localhost:8000/api/career-agent/advice/"
    payload = {
        "message": "Hello, I want to become a Flutter Developer.",
        "language": "english",
        "history": []
    }
    
    try:
        print(f"Testing Voice Agent with Gemini Flash Latest...")
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"AI Response Snippet: {data['response'][:100]}...")
            if data['audio_base64']:
                print(f"Audio Generated: YES (Size: {len(data['audio_base64'])})")
            else:
                print(f"Audio Generated: NO")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_voice_agent_gemini()
