# ⚖️ Gen-Vidhik Sahayak (AI Legal Assistant)

**Democratizing Access to Justice with Agentic AI**

---

## 📖 Overview

**Gen-Vidhik Sahayak** is an advanced, AI-powered legal self-representation platform designed specifically for the **Indian legal ecosystem**. Unlike traditional legal chatbots that merely answer questions, Gen-Vidhik Sahayak functions as an **Agentic AI System** that actively guides users through complex legal workflows such as **Bail Applications, Affidavits, FIR-related procedures, and RTI filings**.

The platform introduces a unique **"Quest Log" Case Roadmap**, transforming intimidating legal procedures into structured, step-by-step tasks. Powered by a **Multimodal Retrieval-Augmented Generation (RAG) Engine**, the system can read and analyze uploaded legal evidence using OCR, cross-verifying extracted facts with user statements to ensure **accuracy, compliance, and factual integrity** in generated legal documents.

---

## 🚀 Key Features

* **🕵️ Multimodal RAG Engine**  
  Upload scanned FIRs, handwritten notes, cheques, or affidavits. The system uses **Google Cloud Vision OCR** to extract text and cross-reference evidence with user-provided case facts before document generation.

* **🗺️ Gamified Case Roadmap (Quest Log)**  
  Legal workflows are broken into progressive stages such as **Fact Collection → Evidence Verification → Drafting → Review**, ensuring procedural correctness and preventing skipped steps.

* **📄 Automated Legal Drafting Engine**  
  Generates court-ready legal documents such as **Bail Applications, Vakalatnama, RTI Requests, and Affidavits** by injecting verified facts into legally compliant templates.

* **💾 Lazy Persistence (Auto-Save System)**  
  Case progress, AI conversations, drafts, and evidence metadata are automatically saved to **MongoDB** in real time, allowing users to safely resume work at any stage.

* **🧠 Indian Legal Expert AI**  
  Prompt-engineered and constrained to adhere strictly to **IPC, CrPC, and BNSS**, reducing hallucinations and ensuring domain-accurate legal reasoning.

* **🔐 Enterprise-Grade Security**  
  Implements **JWT Authentication**, **Role-Based Access Control (RBAC)**, encrypted password storage using **BCrypt**, and **Email OTP-based password recovery**.

---

## 🛠️ Technology Stack

| Category | Technology |
|--------|-----------|
| Frontend | React.js (Vite), Tailwind CSS, Shadcn/UI, Lucide React |
| Backend | Python FastAPI (Async/Await), Uvicorn |
| Database | MongoDB (Motor Async Driver) |
| AI & ML | Google Gemini Pro 1.5 (Reasoning), Google Cloud Vision (OCR) |
| Authentication | JWT, BCrypt, SMTP (Email OTP) |
| DevOps & Tooling | Python-Dotenv, Git |

---

## ⚙️ Prerequisites

Before running the project locally, ensure the following tools and services are available:

* **Python 3.10+** (required for FastAPI async features)
* **Node.js (LTS)** (required for React + Vite)
* **MongoDB** (local instance or Atlas cloud URL)
* **Google Cloud API Keys** (Gemini & Vision OCR)
* **Git**

---

## 📦 Installation & Setup

The project follows a **monorepo structure** with separate frontend and backend directories:

* `client/` – React frontend
* `server/` – FastAPI backend

---

## 🔧 Backend Setup (FastAPI)

```bash
# Clone the repository
git clone https://github.com/Sanjay9176/Gen-Vidhik-Sahayak.git
cd Gen-Vidhik-Sahayak/server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

🔐 Environment Variables Configuration
Create a .env file inside the server/ directory:

env
Copy code
# Database Configuration
MONGO_URI=mongodb://localhost:27017/gen_vidhik_db

# Security Configuration
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-cloud-vision.json

# Email Service (OTP Recovery)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
▶️ Running the Backend Server
bash
Copy code
uvicorn main:app --reload
Backend Server URL:
http://127.0.0.1:8000

🎨 Frontend Setup (React + Vite)
bash
Copy code
cd ../client

# Install frontend dependencies
npm install

# Start development server
npm run dev
Frontend Application URL:
http://localhost:5173

🧭 Application Workflow
User registers or logs in securely using JWT authentication

A new legal case is initiated via the Quest Log

Facts and evidence are collected and verified using OCR

AI performs legal triage and validation

Court-ready legal documents are generated and reviewed

📸 Application Preview
Quest Log Case Roadmap (Main Workspace)

AI Chat & Legal Triage Interface

Multimodal Evidence Upload & Verification

🛣️ System Architecture
Client Layer – React.js manages UI rendering, state, and Quest Log progression

Security Layer – JWT middleware enforces authentication and RBAC

Application Layer – FastAPI orchestrates asynchronous legal triage and drafting services

Intelligence Layer – Google Gemini (Reasoning) and Vision OCR act as external AI services

Data Layer – MongoDB persists user data, case facts, drafts, and vector context

🤝 Contribution Guidelines
Fork the repository

Create a feature branch
git checkout -b feature/AmazingFeature

Commit changes
git commit -m "Add AmazingFeature"

Push to branch
git push origin feature/AmazingFeature

Open a Pull Request

🧠 Future Enhancements
Vector database integration for semantic legal search

Multilingual Indian language support

AI-powered precedent and case-law retrieval

Court-specific formatting rules

Cloud-native deployment with CI/CD pipelines

👤 Author
Sanjay Kumar Purohit

Aspiring Full Stack & AI Engineer
Chennai, Tamil Nadu, India
