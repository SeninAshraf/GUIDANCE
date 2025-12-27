from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import os

# Provided Key
GEMINI_API_KEY = "AIzaSyBayntqY--sYvX8PzcIXwyV4mgp0eWSK4o"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={GEMINI_API_KEY}"

class CareerAdviceView(APIView):
    def get(self, request):
        return Response({"status": "Online", "message": "Send a POST request with 'message' to get advice."})

    def post(self, request):
        user_message = request.data.get('message', '')
        language = request.data.get('language', 'english').lower()
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # System Instruction / Prompt Engineering
            base_prompt = (
                "You are a friendly, encouraging AI Career Assistant. "
                "Act like a real-life human counselor having a conversation. "
                "Do NOT repeat your name or greeting in every message. "
                "Keep your answers SHORT (max 2-3 sentences), direct, and helpful. "
            )
            
            if language == 'malayalam':
                system_instruction = (
                    f"{base_prompt} "
                    "CRITICAL: The user has requested the response in MALAYALAM. "
                    "Translate your response into natural, conversational Malayalam. "
                    "Do NOT start with formal greetings repeatedly. Just answer naturally like a Malayali friend. "
                    "Keep it very simple and friendly. "
                    "IMPORTANT: Provide ONLY the Malayalam text. Do NOT include English translations in parentheses."
                )
            else:
                system_instruction = base_prompt

            full_prompt = f"{system_instruction}\n\nUser Query: {user_message}"

            # Direct HTTP Request to Gemini API
            payload = {
                "contents": [{
                    "parts": [{"text": full_prompt}]
                }]
            }
            
            response = requests.post(GEMINI_URL, json=payload)
            
            if response.status_code != 200:
                return Response({"error": f"Gemini API Error: {response.text}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            data = response.json()
            ai_response = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Sorry, I could not generate a response.')
            
            return Response({"response": ai_response})
            
        except Exception as e:
            print(f"!!! CAREER AGENT ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
