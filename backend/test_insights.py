import requests
import json

def test_job_insights():
    try:
        priority = { "role": "backend", "tech_stack": ["python"] }
        sort_by = "recent"
        
        # 1. Fetch from Remotive API
        url = "https://remotive.com/api/remote-jobs"
        print(f"Fetching {url}...")
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error: Status {response.status_code}")
            return
        
        data = response.json()
        all_jobs = data.get('jobs', [])
        print(f"Fetched {len(all_jobs)} jobs.")

        # Logic from views.py
        scored_jobs = []
        target_role = priority.get('role', '').lower()
        target_tech = [t.lower() for t in priority.get('tech_stack', [])]
        target_loc = priority.get('location', '').lower()
        
        software_keywords = ['software', 'engineer', 'developer', 'data', 'ai', 'machine learning', 'backend', 'frontend', 'full stack', 'devops']

        count = 0
        for job in all_jobs:
            title = job.get('title', '').lower()
            category = job.get('category', '').lower()
            
            is_software = any(k in title for k in software_keywords) or 'software' in category or 'development' in category
            if not is_software:
                continue
            count += 1

        print(f"Analyzed jobs. Found {count} software jobs.")
        print("Success!")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_job_insights()
