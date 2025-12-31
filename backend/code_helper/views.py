from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import random
import os
import time
from groq import Groq
import json
import re

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
GROQ_MODEL = "llama-3.3-70b-versatile" 

# --- Global Dataset Cache ---
# --- Global Dataset Cache ---
problems_data = None

def load_problems(category=None):
    global problems_data
    if problems_data is None:
        try:
            json_path = os.path.join(os.path.dirname(__file__), 'seed_problems.json')
            print("SPEED MODE: Loading local seed_problems.json...")
            with open(json_path, 'r') as f:
                problems_data = json.load(f)
            print(f"Loaded {len(problems_data)} problems from local seed.")
        except Exception as e:
            print(f"Dataset Load Error: {e}")
            return []
            
    if category and category != 'all':
        return [p for p in problems_data if p.get('category') == category]
    return problems_data

class MicroProblemView(APIView):
    def get(self, request):
        # Get Params
        category = request.GET.get('category', 'all').lower()
        difficulty = request.GET.get('difficulty', 'beginner').lower()
        
        data = load_problems(category)
        if not data:
             # Fallback to all if category empty
             data = load_problems(None)
             if not data:
                return Response({"error": "Dataset unavailable"}, status=500)
            
        # Pick a random problem
        try:
            problem = random.choice(data)
            row_title = problem.get('title', 'Unknown')
            row_desc = problem.get('content', '')
            row_cat = problem.get('category', 'logic')
            
            # --- LATENCY OPTIMIZATION ---
            if len(row_desc) > 2000:
                row_desc = row_desc[:2000] + "...(truncated)"
            
            raw_content = f"Title: {row_title}\nDescription: {row_desc}\nCategory: {row_cat}"
            
            # Context Switch for SQL vs Python
            target_lang = "SQL" if row_cat == 'sql' else "Python"
            
            # Define Difficulty Rules
            if difficulty == 'hard':
                role_desc = "You are a strict technical interviewer."
                style_desc = f"Teach advanced {target_lang} efficiency."
                rules = (
                    "1. TITLE: Professional Technical Title.\n"
                    "2. STORY: A complex real-world system optimization scenario.\n"
                    "3. CONCEPT: Advanced Algorithm/Query Optimization.\n"
                    f"4. STEPS: 5-8 lines of {target_lang}.\n"
                    "5. EXPLANATION: Technical deep-dive."
                )
            elif difficulty == 'medium':
                role_desc = "You are a standard coding tutor."
                style_desc = f"Teach standard {target_lang} concepts."
                rules = (
                    "1. TITLE: Standard Problem Title.\n"
                    "2. STORY: A practical application scenario.\n"
                    "3. CONCEPT: Standard Concept.\n"
                    f"4. STEPS: 4-6 lines of {target_lang}.\n"
                    "5. EXPLANATION: Clear logic explanation."
                )
            else: # beginner
                role_desc = "You are an expert friendly mentor for kids."
                style_desc = "Teach using simple analogies."
                rules = (
                    "1. TITLE & STORY: a fun, child-friendly analogy. Avoid jargon.\n"
                    "2. CONCEPT: One simple concept.\n"
                    f"3. STEPS: 3-5 logical single lines of {target_lang} code.\n"
                    "4. EXPLANATION: SIMPLE explanation of *why* we need this line."
                )

            # Construct Prompt
            prompt = (
                f"{role_desc} {style_desc} "
                f"Rewrite the following problem into a guided step-by-step {target_lang} coding lesson.\n"
                f"RAW PROBLEM: {raw_content}\n"
                f"DIFFICULTY LEVEL: {difficulty.upper()}\n\n"
                "Rules:\n"
                f"{rules}\n"
                "COMMON RULES:\n"
                "   - 'goal': A short goal.\n"
                f"   - 'code_line': The exact single line of {target_lang} code. MUST match the story (e.g. if story is School Club, table is 'Members', not 'Employees').\n"
                "   - 'step_id': Integer 1, 2, 3...\n"
                "   - 'simple_explanation': A final summary of the solution logic in plain English.\n"
                "RETURN JSON ONLY:\n"
                "{\n"
                "  \"title\": \"...\",\n"
                "  \"story\": \"...\",\n"
                "  \"concept\": \"...\",\n"
                "  \"language\": \"" + target_lang + "\",\n"
                "  \"simple_explanation\": \"...\",\n"
                "  \"steps\": [\n"
                "    { \"step_id\": 1, \"goal\": \"...\", \"explanation\": \"...\", \"code_line\": \"...\" }\n"
                "  ]\n"
                "}"
            )
            
            # Measure AI Latency
            t0 = time.time()
            
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful JSON assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024,
                top_p=1,
                stream=False,
                stop=None,
            )
            
            print(f"Groq Latency: {time.time() - t0:.2f}s")
            
            ai_text = completion.choices[0].message.content
            
            # Clean JSON
            clean_text = re.sub(r'```json\n|```', '', ai_text).strip()
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end != -1:
                clean_text = clean_text[start:end]
            
            try:
                problem_json = json.loads(clean_text)
                return Response(problem_json)
            except json.JSONDecodeError as je:
                print(f"JSON Parse Error: {je}")
                print(f"Raw AI Text: {ai_text}")
                return Response({"error": "Failed to parse AI response", "raw": ai_text}, status=500)
            
        except Exception as e:
            print(f"Error generating problem: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": "Generating problem failed", "details": str(e)}, status=500)

class ValidateThoughtView(APIView):
    def post(self, request):
        user_thought = request.data.get('thought')
        problem_context = request.data.get('story') # The simplified story
        
        prompt = (
            "You are a friendly coding mentor. The user is explaining their LOGIC for a problem.\n"
            f"PROBLEM: {problem_context}\n"
            f"USER LOGIC: {user_thought}\n"
            "Analyze their logic. Be very encouraging.\n"
            "If it's mostly correct (even if simple), return JSON: { 'correct': true, 'feedback': 'Awesome job! You get it. [Explain simply why it works]' }\n"
            "If incorrect, return JSON: { 'correct': false, 'feedback': 'Nice try! But think about [hint]...' }"
            "Ensure the output is strictly valid JSON."
        )
        
        try:
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful JSON assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=512,
                top_p=1,
                stream=False,
                stop=None,
            )
            
            ai_text = completion.choices[0].message.content
            
             # Clean JSON
            clean_text = re.sub(r'```json\n|```', '', ai_text).strip()
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end != -1:
                clean_text = clean_text[start:end]
                
            result = json.loads(clean_text)
            return Response(result)
            
        except Exception as e:
             print(f"Groq Validation Error: {e}")
             return Response({"error": str(e)}, status=500)
