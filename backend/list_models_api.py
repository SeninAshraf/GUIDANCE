import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
URL = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"

try:
    response = requests.get(URL)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data.get('models', []))} models:")
        for m in data.get('models', []):
             if 'generateContent' in m.get('supportedGenerationMethods', []):
                print(f"- {m['name']} ({m.get('displayName', 'No Name')})")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
