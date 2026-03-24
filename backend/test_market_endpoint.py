import requests
import json

def test_market_analysis():
    url = "http://localhost:8000/api/insights/market/"
    payload = {"query": "Software Engineer"}
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_market_analysis()
