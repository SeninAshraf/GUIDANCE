from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
import os
from pypdf import PdfReader
from groq import Groq

from django.http import FileResponse
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Initialize Groq Client
# We won't initialize globally to ensure env vars are ready
# client = Groq(api_key=GROQ_API_KEY)

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

            # Generate Questions via Groq
            prompt = (
                "You are an Interviewer. Generate exactly 5 short interview questions based on the provided context. "
                "Question 1 MUST be 'Tell me about yourself'. "
                "Questions 2-5 must be specific technical or behavioral questions relevant to the Resume or Job Role. "
                "Keep questions short (1 sentence each). "
                "Output ONLY the questions separated by a pipe symbol (|). "
                f"\n\nContext: {input_context}" 
            )
            

            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                 print("CRITICAL: GROQ_API_KEY is missing in StartInterviewView!")
                 return Response({"error": "Server Configuration Error: API Key missing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            client = Groq(api_key=api_key)

            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
            )
            
            raw_text = completion.choices[0].message.content
            
            # Clean up and ensure format
            questions = [q.strip() for q in raw_text.split('|') if q.strip()]
            
            # Simple fallback if Groq returns numbered list instead of pipes
            if len(questions) < 3:
                 questions = [line for line in raw_text.split('\n') if '?' in line]

            if len(questions) == 0:
                 questions = ["Tell me about yourself.", "Why are you a good fit?", "Describe a challenge you faced."]
            
            return Response({"questions": questions})
            
        except Exception as e:
            print(f"Groq Error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EndInterviewView(APIView):
    def post(self, request):
        try:
            data = request.data
            history = data.get('history', [])
            stats = data.get('stats', {})
            
            # 1. Analyze each answer with AI
            analysis_results = []
            for item in history:
                question = item.get('question', '')
                answer = item.get('answer', '')
                
                if not answer.strip():
                    answer = "[No Answer Provided]"

                # Prompt to get Feedback & Ideal Answer
                prompt = (
                    f"Question: {question}\n"
                    f"Candidate Answer: {answer}\n\n"
                    "Provide a JSON response with 3 fields:\n"
                    "1. feedback_score (0-10)\n"
                    "2. critique (2 sentences on content and language style)\n"
                    "3. improved_answer (An ideal, professional response)"
                )
                
                ai_data = self.get_groq_response(prompt)
                analysis_results.append({
                    "q": question,
                    "a": answer,
                    "feedback": ai_data
                })

            # 2. Generate PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []

            # Title
            story.append(Paragraph("Interview Performance Report", styles['Title']))
            story.append(Spacer(1, 12))

            # Stats Table
            story.append(Paragraph("Performance Summary", styles['Heading2']))
            stats_data = [
                ["Metric", "Score"],
                ["Visual Focus", f"{stats.get('focus_score', 0)}%"],
                ["Confidence/Posture", f"{stats.get('posture_score', 0)}/100"],
            ]
            t = Table(stats_data, colWidths=[200, 100])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(t)
            story.append(Spacer(1, 24))

            # Detailed Analysis
            style_q = ParagraphStyle('Question', parent=styles['Heading3'], textColor=colors.navy)
            style_a = ParagraphStyle('Answer', parent=styles['BodyText'], leftIndent=20)
            style_feed = ParagraphStyle('Feedback', parent=styles['BodyText'], textColor=colors.darkgreen, leftIndent=20)
            
            story.append(Paragraph("Detailed Question Analysis", styles['Heading2']))
            
            for res in analysis_results:
                # Q
                story.append(Paragraph(f"Q: {res['q']}", style_q))
                # A
                story.append(Paragraph(f"<b>Your Answer:</b> {res['a']}", style_a))
                story.append(Spacer(1, 5))
                
                # AI Feedback
                feedback_text = (
                    f"<b>Score:</b> {res['feedback'].get('feedback_score', 'N/A')}/10<br/>"
                    f"<b>Critique:</b> {res['feedback'].get('critique', 'N/A')}<br/>"
                    f"<b>Ideal Answer:</b> {res['feedback'].get('improved_answer', 'N/A')}"
                )
                story.append(Paragraph(feedback_text, style_feed))
                story.append(Spacer(1, 15))
                story.append(Paragraph("_" * 60, styles['BodyText'])) # Divider
                story.append(Spacer(1, 15))

            doc.build(story)
            buffer.seek(0)
            
            return FileResponse(buffer, as_attachment=True, filename='Interview_Report.pdf', content_type='application/pdf')
            
        except Exception as e:
            print(f"PDF/Backend Error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_groq_response(self, text):
        try:
             api_key = os.getenv("GROQ_API_KEY")
             if not api_key:
                 return {"critique": "Configuration Error: API Key missing", "improved_answer": "N/A", "feedback_score": 0}
             
             client = Groq(api_key=api_key)

             # Remove 'response_format' to avoid strict JSON errors
             completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Output ONLY valid JSON code. Do not include markdown formatting like ```json ... ```."},
                    {"role": "user", "content": text}
                ],
                model="llama-3.3-70b-versatile",
                # response_format={"type": "json_object"} # REMOVED: Causing errors
            )
             
             raw = completion.choices[0].message.content
             
             # Clean the output (remove markdown blocks if present)
             cleaned_json = raw.strip()
             if cleaned_json.startswith("```json"):
                 cleaned_json = cleaned_json.replace("```json", "", 1)
             if cleaned_json.startswith("```"):
                 cleaned_json = cleaned_json.replace("```", "", 1)
             if cleaned_json.endswith("```"):
                 cleaned_json = cleaned_json.removesuffix("```")
             
             cleaned_json = cleaned_json.strip()

             import json
             return json.loads(cleaned_json)
             
        except Exception as e:
            print(f"Groq Analysis Error: {e}")
            # Fallback for parsing errors or API errors
            return {"critique": "Analysis unavailable at this time.", "improved_answer": "N/A", "feedback_score": 0}

class AnalyzePerformanceView(APIView):
    def post(self, request):
         return Response({"message": "Use /end-session/ for full report"})
