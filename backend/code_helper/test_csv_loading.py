import requests
import json

def test_leetcode_csv_problems():
    url = "http://localhost:8000/api/code-helper/problem/"
    categories = ['strings', 'sql', 'logic']
    
    for cat in categories:
        print(f"\n--- Testing Category: {cat} ---")
        try:
            res = requests.get(f"{url}?category={cat}&difficulty=beginner")
            if res.status_code == 200:
                data = res.json()
                print(f"Title: {data.get('title')}")
                print(f"LeetCode URL: {data.get('leetcode_url')}")
            else:
                print(f"Error {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    test_leetcode_csv_problems()
