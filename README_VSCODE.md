# How to Run Guido in VS Code 🚀

Follow these steps to set up and run the **Guido** project (Frontend + Backend) inside Visual Studio Code on **Mac/Linux** or **Windows**.

## 1. Open Project
1.  Open **VS Code**.
2.  Go to **File** > **Open Folder...**
3.  Select the **Guido** folder.

## 2. Open Terminals
You need **two** separate terminals runs simultaneously: one for the **Backend** (Django) and one for the **Frontend** (React).

To open a terminal in VS Code:
-   Press `Ctrl + ~` (tilde) or go to **Terminal** > **New Terminal**.
-   To split the terminal or add a new one, click the `+` icon or split icon in the terminal panel.

---

## 3. Run Backend (Django) 🐍
In the **first terminal**:

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```

2.  **Activate Virtual Environment**:

    *   **Mac / Linux**:
        ```bash
        source venv/bin/activate
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        .\venv\Scripts\Activate
        ```
    *   **Windows (Command Prompt)**:
        ```cmd
        venv\Scripts\activate.bat
        ```
    *(You should see `(venv)` appear in your command line).*

3.  Run the Server:
    ```bash
    python manage.py runserver
    ```
    > **Success**: You'll see "Starting development server at http://127.0.0.1:8000/"

---

## 4. Run Frontend (React/Vite) ⚛️
In the **second terminal**:

1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Start the Dev Server:
    ```bash
    npm run dev
    ```
    > **Success**: You'll see "Local: http://localhost:5173/"

---

## 5. Access the App
-   Open your browser and go to: **[http://localhost:5173](http://localhost:5173)**
-   The backend API runs at `http://127.0.0.1:8000/`.

## Troubleshooting
-   **Port in Use?**: If you see "Port 8000 is in use", look for other open terminals and stop them with `Ctrl + C`.
-   **Missing Modules?**: If the backend says "Module not found", ensure your virtual environment is activated.
-   **Windows Execution Policy**: If PowerShell says "running scripts is disabled", run this command in PowerShell as Administrator:
    ```powershell
    Set-ExecutionPolicy RemoteSigned
    ```
