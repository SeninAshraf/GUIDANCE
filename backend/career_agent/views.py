from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
import os

# Provided Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={GEMINI_API_KEY}"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={GEMINI_API_KEY}"

class CareerAdviceView(APIView):
    def get(self, request):
        return Response({"status": "Online", "message": "Send a POST request with 'message' to get advice."})

    def post(self, request):
        user_message = request.data.get('message', '')
        language = request.data.get('language', 'english').lower()
        
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # --- Load Job Reviews Data (Cached Global) ---
            global glassdoor_context
            if 'glassdoor_context' not in globals():
                try:
                    import mlcroissant as mlc
                    import pandas as pd
                    print("Loading Glassdoor Dataset...")
                    croissant_dataset = mlc.Dataset('https://www.kaggle.com/datasets/davidgauthier/glassdoor-job-reviews/croissant/download')
                    record_sets = croissant_dataset.metadata.record_sets
                    # records() returns an iterator, we convert to list then df
                    # Limit to first 100 to avoid blowing up context window/memory
                    records = croissant_dataset.records(record_set=record_sets[0].uuid)
                    
                    # Convert to list first to slice, then dataframe
                    import itertools
                    first_n_records = list(itertools.islice(records, 20)) # Small sample for context context
                    
                    df = pd.DataFrame(first_n_records)
                    
                    # Create a textual summary for the LLM
                    glassdoor_context = f"Here is a sample of real-world Glassdoor Job Reviews:\n{df.to_string()}\n\n"
                    print("Glassdoor Data Loaded.")
                except Exception as ex:
                    print(f"Dataset Loading Error: {ex}")
                    glassdoor_context = "Could not load specific dataset. Using general knowledge."

            # --- Prompt Engineering ---
            mode = request.data.get('mode', 'general') # 'general' or 'reviews'
            
            base_system_prompt = (
                "You are a friendly, enthusiastic Career Coach. "
                "Your goal is to ensure the user feels confident and supported. "
                "Keep your answers VERY SHORT (maximum 2 sentences). "
                "Use emojis and a conversational tone. "
                "Guidance focus: Software Engineering & Career Growth."
            )

            if mode == 'reviews':
                system_instruction = (
                    f"{base_system_prompt}\n"
                    "CONTEXT: The user is asking about specific Job Reviews from Glassdoor. "
                    "Use the following DATASET SAMPLE to answer their questions. "
                    "Analyze the pros, cons, and ratings from this real data. "
                    f"\nDATASET:\n{glassdoor_context}"
                )
            else:
                # Default / General Mode
                system_instruction = base_system_prompt

            # Language Support
            if language == 'malayalam':
                system_instruction += (
                    "\nCRITICAL INSTRUCTION: The user has requested the response in MALAYALAM. "
                    "You MUST reply largely in MALAYALAM script (e.g. 'നമസ്കാരം'). "
                    "Do NOT mix English words unless they are technical terms (like 'Python', 'React'). "
                    "Do NOT provide the English translation. ONLY Malayalam."
                )

            # --- Construct History Context ---
            history = request.data.get('history', [])
            history_text = ""
            for msg in history[-5:]: # Keep last 5 turns to manage context window
                role_label = "User" if msg.get('role') == 'user' else "AI"
                history_text += f"{role_label}: {msg.get('content')}\n"

            full_prompt = f"{system_instruction}\n\nChat History:\n{history_text}\nUser Query: {user_message}"

            # Direct HTTP Request to Gemini API
            payload = {
                "contents": [{
                    "parts": [{"text": full_prompt}]
                }]
            }
            
            response = requests.post(GEMINI_URL, json=payload)
            
            if response.status_code != 200:
                print(f"Gemini Error: {response.text}")
                return Response({"error": "AI Service Unavailable"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            data = response.json()
            ai_response = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Sorry, I could not generate a response.')
            
            # --- gTTS Audio Generation ---
            try:
                from gtts import gTTS
                import io
                import base64

                # Auto-detect language for TTS? No, mapping manually is safer
                # If target was malayalam, use 'ml'. Else 'en'.
                tts_lang = 'ml' if language == 'malayalam' else 'en'
                
                tts = gTTS(text=ai_response, lang=tts_lang, slow=False)
                mp3_fp = io.BytesIO()
                tts.write_to_fp(mp3_fp)
                mp3_fp.seek(0)
                audio_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')
            except Exception as e:
                print(f"TTS Error: {e}")
                audio_base64 = None

            return Response({
                "response": ai_response,
                "audio_base64": audio_base64
            })
            
        except Exception as e:
            print(f"!!! CAREER AGENT ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
