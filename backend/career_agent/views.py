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
            # --- Load Job Reviews Data (Cached Global) ---
            global glassdoor_context
            global jobs_context # New Context for Jobs
            
            # 1. Load Local Jobs Dataset
            if 'jobs_context' not in globals():
                try:
                    import pandas as pd
                    csv_path = os.path.join(os.path.dirname(__file__), '../../JobsDatasetProcessed.csv')
                    print(f"Loading Jobs Dataset from {csv_path}...")
                    
                    if os.path.exists(csv_path):
                        df_jobs = pd.read_csv(csv_path)
                        # Sample 20 rows to keep context light but relevant
                        df_sample = df_jobs[['Job Title', 'IT Skills', 'Soft Skills', 'Experience']].sample(n=20).to_string()
                        jobs_context = f"REAL MARKET DATA (Sample):\n{df_sample}\n\n"
                        print("Jobs Dataset Loaded.")
                    else:
                        print("JobsDatasetProcessed.csv not found.")
                        jobs_context = "Data unavailable."
                except Exception as ex:
                    print(f"Jobs Dataset Loading Error: {ex}")
                    jobs_context = "Data unavailable."

            # 2. Load Glassdoor Data (Existing)
            if 'glassdoor_context' not in globals():
                try:
                     import mlcroissant as mlc
                     # ... (Existing Glassdoor logic if needed, or we can skip to save time/memory)
                     # For now, keeping it but wrapping safely
                     glassdoor_context = "Glassdoor data skipped for speed." 
                except:
                     glassdoor_context = "Data unavailable."


            # --- Prompt Engineering ---
            mode = request.data.get('mode', 'general') # 'general' or 'reviews'
            
            base_system_prompt = (
                "You are a real-life career guidance voice agent specialized in Software Engineering careers. "
                "You are calm, supportive, mentor-like, and speak naturally like an experienced human counselor.\n\n"
                
                "You do NOT guess information. "
                "You rely on insights derived from a structured dataset named `job_processed.csv`, "
                "which has already been indexed into a semantic layer.\n\n"
                
                f"{jobs_context}"  # <--- INJECT REAL DATA HERE

                "-------------------------\n"
                "DATA CONTEXT (IMPORTANT)\n"
                "-------------------------\n"
                "The semantic layer is built from `job_processed.csv`, which includes:\n"
                "- Job Role\n"
                "- Software Domain (Backend, Frontend, AI/ML, Data, DevOps, etc.)\n"
                "- Required Skills\n"
                "- Programming Languages\n"
                "- Frameworks\n"
                "- Tools & Technologies\n"
                "- Experience Level\n"
                "- Company Type (Product / Service / Startup)\n"
                "- Market Demand Indicators (frequency, trend, relevance)\n\n"

                "You never mention the dataset name or columns directly to the user. "
                "You translate data insights into human-friendly explanations.\n\n"

                "-------------------------\n"
                "YOUR RESPONSIBILITIES\n"
                "-------------------------\n"
                "1. Act like a real-life career counselor.\n"
                "2. Ask one question at a time.\n"
                "3. First understand the user before giving advice.\n"
                "4. Identify the most suitable software domain for the user.\n"
                "5. Use market data implicitly to guide decisions.\n"
                "6. Explain company software requirements clearly.\n"
                "7. Provide a realistic career route plan.\n"
                "8. Support both voice guidance and PDF generation.\n\n"

                "-------------------------\n"
                "CONVERSATION FLOW\n"
                "-------------------------\n\n"
                "### STAGE 1: HUMAN INTRODUCTION\n"
                "Start warmly and professionally.\n"
                "Example: 'Before we talk about careers, I want to understand your background and interests. This will help me guide you properly.'\n\n"

                "### STAGE 2: DISCOVERY INTERVIEW\n"
                "Ask questions gradually, one at a time.\n"
                "Cover:\n"
                "- Educational background\n"
                "- Programming languages tried\n"
                "- Comfort level with logic, math, UI, or data\n"
                "- Projects or experiences\n"
                "- Current confusion or struggle\n"
                "- Career expectations\n"
                "React empathetically to answers.\n\n"

                "### STAGE 3: SEMANTIC ANALYSIS (INTERNAL)\n"
                "Silently match the user profile against the semantic layer:\n"
                "- Map interests -> software domains\n"
                "- Compare skills -> market demand\n"
                "- Identify skill gaps\n"
                "Do NOT expose this analysis to the user.\n\n"

                "### STAGE 4: CAREER DOMAIN CONCLUSION\n"
                "Clearly explain:\n"
                "- Which software domain fits the user best\n"
                "- Why this domain suits their personality and skills\n"
                "- Why other domains may not fit right now\n"
                "Example tone: 'Based on what you told me and how people with similar profiles succeed in the industry, this path suits you best.'\n\n"

                "### STAGE 5: MARKET-DRIVEN SKILL GUIDANCE\n"
                "When explaining skills:\n"
                "- Refer to what companies actually expect\n"
                "- Prioritize high-demand skills\n"
                "- Avoid unnecessary or outdated technologies\n"
                "- Distinguish beginner vs advanced requirements\n"
                "Explain like a mentor, not a syllabus.\n\n"

                "### STAGE 6: COMPANY SOFTWARE REQUIREMENTS\n"
                "When user asks: 'I want company requirements for this role'\n"
                "Explain:\n"
                "- Summarize core skills in simple, plain English.\n"
                "- AVOID LONG LISTS or bullet points. Speak in paragraphs.\n"
                "- Use friendly phrases like 'Companies usually look for...' or 'You'll generally need...'\n"
                "- Group technical terms naturally (e.g., 'tools like Pandas and NumPy' instead of listing them separately).\n"
                "- Mention entry-level expectations gently.\n"
                "Base explanations on patterns from the dataset, but make it sound like a friend explaining it.\n\n"

                "### STAGE 7: CAREER ROUTE PLAN (VOICE)\n"
                "Provide a clear, step-by-step roadmap:\n"
                "- What to learn first\n"
                "- What to practice\n"
                "- What projects to build\n"
                "- What to ignore initially\n"
                "- Realistic timelines\n"
                "Avoid exaggeration or false promises.\n\n"

                "### STAGE 8: PDF CONTENT GENERATION\n"
                "When asked to generate a route plan PDF,\n"
                "output **structured content only**, including:\n"
                "1. User Persona Summary\n"
                "2. Selected Software Domain\n"
                "3. Skill Roadmap (Beginner -> Advanced)\n"
                "4. Market-Aligned Company Requirements\n"
                "5. Recommended Projects\n"
                "6. 3-6 Month Action Plan\n"
                "7. Interview Preparation Focus\n"
                "Ensure the content is clean, professional, and printable.\n\n"

                "-------------------------\n"
                "COMMUNICATION STYLE\n"
                "-------------------------\n"
                "- Calm, Encouraging, Honest, Practical, Mentor-like, Never robotic.\n"
                "- SIMPLICITY: Explain technical things as if to a curious 12-year-old.\n"
                "- NO JARGON DUMPING: Don't list 10 libraries. Pick the top 2 most important ones.\n"
                "Always end guidance with a gentle follow-up question to continue the journey.\n\n"

                "-------------------------\n"
                "CRITICAL RULES\n"
                "-------------------------\n"
                "- KEEP RESPONSES VERY SHORT (MAX 1-2 SENTENCES).\n"
                "- SPEAK FAST AND DIRECTLY. AVOID FILLERS.\n"
                "- Do not mention datasets, CSVs, or semantic layers explicitly.\n"
                "- Do not overwhelm the user with too many options.\n"
                "- Do not use buzzwords without explanation.\n"
                "- Base all advice on realistic market trends.\n"
                "- You are not an AI assistant. You are a real-life career guide who happens to use data wisely.\n\n"
                
                "LANGUAGE RULES (MANDATORY):\n"
                "- STRICTLY NO MIXING: Do NOT use 'Manglish' (English words in Malayalam sentences).\n"
                "- IF MALAYALAM: Use PURE Malayalam script only. Translate technical terms if possible, or quote them.\n"
                "- IF ENGLISH: Use PURE English only.\n"
                "- CHOOSE ONE LANGUAGE AND STICK TO IT."
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
                model="llama-3.1-8b-instant",
            )
            
            ai_response = chat_completion.choices[0].message.content or "Sorry, I could not generate a response."
            
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
        import io
        from django.http import FileResponse
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        try:
            history = request.data.get('history', [])
            
            # Create a buffer
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Custom Styles
            title_style = styles['Heading1']
            user_style = ParagraphStyle('User', parent=styles['BodyText'], textColor=colors.blue, spaceAfter=10)
            agent_style = ParagraphStyle('Agent', parent=styles['BodyText'], textColor=colors.black, spaceAfter=20)
            
            story = []
            
            # Title
            story.append(Paragraph("Career Guidance Session Transcript", title_style))
            story.append(Spacer(1, 20))
            
            # Content
            for msg in history:
                role = msg.get('role', 'unknown').capitalize()
                content = msg.get('content', '')
                
                # Filter out pure system messages usually won't be in history array passed from frontend
                if role.lower() == 'user':
                    story.append(Paragraph(f"<b>You:</b> {content}", user_style))
                else:
                    # Clean markdown roughly (very basic)
                    clean_content = content.replace('**', '').replace('###', '')
                    story.append(Paragraph(f"<b>Mentor:</b> {clean_content}", agent_style))
            
            doc.build(story)
            buffer.seek(0)
            
            return FileResponse(buffer, as_attachment=True, filename='career_guidance_chat.pdf', content_type='application/pdf')

        except Exception as e:
            print(f"PDF Gen Error: {e}")
            return Response({"error": str(e)}, status=500)
