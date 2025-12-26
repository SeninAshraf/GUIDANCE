
import requests

GEMINI_API_KEY = "AIzaSyBayntqY--sYvX8PzcIXwyV4mgp0eWSK4o"

def list_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("\n--- AVAILABLE MODELS ---")
            data = response.json()
            for m in data.get('models', []):
                print(f"Name: {m['name']}, Methods: {m.get('supportedGenerationMethods')}")
            print("------------------------\n")
        else:
            print(f"List Models Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"List Models Exception: {e}")

def test_models():
    models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-flash-latest",
    ]

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
        try:
            print(f"Testing {model}...")
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"SUCCESS: {model} is working!")
            else:
                 print(f"Error: {response.text[:100]}") 
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    list_models()
    test_models()
