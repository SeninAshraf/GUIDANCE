from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import random
import os
import time
from groq import Groq
import json
import re

# Initialize Groq Client
# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
GROQ_MODEL = "llama-3.1-8b-instant" # Switched to faster model

# --- Global Dataset Cache ---
# --- Global Dataset Cache ---
# --- Global Dataset Cache ---
leetcode_df = None
seed_problems = None

def load_problems(category='all', difficulty='beginner'):
    global leetcode_df, seed_problems
    
    problems = []
    
    # 1. Try Loading CSV first
    try:
        csv_path = os.path.join(os.path.dirname(__file__), 'leetcode.csv')
        if os.path.exists(csv_path):
            import csv
            
            # Map Difficulty
            diff_map = {'beginner': 'Easy', 'medium': 'Medium', 'hard': 'Hard'}
            target_diff = diff_map.get(difficulty, 'Easy')
            
            # Map Category to Topic
            topic_map = {
                'strings': 'String',
                'sql': 'Database',
                'logic': 'Array'
            }
            target_topic = topic_map.get(category, '')

            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                all_matching = []
                for row in reader:
                    # Match Difficulty
                    if row.get('difficulty') != target_diff:
                        continue
                    
                    # Match Category/Topic
                    match_found = False
                    if category == 'all' or not target_topic:
                        match_found = True
                    else:
                        # Check related_topics
                        topics = row.get('related_topics', '').lower()
                        if target_topic.lower() in topics:
                            match_found = True
                        
                        # Special SQL handling
                        if category == 'sql' and not match_found:
                            desc = row.get('description', '').lower()
                            title = row.get('title', '').lower()
                            if any(word in desc or word in title for word in ['table', 'sql', 'database', 'query']):
                                match_found = True
                    
                    if match_found:
                        all_matching.append({
                            'title': row.get('title'),
                            'content': row.get('description'),
                            'category': category if category != 'all' else 'logic',
                            'url': row.get('url')
                        })
                
                if all_matching:
                    # Sample up to 50
                    return random.sample(all_matching, min(len(all_matching), 50))
                
    except Exception as e:
        print(f"CSV Load Error (Standard Module): {e}")

    # 2. Fallback to Seed JSON
    if seed_problems is None:
        try:
            json_path = os.path.join(os.path.dirname(__file__), 'seed_problems.json')
            with open(json_path, 'r') as f:
                seed_problems = json.load(f)
        except Exception as e:
            print(f"Seed Load Error: {e}")
            return []
            
    # Filter Seed
    filtered_seed = [p for p in seed_problems if p.get('difficulty') == difficulty]
    if category and category != 'all':
        filtered_seed = [p for p in filtered_seed if p.get('category') == category]
        
    return filtered_seed

class MicroProblemView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        print("MicroProblemView: Received request")
        # Get Params
        category = request.GET.get('category', 'all').lower()
        difficulty = request.GET.get('difficulty', 'beginner').lower()
        
        data = load_problems(category, difficulty)
        if not data:
             # Fallback to all if category empty
             data = load_problems(None, difficulty)
             if not data:
                return Response({"error": "Dataset unavailable"}, status=500)
            
        # Pick a random problem
        try:
            problem = random.choice(data)
            row_title = problem.get('title', 'Unknown')
            row_desc = problem.get('content', '')
            row_cat = problem.get('category', 'logic')
            original_url = problem.get('url')
            
            # --- LATENCY OPTIMIZATION ---
            if len(row_desc) > 2000:
                row_desc = row_desc[:2000] + "...(truncated)"
            
            raw_content = f"Title: {row_title}\nDescription: {row_desc}\nCategory: {row_cat}"
            
            # Technical Persona Mapping (Direct & Professional)
            target_lang = "SQL" if row_cat == 'sql' else "Python"

            # PERSONA: Technical Interview Coach
            role_desc = (
                "You are an expert Technical Interview Coach. Your goal is to help the user solve real-world coding challenges "
                "by breaking them down into logical steps. Do NOT use mystical metaphors. Use precise technical language."
            )

            # Difficulty & Structure Adjustments
            if difficulty == 'hard':
                rules = (
                    "1. TITLE: Keep the ORIGINAL title from the dataset.\n"
                    "2. STORY: Use the original description. If it's too long, summarize it into 4-5 clear technical sentences.\n"
                    "3. CONCEPT: Identify the core algorithm or data structure (e.g. 'Dynamic Programming').\n"
                    f"4. STEPS: 5-8 logical chunks of {target_lang} code.\n"
                    "5. EXPLANATION: High-level architectural reasoning."
                )
            elif difficulty == 'medium':
                rules = (
                    "1. TITLE: Keep the ORIGINAL title from the dataset.\n"
                    "2. STORY: Use the original description. Clearly state the input and expected output.\n"
                    "3. CONCEPT: Standard algorithmic pattern.\n"
                    f"4. STEPS: 4-6 logical instructions in {target_lang}.\n"
                    "5. EXPLANATION: Clear connection between the problem constraints and the code logic."
                )
            else: # beginner
                rules = (
                    "1. TITLE: Keep the ORIGINAL title from the dataset.\n"
                    "2. STORY: Use the original description. Explain any complex terms simply.\n"
                    "3. CONCEPT: Foundational coding block.\n"
                    f"4. STEPS: 3-5 simple {target_lang} operations.\n"
                    "5. EXPLANATION: Step-by-step logic for a beginner."
                )

            # Construct Prompt
            prompt = (
                f"{role_desc}\n"
                f"CONTEXT: Real-world Technical Challenge. Difficulty: {difficulty.upper()}.\n"
                f"SOURCE: Official LeetCode Mastery Dataset.\n"
                f"TASK: Convert the following dataset problem into a structured {target_lang} step-by-step learning guide.\n"
                f"RAW DATASET ENTRY:\n{raw_content}\n\n"
                "GUIDELINES:\n"
                "1. Keep the 'title' EXACTLY as provided in the raw data.\n"
                "2. The 'story' MUST be the actual technical problem description. DO NOT generalize it.\n"
                "3. IMPORTANT: Every step's 'goal' and 'logic_pseudocode' MUST refer to the specific technical details in the description (e.g., instead of 'Filter results', use 'Filter employees where salary > 50000').\n"
                "4. Ensure the 'logic_pseudocode' is a clear, actionable instruction for that specific code line.\n"
                "5. Professional, encouraging, and highly technical tone.\n\n"
                "OUTPUT FORMAT RULES (Strict JSON):\n"
                f"{rules}\n"
                "COMMON JSON FIELDS:\n"
                "   - 'goal': The specific technical objective (e.g., 'Extract the name column from the employee table').\n"
                "   - 'logic_pseudocode': The precise logical instruction (e.g., 'Select the name field where salary is above 50000').\n"
                f"   - 'code_line': The exact single line or small block of {target_lang} code.\n"
                "   - 'step_id': Integer 1, 2, 3...\n"
                "   - 'explanation': Why this specific line is required for this problem.\n"
                "   - 'simple_explanation': A summary of the final solution's technical mechanism.\n\n"
                "RETURN JSON ONLY:\n"
                "{\n"
                "  \"title\": \"...\",\n"
                "  \"story\": \"...\",\n"
                "  \"concept\": \"...\",\n"
                "  \"hint\": \"...\",\n"
                "  \"language\": \"" + target_lang + "\",\n"
                "  \"simple_explanation\": \"...\",\n"
                "  \"steps\": [\n"
                "    { \"step_id\": 1, \"goal\": \"...\", \"logic_pseudocode\": \"...\", \"code_line\": \"...\", \"explanation\": \"...\" }\n"
                "  ]\n"
                "}"
            )
            
            # Measure AI Latency
            t0 = time.time()
            
            # Retry Logic for Rate Limits
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    completion = client.chat.completions.create(
                        model=GROQ_MODEL,
                        messages=[
                            {"role": "system", "content": "You are a helpful JSON assistant. You must output strictly valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.5, 
                        max_tokens=1024,
                        top_p=1,
                        stream=False,
                        response_format={"type": "json_object"},
                        stop=None,
                    )
                    break # Success
                except Exception as e:
                    if "rate_limit" in str(e).lower() and attempt < max_retries - 1:
                        print(f"Rate limit hit. Retrying in 2s... (Attempt {attempt+1}/{max_retries})")
                        time.sleep(2)
                    else:
                        raise e
            
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
                # Inject the original URL
                problem_json['leetcode_url'] = original_url
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
