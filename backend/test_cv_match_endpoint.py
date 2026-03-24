from reportlab.pdfgen import canvas
import requests
import os

def create_resume_pdf(filename):
    c = canvas.Canvas(filename)
    c.drawString(100, 750, "John Doe")
    c.drawString(100, 730, "Backend Developer")
    c.drawString(100, 710, "Skills: Python, Django, PostgreSQL, Docker, AWS")
    c.drawString(100, 690, "Experience: 5 years of software engineering.")
    c.save()
    print(f"Resume created at {filename}")

def test_cv_match():
    url = "http://localhost:8000/api/insights/match-cv/"
    filename = "test_resume.pdf"
    create_resume_pdf(filename)
    
    try:
        with open(filename, 'rb') as f:
            files = {'resume': f}
            response = requests.post(url, files=files)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print("SUCCESS: CV Match working!")
                data = response.json()
                print(f"Extracted Role: {data['extracted_data']['role']}")
                print(f"Tech Stack: {data['extracted_data']['tech_stack']}")
            else:
                print(f"Error: {response.json().get('error')}")
    except Exception as e:
        print(f"Exception: {e}")
    finally:
        if os.path.exists(filename):
            os.remove(filename)

if __name__ == "__main__":
    test_cv_match()
