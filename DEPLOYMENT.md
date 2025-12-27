# How to Deploy "Guido" 🚀

Since your app has a **React Frontend** and a **Django Backend**, the best way to deploy is to **split them**:
1.  **Frontend** → **Vercel** (Best for React)
2.  **Backend** → **Render** (Best for Django/Python)

---

## Part 1: Deploy Backend (Render) 🐍

1.  **Push Code to GitHub**:
    -   Make sure your code is pushed to a GitHub repository.

2.  **Create Render Account**:
    -   Go to [dashboard.render.com](https://dashboard.render.com/) and log in.

3.  **Create New Web Service**:
    -   Click **"New +"** → **"Web Service"**.
    -   Connect your GitHub repository.

4.  **Configure Settings**:
    -   **Root Directory**: `backend` (Important!)
    -   **Runtime**: Python 3
    -   **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
    -   **Start Command**: `gunicorn core.wsgi:application`

5.  **Environment Variables**:
    -   Click "Advanced" (or "Environment" tab later).
    -   Add Key: `PYTHON_VERSION` Value: `3.9.0` (or `3.11.0`)
    -   Add Key: `SECRET_KEY` Value: `(Generate a random string)`
    -   Add Key: `RENDER` Value: `true`

6.  **Deploy**:
    -   Click **"Create Web Service"**.
    -   Wait for the build to finish.
    -   **Copy your Backend URL** (e.g., `https://guido-backend.onrender.com`).

> **Note on Database**: By default, this uses SQLite, which forces a reset every time you redeploy. For a real app, Click **"New +" -> "PostgreSQL"** in Render and copy the `Internal Database URL` to a `DATABASE_URL` environment variable in your Web Service.

---

## Part 2: Deploy Frontend (Vercel) ⚛️

1.  **Create Vercel Account**:
    -   Go to [vercel.com](https://vercel.com/) and log in.

2.  **Import Project**:
    -   Click **"Add New..."** → **"Project"**.
    -   Import the same GitHub repository.

3.  **Configure Settings**:
    -   **Root Directory**: Click "Edit" and select `frontend`.
    -   **Framework Preset**: Vite (Should auto-detect).
    -   **Environment Variables**:
        -   Vercel handles React env vars at *build time*.
        -   You need to update your API calls in your code relative to the backend.

4.  **IMPORTANT: Connecting Frontend to Backend**:
    -   Go to your `frontend/src` code.
    -   Replace `http://localhost:8000` with your **Render Backend URL** (e.g., `https://guido-backend.onrender.com`).
    -   *Better way:* Define `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';` and set `VITE_API_URL` in Vercel.

5.  **Deploy**:
    -   Click **"Deploy"**.

---

## Part 3: Final Glue 🔗

Once both are running:
1.  Go to **Render Dashboard** (Backend).
2.  Go to **Environment Variables**.
3.  Add `CORS_ALLOWED_ORIGINS` with a value of your **Vercel Frontend URL** (e.g., `https://guido-frontend.vercel.app`).
4.  Redeploy Backend.

🎉 **Done! Your app is live!**
