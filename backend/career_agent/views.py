from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
import requests
import os

from groq import Groq

# Provided Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class CareerAdviceView(APIView):
    permission_classes = [permissions.AllowAny]
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
                "You are a gentle, experienced career mentor who guides people with patience, empathy, and quiet confidence. "
                "Speak in a calm, warm, and encouraging tone, making the user feel comfortable and understood. "
                "Do NOT give generic advice immediately. Follow this EXACT gentle flow to build a clear picture:\n"
                "1. CHECK HISTORY: Do you know their Educational Background? If NO, softly ask what they studied and where they stand academically/professionally.\n"
                "2. Do you know their Strengths, Weaknesses & Interests? If NO, ask in a relaxed, non-judgmental way about what motivates and fulfills them.\n"
                "3. Once you have enough info, gently reflect back what you understood about them.\n"
                "4. Then, guide them toward a suitable and meaningful career path aligning with their growth.\n"
                "5. Explain suggestions clearly and honestly, focusing on steady progress over perfection.\n"
                "6. End with a clear, gentle action plan, offering reassurance and hope.\n\n"
                "CRITICAL RULES:\n"
                "- Ask ONE simple question at a time.\n"
                "- Keep responses CONCISE (maximum 2-3 sentences) for voice interaction.\n"
                "- Give the user space to think; be supportive and essentially human.\n"
                "- Support both English and Malayalam.\n"
                "- If the user speaks/selects MALAYALAM, reply strictly in MALAYALAM SCRIPT. Do NOT mix English unless for technical terms.\n"
                "- If English, reply strictly in English."
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

            # Language Support is now INTEGRATED into base_system_prompt as per Dart Algo
            # We assume the Frontend sends explicit instructions in the message content as well.

            # --- Construct History Context for Groq ---
            messages = [{"role": "system", "content": system_instruction}]
            
            history = request.data.get('history', [])
            print(f"DEBUG: Received history length: {len(history)}")
            print(f"DEBUG: History content: {history}") 

            for msg in history[-30:]: # Keep last 30 turns (Increased from 5 for better recall)
                 # Map 'AI' role to 'assistant' for Groq/OpenAI format, ensure lowercase
                 role = "user" if msg.get("role") and msg.get("role").lower() == "user" else "assistant"
                 messages.append({"role": role, "content": msg.get("content", "")})
            
            messages.append({"role": "user", "content": user_message})
            print(f"DEBUG: Final messages sent to LLM: {len(messages)}")

            # --- Call Groq API ---
            client = Groq(api_key=GROQ_API_KEY)
            
            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
            )
            
            ai_response = chat_completion.choices[0].message.content or "Sorry, I could not generate a response."
            
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
