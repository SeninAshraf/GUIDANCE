import requests
import io

# URL for the local backend
url = "http://127.0.0.1:8000/api/interview-coach/start/"

# Create a dummy PDF content
# A simple PDF header/body is enough to test if pypdf accepts the stream, 
# or we can try to use reportlab to generate a real valid 1-page PDF in memory.
from reportlab.pdfgen import canvas

buffer = io.BytesIO()
p = canvas.Canvas(buffer)
p.drawString(100, 100, "I am a Senior Software Engineer with 10 years of experience in Python and Django.")
p.showPage()
p.save()
buffer.seek(0)

# Simulate File Upload
files = {
    'resume': ('test_resume.pdf', buffer, 'application/pdf')
}

# Simulate generic header sent by frontend if user is not logged in
headers = {
    'Authorization': 'Token undefined'
}

print(f"Testing Resume Upload Endpoint: {url}")
try:
    # Note: requests.post with 'files' automatically sets multipart/form-data
    response = requests.post(url, files=files, headers=headers) 
    
    print(f"Status Code: {response.status_code}")
    print("Response Text:")
    print(response.text)
        
    if response.status_code == 200 and "questions" in response.json():
        questions = response.json()['questions']
        if len(questions) > 0:
             print("\nSUCCESS: Questions generated from Resume!")
             print(questions)
        else:
             print("\nFAILURE: Questions list is empty.")
    else:
        print("\nFAILURE: Endpoint returned error.")

except Exception as e:
    print(f"Request Error: {e}")
