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
        if leetcode_df is None:
            csv_path = os.path.join(os.path.dirname(__file__), '../../leetcode.csv')
            if os.path.exists(csv_path):
                import pandas as pd
                print("Loading LeetCode CSV...")
                leetcode_df = pd.read_csv(csv_path)
                print(f"LeetCode CSV Loaded: {len(leetcode_df)} rows")
            else:
                print("leetcode.csv not found.")
                
        if leetcode_df is not None:
            # Map Difficulty
            diff_map = {'beginner': 'Easy', 'medium': 'Medium', 'hard': 'Hard'}
            target_diff = diff_map.get(difficulty, 'Easy')
            
            # Filter by Difficulty
            filtered = leetcode_df[leetcode_df['difficulty'] == target_diff]
            
            # Filter by Category (Topic)
            if category and category != 'all':
                # Simple keyword matching in 'related_topics' or 'tags'
                # Creating a mask for topics
                topic_map = {
                    'strings': 'String',
                    'sql': 'Database',
                    'logic': 'Array' # Default logic to Array/Math if not specific
                }
                target_topic = topic_map.get(category, '')
                if target_topic:
                     # Filter rows where related_topics contains the target_topic
                     filtered = filtered[filtered['related_topics'].fillna('').str.contains(target_topic, case=False)]
            
            # Convert to List of Dicts
            if not filtered.empty:
                # Sample 50 to avoid huge list processing, then pick one later
                sample_df = filtered.sample(n=min(len(filtered), 50))
                for _, row in sample_df.iterrows():
                    problems.append({
                        'title': row.get('title'),
                        'content': row.get('description'),
                        'category': category if category != 'all' else 'logic' 
                    })
                return problems
                
    except Exception as e:
        print(f"CSV Load Error: {e}")

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
            
            # --- LATENCY OPTIMIZATION ---
            if len(row_desc) > 2000:
                row_desc = row_desc[:2000] + "...(truncated)"
            
            raw_content = f"Title: {row_title}\nDescription: {row_desc}\nCategory: {row_cat}"
            
            # LogicQuest Persona Mapping
            realm_map = {
                'strings': 'Scrolls of String',
                'sql': 'The Great Archives',
                'logic': 'The Logic Labyrinth'
            }
            current_realm = realm_map.get(row_cat, 'The Code Wilds')
            target_lang = "SQL" if row_cat == 'sql' else "Python"

            # PERSONA: LogicQuest AI
            role_desc = (
                "You are LogicQuest AI, a mystical game mentor designed to strengthen a player's logical thinking. "
                "Your primary goal is NOT to give direct code solutions immediately, but to teach the *reasoning* behind them. "
                "Always teach logic before syntax. Use metaphors relevant to the realm."
            )

            # Difficulty & Style Adjustments
            if difficulty == 'hard':
                style_desc = f"Realm: {current_realm} (Advanced depth). Metaphor: High-stakes mission."
                rules = (
                    "1. TITLE: Epic mission title (e.g., 'Repair the Kinetic Shield').\n"
                    "2. STORY: Complex scenario requiring optimization or edge-case handling.\n"
                    "3. CONCEPT: Advanced Algorithm/logic.\n"
                    f"4. STEPS: 5-8 lines of {target_lang}. Focus on efficiency.\n"
                    "5. EXPLANATION: Deep dive into the 'why'."
                )
            elif difficulty == 'medium':
                style_desc = f"Realm: {current_realm} (Standard journey). Metaphor: Practical builder/explorer."
                rules = (
                    "1. TITLE: Adventure title (e.g., 'Bridge the Data Gap').\n"
                    "2. STORY: Practical scenario with a clear goal.\n"
                    "3. CONCEPT: Standard pattern.\n"
                    f"4. STEPS: 4-6 lines of {target_lang}.\n"
                    "5. EXPLANATION: Clear logic connection."
                )
            else: # beginner
                style_desc = f"Realm: {current_realm} (Training grounds). Metaphor: Fun, magical, tactile."
                rules = (
                    "1. TITLE: Fun title (e.g., 'The Mirror Spell').\n"
                    "2. STORY: Very simple, relatable analogy (cooking, magic, legos).\n"
                    "3. CONCEPT: Core building block.\n"
                    f"4. STEPS: 3-5 simple lines of {target_lang}.\n"
                    "5. EXPLANATION: Explain like I'm 10 years old."
                )

            # Construct Prompt
            prompt = (
                f"{role_desc}\n"
                f"CONTEXT: Player is in {current_realm}. Difficulty: {difficulty.upper()}.\n"
                f"TASK: Rewrite the following problem into a guided {target_lang} quest.\n"
                f"RAW PROBLEM: {raw_content}\n\n"
                "GAME RULES:\n"
                "1. Teach logic before syntax.\n"
                "2. Prefer reasoning and step-by-step thinking.\n"
                "3. **IMP: The user must PLAN before they code.**\n"
                "4. Maintain a game-like, motivating tone.\n\n"
                "OUTPUT FORMAT RULES (Strict JSON):\n"
                f"{rules}\n"
                "COMMON JSON FIELDS:\n"
                "   - 'goal': A short immediate objective for the step.\n"
                "   - 'logic_pseudocode': A clear, non-code description of the logic for this step (e.g., 'Initialize a list to store results').\n"
                f"   - 'code_line': The exact single line of {target_lang} code.\n"
                "   - 'step_id': Integer 1, 2, 3...\n"
                "   - 'explanation': A Mentor's hint or reasoning (WHY we do this).\n"
                "   - 'simple_explanation': A final victory summary.\n\n"
                "RETURN JSON ONLY:\n"
                "{\n"
                "  \"title\": \"...\",\n"
                "  \"story\": \"...\",\n"
                "  \"concept\": \"...\",\n"
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
