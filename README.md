# 🚀 Guido - AI Career Companion

**Guido** is an advanced AI-powered platform designed to prepare students and job seekers for their dream careers in tech. 

It acts as your personal **Coding Mentor**, **Interview Coach**, and **Career Strategist**, all in one integrated dashboard.

![AI Career Companion](https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge) ![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Django%20%7C%20Gemini%20API-green?style=for-the-badge)

---

## ✨ Key Features

### 🧩 1. The CodeHelper (Beginner Mentor)
*For those who find LeetCode intimidating.*
-   **Think-First Approach**: Instead of throwing you into a code editor, Guido asks you to explain your *logic* in plain English (or Malayalam!).
-   **Micro-Problems**: Complex LeetCode questions (like "Two Sum") are rewritten into fun, jargon-free stories (e.g., "The Apple Counter").
-   **AI Validation**: Uses **Gemini 1.5** to check your logic before you write a single line of code.

### 🎥 2. AI Interview Coach
*Practice makes perfect.*
-   **Real-Time Visual Analysis**: Uses **MediaPipe** to track your eye contact, posture, and stability via webcam.
-   **Resume-Based Questions**: Upload your PDF resume, and the AI generates tailored technical and behavioral questions.
-   **Voice Interaction**: The interviewer *speaks* to you (TTS), and you reply naturally.
-   **Performance Feedback**: Get a detailed score on your confidence and answer quality after every session.

### 🗣️ 3. Voice Career Agent
*Your 24/7 Career Counselor.*
-   **Bilingual Support**: Ask career doubts in **English** or **Malayalam**.
-   **Context-Aware**: Remembers your profile and gives advice on tech stacks, roadmap planning, and soft skills.
-   **Voice-Activated**: Fully hands-free interaction using Speech-to-Text and Text-to-Speech.

### 🌍 4. Smart Job Insights
*Don't just apply, apply smart.*
-   **AI Relevance Scoring**: Fetches live remote jobs (via Remotive API) and scores them from 0-100% based on your specific skills and role.
-   **Market Analysis**: Provides a quick summary of the job market for your target role.

---

## 🛠️ Technology Stack

| Component | Tech |
| :--- | :--- |
| **Frontend** | React + Vite, TailwindCSS, Lucide Icons, MediaPipe (Vision Tasks) |
| **Backend** | Django REST Framework, Python-Dotenv, gTTS |
| **AI Models** | **Gemini 1.5 Flash** (Logic/NLU), **MediaPipe** (Computer Vision) |
| **Data** | Kaggle (LeetCode Dataset), Remotive API (Jobs) |
| **Auth** | Firebase Authentication |

---

## 🚀 Getting Started

### Prerequisites
-   Node.js & npm
-   Python 3.9+
-   Gemini API Key

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/Guido.git
    cd Guido
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # or venv\Scripts\activate on Windows
    pip install -r requirements.txt
    
    # Create .env file with GEMINI_API_KEY=your_key_here
    python manage.py runserver
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Launch**
    Open `http://localhost:5173` to start your career journey!

---

## 🔮 Future Roadmap
-   [ ] **Feedback Dashboard**: Visual progress charts.
-   [ ] **Company Ratings**: Aggregated insights from Glassdoor/LinkedIn.
-   [ ] **Mock Interviews**: Peer-to-peer practice rooms.

