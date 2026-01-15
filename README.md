# ⚖️ Gen-Vidhik Sahayak (AI Legal Assistant)

Democratizing Access to Justice with Agentic AI

## 📖 Overview

Gen-Vidhik Sahayak is an advanced, AI-powered legal self-representation platform designed specifically for the Indian legal system. Unlike standard legal chatbots, it operates as an **Agentic AI System** that proactively guides users through complex legal procedures such as Bail Applications, Affidavits, FIR-related processes, and RTI drafting.

A unique **"Quest Log" Roadmap** breaks down intimidating legal battles into structured, manageable steps. Powered by a **Multimodal RAG Engine**, the platform can read uploaded legal evidence using OCR and cross-verify facts against user statements, ensuring that generated legal documents are both procedurally compliant and factually grounded.

## 🚀 Key Features

* **🕵️ Multimodal RAG Engine** – Upload scanned FIRs, handwritten notes, cheques, or documents. The system uses Google Cloud Vision OCR to extract and verify text against case facts.
* **🗺️ Gamified Case Roadmap** – A Quest Log system replaces boring legal forms, enforcing procedural flow (Fact Collection → Drafting → Review).
* **📄 Automated Drafting Engine** – Instantly generates court-ready legal documents such as Bail Applications, Vakalatnama, and RTIs.
* **💾 Lazy Persistence (Auto-Save)** – Case progress, chat history, drafts, and evidence metadata are auto-saved to MongoDB in real time.
* **🧠 Indian Legal Expert AI** – Prompt-engineered to strictly follow IPC, CrPC, and BNSS, reducing hallucinations common in generic LLMs.
* **🔐 Enterprise-Grade Security** – JWT authentication, Role-Based Access Control (RBAC), and Email OTP-based password recovery.

## 🛠️ Technology Stack

| Category   | Technology |
|-----------|------------|
| Frontend  | React.js (Vite), Tailwind CSS, Shadcn/UI, Lucide React |
| Backend   | Python FastAPI (Async/Await), Uvicorn |
| Database  | MongoDB (Motor Async Driver) |
| AI Logic  | Google Gemini Pro 1.5 (Reasoning), Google Cloud Vision (OCR) |
| Auth     | JWT, BCrypt, SMTP (Email OTP) |
| DevOps   | Python-Dotenv, Git |

## ⚙️ Prerequisites

Before running the project locally, ensure you have the following installed:

* Python 3.10+
* Node.js (LTS)
* MongoDB (Local or Atlas)
* Google Cloud API Keys (Gemini & Vision)

## 📦 Installation & Setup

This project is divided into two parts:

* `client` – Frontend (React + Vite)
* `server` – Backend (FastAPI)

## 🔧 Backend Setup (FastAPI)

```bash
# Clone the repository
git clone https://github.com/Sanjay9176/Gen-Vidhik-Sahayak.git
cd Gen-Vidhik-Sahayak/server

# Create virtual environment
python -m venv venv

# Activate environment
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
🔐 Environment Variables (.env)
Create a .env file inside the server/ directory:

env
Copy code
# Database
MONGO_URI=mongodb://localhost:27017/gen_vidhik_db

# Security
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-cloud-vision.json

# Email OTP
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
▶️ Run Backend Server
bash
Copy code
uvicorn main:app --reload
✅ Backend will run at:
http://127.0.0.1:8000

🎨 Frontend Setup (React + Vite)
bash
Copy code
cd ../client

# Install dependencies
npm install

# Start dev server
npm run dev
✅ Frontend will open at:
http://localhost:5173

📸 Application Preview
Quest Log Roadmap – Step-by-step case tracking workspace

AI Chat & Legal Triage – Real-time AI consultation aligned with Indian law

Evidence Upload (Multimodal RAG) – OCR-powered evidence verification

🛣️ System Architecture
Client Layer – React.js manages UI, state, and Quest Log workflow

Security Layer – JWT middleware protects secured endpoints

Application Layer – FastAPI orchestrates triage and drafting services asynchronously

Intelligence Layer – Google Gemini (Reasoning) and Vision (OCR) as external services

Data Layer – MongoDB stores users, case facts, drafts, and vector context

🤝 Contribution
Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open a Pull Request

👤 Author
Sanjay Kumar Purohit

markdown
Copy code
