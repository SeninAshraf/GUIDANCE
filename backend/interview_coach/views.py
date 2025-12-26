from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
import requests
from pypdf import PdfReader

GEMINI_API_KEY = "AIzaSyBayntqY--sYvX8PzcIXwyV4mgp0eWSK4o"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={GEMINI_API_KEY}"

class StartInterviewView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request):
        file_obj = request.FILES.get('resume')
        job_role = request.data.get('job_role')
        
        if not file_obj and not job_role:
             return Response({"error": "Resume file OR Job Role is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            input_context = ""
            if file_obj:
                # Extract Text from Resume
                reader = PdfReader(file_obj)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                input_context = f"Resume Content: {text[:3000]}..."
            else:
                input_context = f"Job Role: {job_role}. Generate questions specifically for this role."

            # Generate Questions via Gemini REST
            prompt = (
                "You are an Interviewer. Generate exactly 5 short interview questions based on the provided context. "
                "Question 1 MUST be 'Tell me about yourself'. "
                "Questions 2-5 must be specific technical or behavioral questions relevant to the Resume or Job Role. "
                "Keep questions short (1 sentence each). "
                "Output ONLY the questions separated by a pipe symbol (|). "
                f"\n\nContext: {input_context}" 
            )
            
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            response = requests.post(GEMINI_URL, json=payload)
            
            if response.status_code != 200:
                 return Response({"error": "Failed to generate questions"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            data = response.json()
            raw_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            
            # Clean up and ensure format
            questions = [q.strip() for q in raw_text.split('|') if q.strip()]
            if len(questions) == 0:
                 questions = ["Tell me about yourself.", "Why are you a good fit?", "Describe a challenge you faced."]
            
            return Response({"questions": questions})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnalyzePerformanceView(APIView):
    def post(self, request):
        data = request.data
        posture_score = data.get('averageScore', 0)
        face_frames = data.get('goodPostureCount', 0)
        total_frames = data.get('frames', 1)
        
        # Calculate percentage
        focus_score = int((face_frames / total_frames) * 100) if total_frames > 0 else 0
        
        try:
             # Generate Summary via Gemini REST
            prompt = f"An interview candidate had a visual focus score of {focus_score}% and a general posture score of {posture_score}/100. Provide a short, constructive feedback summary about their non-verbal performance."
            
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            response = requests.post(GEMINI_URL, json=payload)
            
            if response.status_code != 200:
                 ai_feedback = "Could not generate feedback."
            else:
                 data = response.json()
                 ai_feedback = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No feedback generated.')
            
            return Response({
                "focus_score": focus_score,
                "posture_score": posture_score,
                "feedback": ai_feedback
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
