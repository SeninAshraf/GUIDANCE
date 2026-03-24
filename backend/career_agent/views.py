from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
import requests
import os
import tempfile
from pypdf import PdfReader
from groq import Groq

# Provided Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def extract_text_from_url(url):
    try:
        response = requests.get(url, timeout=10)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        
        reader = PdfReader(tmp_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        
        os.unlink(tmp_path)
        return text.strip()
    except Exception as e:
        print(f"Resume Parsing Error: {e}")
        return ""

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
            global df_jobs # New Global for the full dataframe
            
            # 1. Load Local Jobs Dataset
            if 'df_jobs' not in globals():
                try:
                    import pandas as pd
                    csv_path = os.path.join(os.path.dirname(__file__), '../../JobsDatasetProcessed.csv')
                    if os.path.exists(csv_path):
                        df_jobs = pd.read_csv(csv_path)
                        print("Jobs Dataset loaded into memory.")
                    else:
                        df_jobs = None
                except Exception as ex:
                    print(f"Jobs Dataset Loading Error: {ex}")
                    df_jobs = None

            # 2. Extract Resume Context
            resume_url = request.data.get('resumeUrl')
            resume_text = ""
            if resume_url:
                print(f"Downloading resume for context: {resume_url}")
                resume_text = extract_text_from_url(resume_url)

            # 3. Relevant Data Retrieval (Upgrade B)
            # Find relevant job rows based on resume keywords OR user message
            relevant_jobs = ""
            if df_jobs is not None:
                # Simple keyword search
                search_query = (user_message + " " + (resume_text[:200] if resume_text else "")).lower()
                # Focus on Job Titles or Skills
                mask = df_jobs['Job Title'].str.lower().apply(lambda x: any(w in str(x) for w in search_query.split() if len(w) > 3))
                matches = df_jobs[mask].head(10)
                if matches.empty:
                    matches = df_jobs.sample(n=5)
                
                relevant_jobs = "REAL MARKET TRENDS (Relevant to you):\n" + matches[['Job Title', 'IT Skills', 'Experience']].to_string(index=False)

            # 4. Load Glassdoor Data
            if 'glassdoor_context' not in globals():
                glassdoor_context = "Glassdoor data skipped for performance."


            # --- Prompt Engineering ---
            mode = request.data.get('mode', 'general') # 'general' or 'reviews'
            
            base_system_prompt = (
                "You are GUIDO, your friendly AI career mentor. Your vibe is warm, helpful, and very natural.\n\n"
                
                "### VOICE-OPTIMIZED STYLE (CRITICAL)\n"
                "1. SHORT SENTENCES: Use many short, punchy sentences. This makes the voice synthesis sound like a real person.\n"
                "2. FRIENDLY VIBE: Be conversational. Use 'Sure!', 'Actually...', or 'That sounds like a plan'.\n"
                "3. DEEP BUT CONCISE: Provide high-value, deep advice based on the CV, but don't use long walls of text.\n"
                "4. NO BULLET POINTS: Speak in natural, friendly paragraphs consisting of short sentences.\n\n"

                "### CV-DRIVEN PERSONALIZATION\n"
                "Always refer to the user's specific skills or projects if available. "
                "Example: 'I see you've used React before. That's a huge plus for what we're planning.'\n\n"

                "### DATA CONTEXT\n"
                f"{relevant_jobs}\n\n"

                "### USER PROFILE (FROM WALLET)\n"
                f"{'NONE' if not resume_text else resume_text[:2500]}\n\n"
                
                "Always conclude with a short, natural follow-up question."
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

            # --- Hot-reload .env to pick up new Key without restart ---
            from dotenv import load_dotenv
            load_dotenv(override=True)
            
            try:
                # --- NEW PRIMARY: Groq Llama 3.3 (Fast, Reliable, Professional) ---
                print(f"[GUIDO] Processing message with Groq Primary...")
                client = Groq(api_key=GROQ_API_KEY)
                
                # Format messages for OpenAI/Groq standard
                groq_messages = [{"role": "system", "content": system_instruction}]
                for m in history[-10:]:
                    # Map 'AI' to 'assistant'
                    role = "user" if m.get("role") and m.get("role").lower() == "user" else "assistant"
                    groq_messages.append({"role": role, "content": m.get("content", "")})
                groq_messages.append({"role": "user", "content": user_message})

                completion = client.chat.completions.create(
                    messages=groq_messages,
                    model="llama-3.3-70b-versatile",
                    temperature=0.7,
                    max_tokens=2048
                )
                ai_response = completion.choices[0].message.content or "I'm having a quiet moment. What do you think?"
                print("[GUIDO] Groq Response Received.")

            except Exception as groq_err:
                print(f"[GUIDO] Groq Failed: {groq_err}. Falling back to Gemini as secondary...")
                # --- FALLBACK: Gemini (As secondary brain) ---
                try:
                    payload = {
                        "system_instruction": {"parts": [{"text": system_instruction}]},
                        "contents": [{"role": "user", "parts": [{"text": user_message}]}], # Simple fallback
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
                    }
                    fb_resp = requests.post(URL, json=payload, timeout=8)
                    if fb_resp.status_code == 200:
                        candidates = fb_resp.json().get('candidates', [])
                        ai_response = candidates[0]['content']['parts'][0]['text']
                    else:
                        ai_response = "I encountered an error connecting to my core processing engine."
                except Exception as b_err:
                    print(f"[GUIDO] Complete Brain Failure: {b_err}")
                    ai_response = "Network congestion detected. I'll need a moment to reconnect."

            
            # --- Edge-TTS Audio Generation (Neural & Fast) ---
            try:
                import edge_tts
                import asyncio
                import base64

                # Voice Selection (Neural)
                # English: Christopher (Male, Professional)
                # Malayalam: Midhun (Male, Natural)
                voice_name = 'ml-IN-MidhunNeural' if language == 'malayalam' else 'en-US-ChristopherNeural'
                
                # Speed Boost (+20%)
                rate = "+20%"
                
                async def generate_audio():
                    communicate = edge_tts.Communicate(ai_response, voice_name, rate=rate)
                    audio_data = b""
                    async for chunk in communicate.stream():
                        if chunk["type"] == "audio":
                            audio_data += chunk["data"]
                    return audio_data
                
                # Run async generation in sync view
                # Check for existing loop
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                         # Should ideally not happen in Sync View, but safety net
                        future = asyncio.ensure_future(generate_audio())
                        audio_bytes = loop.run_until_complete(future)
                    else:
                        audio_bytes = asyncio.run(generate_audio())
                except RuntimeError:
                     # New loop if none exists
                     audio_bytes = asyncio.run(generate_audio())

                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

            except Exception as e:
                print(f"Edge-TTS Error: {e}")
                audio_base64 = None

            return Response({
                "response": ai_response,
                "audio_base64": audio_base64
            })
            
        except Exception as e:
            print(f"!!! CAREER AGENT ERROR: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- PDF Generation View ---
class ChatPDFView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import io, json, requests
        from django.http import FileResponse
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch

        try:
            history = request.data.get('history', [])
            if not history: return Response({"error": "No history found"}, status=400)

            # --- Step 1: Use Groq for High-Speed Roadmap Summarization ---
            client = Groq(api_key=GROQ_API_KEY)
            
            summary_prompt = (
                "Create a high-impact Career Roadmap based on this data. "
                "Structure it into 5 sections:\n"
                "1. EXECUTIVE SUMMARY\n2. CHOSEN DOMAIN\n3. TECH STACK\n4. 90-DAY MILESTONES\n5. MENTOR'S FINAL ADVICE\n\n"
                f"DATA:\n{str(history[-10:])}\n\n"
                "Format: Respond ONLY with headers and bullet points."
            )
            
            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": summary_prompt}],
                model="llama-3.1-8b-instant",
            )
            raw_roadmap = completion.choices[0].message.content or "Roadmap generation failed."
            # --- Step 2: Generate Premium PDF Layout ---
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
            styles = getSampleStyleSheet()
            
            GUIDO_LIME = colors.HexColor("#ccff00")
            BG_DARK = colors.HexColor("#0f172a") # Dark Slate
            CARD_BG = colors.HexColor("#1e293b") # Lighter Slate
            
            title_style = ParagraphStyle('GTitle', parent=styles['Heading1'], textColor=GUIDO_LIME, fontSize=28, alignment=1, spaceAfter=30, fontName='Helvetica-Bold')
            section_title = ParagraphStyle('SecT', parent=styles['Heading2'], textColor=GUIDO_LIME, fontSize=13, fontName='Helvetica-Bold', spaceBefore=15, spaceAfter=8, textTransform='uppercase')
            txt_style = ParagraphStyle('CTxt', parent=styles['BodyText'], textColor=colors.whitesmoke, fontSize=10.5, leading=15, fontName='Helvetica')

            story = []

            def background(canvas, doc):
                canvas.saveState()
                canvas.setFillColor(BG_DARK)
                canvas.rect(0, 0, A4[0], A4[1], fill=1)
                # Footer
                canvas.setFillColor(colors.HexColor("#334155"))
                canvas.setFont("Helvetica-Bold", 8)
                canvas.drawCentredString(A4[0]/2, 30, "GENERATED BY GUIDO AI | YOUR CAREER COMPANION")
                canvas.restoreState()

            story.append(Spacer(1, 10))
            story.append(Paragraph("<b>GUIDO</b> CAREER ROADMAP", title_style))
            story.append(Paragraph("<font color='#64748b' size='9'>AI-DRIVEN PERSONALIZED GROWTH BLUEPRINT</font>", ParagraphStyle('Sub', alignment=1)))
            story.append(Spacer(1, 40))

            # Custom Style for the 'Card' Content
            box_style = ParagraphStyle(
                'BoxText',
                parent=txt_style,
                borderWidth=1,
                borderColor=colors.HexColor("#334155"),
                backColor=CARD_BG,
                borderRadius=8,
                borderPadding=15,
                spaceBefore=0,
                spaceAfter=15,
            )

            # --- Processing Sections for Story ---
            import re
            raw_text = raw_roadmap.strip().replace("**", "")
            
            # Split logic
            sections = re.split(r'\n(?=\d\.\s)', raw_text)
            if len(sections) <= 1:
                sections = re.split(r'\n(?=\#\#)', raw_text)
            
            if len(sections) <= 1:
                story.append(Paragraph("<b>CAREER INSIGHTS</b>", section_title))
                story.append(Paragraph(raw_text.replace('\n', '<br/>'), box_style))
            else:
                for sec in sections:
                    if not sec.strip(): continue
                    parts = sec.strip().split('\n', 1)
                    header = parts[0].strip()
                    header = re.sub(r'^\d\.\s*', '', header).strip()
                    
                    content = parts[1].strip() if len(parts) > 1 else "Analysis pending..."
                    story.append(Paragraph(f"<b>{header}</b>", section_title))
                    story.append(Paragraph(content.replace('\n', '<br/>'), box_style))

            doc.build(story, onFirstPage=background, onLaterPages=background)
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename='Guido_Career_Roadmap.pdf')

        except Exception as e:
            import traceback
            print(f"Roadmap PDF Error Traceback: {traceback.format_exc()}")
            return Response({"error": str(e)}, status=500)
