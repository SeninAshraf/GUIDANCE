import requests
import json

def test_remotive_api():
    url = "http://localhost:8000/api/insights/"
    payload = {
        "priority": {"role": "software", "tech_stack": [], "location": ""},
        "sort_by": "relevance"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Summary: {json.dumps(data.get('insights_summary'), indent=2)}")
        print(f"Count: {len(data.get('recommended_jobs', []))}")
        if data.get('recommended_jobs'):
            print(f"First Job: {data['recommended_jobs'][0]['job_title']} at {data['recommended_jobs'][0]['company']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_remotive_api()
