<div align="center">
  
# 🛡️ FAILSAFE 
**AI-Powered Student Risk Prediction & Intervention Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-120000?style=for-the-badge&logo=xgboost&logoColor=blue)](https://xgboost.readthedocs.io/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](https://jwt.io/)

*Failsafe empowers educators and administrators with deep machine learning insights, early-warning risk analysis, and comprehensive SHAP explanations to ensure no student falls behind.*

</div>

---

## ✨ Features
- **Deep AI Analysis:** XGBoost models predicting student performance and failure probability.
- **Explainable AI (XAI):** Visual SHAP decision plots highlighting protective vs. risk-increasing factors.
- **Role-Based Portals:** Dedicated, secure interfaces for Teachers/Faculty and Heads of Department (HoD).
- **Secure Architecture:** Built with FastAPI, backed by PostgreSQL, and secured with JSON Web Tokens (JWT).

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **[Python 3.10+](https://www.python.org/downloads/)** (for the FastAPI backend)
2. **[Node.js (v16+)](https://nodejs.org/)** (for the React frontend)
3. **[PostgreSQL](https://www.postgresql.org/download/)** (Database engine)
4. **[Visual Studio Code](https://code.visualstudio.com/)** (Recommended IDE)

---

## 🚀 Getting Started Guide

Follow these steps to configure, connect the database, and run the project locally using VS Code.

### Step 1: Open the Project in VS Code
1. Open **Visual Studio Code**.
2. Click `File` > `Open Folder...` and select the `FAILSAFE` project directory.
3. Open a new terminal in VS Code by clicking `Terminal` > `New Terminal` or pressing `` Ctrl + ` ``.

---

### Step 2: Database Setup (PostgreSQL)
Failsafe requires a PostgreSQL database to store users, cache heavy ML insights, and hold student records.

1. Open **pgAdmin** (or your preferred PostgreSQL client).
2. Create a new database named **`failsafe_db`**.
3. *Note your postgres username and password.* (By default, the username is usually `postgres`).

---

### Step 3: Backend Configuration (FastAPI)

1. **Navigate to the backend folder** in your VS Code terminal:
   ```bash
   cd backend
   ```

2. **Create and Activate a Virtual Environment:**
   *Windows:*
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
   *Mac/Linux:*
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Connect the Database:**
   Open `backend/database.py` in VS Code and locate the `SQLALCHEMY_DATABASE_URL` line. Update it with your PostgreSQL credentials:
   ```python
   # Format: postgresql://username:password@localhost:5432/failsafe_db
   SQLALCHEMY_DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/failsafe_db"
   ```

5. *(Optional)* **Load Initial Data:**
   If you have the `load_data.py` script and the `student-mat.csv` file ready, you can inject the data into your newly created database:
   ```bash
   python load_data.py
   ```

---

### Step 4: Frontend Configuration (React)

1. Open a **second** terminal in VS Code (click the `+` icon in the terminal panel).
2. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```
3. **Install Node modules:**
   ```bash
   npm install
   ```

---

## ⚡ Running the Application

To start the full stack, you need both the Backend and Frontend running simultaneously in separate VS Code terminals.

#### 1. Start the Backend Server (Terminal 1)
Ensure your virtual environment is activated (`(.venv)` should be visible in the prompt), then run:
```bash
cd backend
uvicorn main:app --reload
```
*The backend will boot up at `http://127.0.0.1:8000`. You can view the automatic API docs at `http://127.0.0.1:8000/docs`.*

#### 2. Start the Frontend Server (Terminal 2)
```bash
cd frontend
npm start
```
*The frontend will compile and automatically open your browser to `http://localhost:3000`.*

---

## 🔐 Authentication
Failsafe is secured via **JSON Web Tokens (JWT)**.
- To access the dashboard, click **Sign Up** on the welcome screen to create an account.
- Your credentials and session will be securely managed across the FastAPI backend and React context layer.

---

<div align="center">
  <i>Developed with ❤️ for educational excellence and intervention.</i>
</div>
