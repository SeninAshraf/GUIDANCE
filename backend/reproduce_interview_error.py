import os
from groq import Groq
from dotenv import load_dotenv
import json

# Explicitly load .env from the current directory
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    # Try reading directly if load_dotenv fails (fallback)
    try:
        with open('.env') as f:
            for line in f:
                if line.startswith('GROQ_API_KEY'):
                    api_key = line.split('=')[1].strip().strip('"').strip("'")
                    break
    except:
        pass

if not api_key:
    print("Error: GROQ_API_KEY not found in environment or .env file.")
    exit(1)

client = Groq(api_key=api_key)

# Mimic the prompt from EndInterviewView
question = "Tell me about yourself."
answer = "I am a software engineer with 5 years of experience."

prompt = (
    f"Question: {question}\n"
    f"Candidate Answer: {answer}\n\n"
    "Provide a JSON response with 3 fields:\n"
    "1. feedback_score (0-10)\n"
    "2. critique (2 sentences on content and language style)\n"
    "3. improved_answer (An ideal, professional response)"
)

print(f"Testing Groq API with model: llama-3.3-70b-versatile")
print("Response Format: {'type': 'json_object'}")

try:
    completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"}
    )
    
    raw = completion.choices[0].message.content
    print("\nSuccess! Raw Output:")
    print(raw)
    
    # Try parsing
    parsed = json.loads(raw)
    print("\nParsed JSON:")
    print(json.dumps(parsed, indent=2))

except Exception as e:
    print(f"\nCaught Expected Error: {e}")
