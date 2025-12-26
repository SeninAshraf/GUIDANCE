
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
from datetime import datetime

class JobInsightsView(APIView):
    def post(self, request):
        """
        Fetch, Filter, and Score jobs based on user priority.
        Payload: { "priority": { "role": "backend", "tech_stack": ["python"], ... } }
        """
        try:
            priority = request.data.get('priority', {})
            sort_by = request.data.get('sort_by', 'recent')
            
            # 1. Fetch from Remotive API
            url = "https://remotive.com/api/remote-jobs"
            response = requests.get(url)
            if response.status_code != 200:
                return Response({"error": "Failed to fetch jobs"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            data = response.json()
            all_jobs = data.get('jobs', [])
            
            # 2. Filter & Score
            scored_jobs = []
            
            target_role = priority.get('role', '').lower()
            target_tech = [t.lower() for t in priority.get('tech_stack', [])]
            target_loc = priority.get('location', '').lower()
            
            software_keywords = ['software', 'engineer', 'developer', 'data', 'ai', 'machine learning', 'backend', 'frontend', 'full stack', 'devops']

            for job in all_jobs:
                title = job.get('title', '').lower()
                desc = job.get('description', '').lower()
                category = job.get('category', '').lower()
                
                # Basic Software Filter (Strict)
                is_software = any(k in title for k in software_keywords) or 'software' in category or 'development' in category
                if not is_software:
                    continue

                # Scoring Engine
                score = 0
                
                # Role Match (+40)
                if target_role and target_role in title:
                    score += 40
                
                # Tech Stack Match (+10 per match, max 40)
                tech_matches = 0
                for tech in target_tech:
                    if tech in desc or tech in title:
                        tech_matches += 1
                score += min(tech_matches * 10, 40)
                
                # Location Match (+20)
                if target_loc:
                    cand_loc = job.get('candidate_required_location', '').lower()
                    if target_loc in cand_loc or 'anywhere' in cand_loc:
                        score += 20
                        
                # Normalize (0.0 - 1.0)
                final_score = min(score, 100) / 100.0
                
                # Add to results
                scored_jobs.append({
                    "job_title": job.get('title'),
                    "company": job.get('company_name'),
                    "location": job.get('candidate_required_location'),
                    "job_type": job.get('job_type'),
                    "published_on": job.get('publication_date'),
                    "priority_score": final_score,
                    "apply_url": job.get('url'),
                    "salary": job.get('salary', 'Not Disclosed')
                })

            # 3. Sort
            if sort_by == 'relevance':
                scored_jobs.sort(key=lambda x: x['priority_score'], reverse=True)
            else: # Recent (Default)
                # Parse date string "2024-12-25T..."
                scored_jobs.sort(key=lambda x: x['published_on'], reverse=True)

            # 4. Summary Stats
            summary = {
                "total_jobs_analyzed": len(all_jobs),
                "software_jobs_found": len(scored_jobs),
                "top_roles": list(set([j['job_title'] for j in scored_jobs[:5]])),
                "top_tech": target_tech 
            }

            return Response({
                "insights_summary": summary,
                "recommended_jobs": scored_jobs[:50] # Limit to top 50
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MarketAnalysisView(APIView):
    def post(self, request):
        query = request.data.get('query', '')
        if not query:
            return Response({"error": "Query required"}, status=status.HTTP_400_BAD_REQUEST)
        
        GEMINI_API_KEY = "AIzaSyBayntqY--sYvX8PzcIXwyV4mgp0eWSK4o" # Reuse key
        URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={GEMINI_API_KEY}"
        
        prompt = f"""
        You are a Career Data Analyst. Analyze the market for: {query}.
        Return ONLY valid JSON (no markdown) with this exact structure:
        {{
            "role_summary": "2 sentence summary of this role",
            "top_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
            "avg_salary": "e.g. $80k - $120k",
            "hiring_trends": "Brief trend analysis (e.g. High Demand, Stable)"
        }}
        """
        
        try:
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            response = requests.post(URL, json=payload)
            data = response.json()
            
            # Extract Text
            raw_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '{}')
            
            # Clean Markdown info if Gemini adds it
            raw_text = raw_text.replace('```json', '').replace('```', '').strip()
            
            import json
            json_data = json.loads(raw_text)
            
            return Response(json_data)
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
