⚖️ Gen-Vidhik Sahayak (AI Legal Assistant)Democratizing Access to Justice with Agentic AI📖 OverviewGen-Vidhik Sahayak is an advanced, AI-powered legal self-representation platform designed for the Indian context. Unlike standard legal chatbots, this is an Agentic System that proactively guides users through complex legal procedures (like Bail Applications, Affidavits, and FIRs).It features a unique "Quest Log" Roadmap that breaks down legal battles into manageable steps. Powered by a Multimodal RAG Engine, it can "read" uploaded evidence (via OCR) to cross-verify facts against user statements, ensuring that the generated legal documents are not just formatted correctly, but factually grounded.🚀 Key Features🕵️ Multimodal RAG Engine – The AI "sees" evidence. Upload scanned FIRs, handwritten notes, or cheques, and the system uses Google Cloud Vision to extract text and cross-reference it with your case facts.🗺️ Gamified Case Roadmap – Replaces boring forms with a "Quest Log." Users must complete "Step 1: Fact Collection" before unlocking "Step 2: Drafting," ensuring procedural compliance.📄 Automated Drafting Engine – Generates court-ready legal documents (Vakalatnama, Bail Application, RTI) in seconds by injecting verified case facts into compliant templates.💾 Lazy Persistence (Auto-Save) – Never lose progress. Chat history, drafts, and evidence metadata are synced to MongoDB in real-time, allowing you to resume your case days later.🧠 Indian Legal Expert AI – Fine-tuned prompts ensure the AI adheres strictly to the IPC (Indian Penal Code), CrPC, and BNSS, avoiding hallucinations common in generic LLMs.🔐 Enterprise-Grade Security – Features JWT Authentication, Role-Based Access Control (RBAC), and a secure Email OTP system for password recovery.🛠️ Technology StackCategoryTechnologyFrontendReact.js (Vite), Tailwind CSS, Shadcn/UI, Lucide ReactBackendPython FastAPI (Async/Await), UvicornDatabaseMongoDB (Motor Async Driver)AI LogicGoogle Gemini Pro 1.5 (Reasoning), Google Cloud Vision (OCR)AuthJWT (JSON Web Tokens), BCrypt (Hashing), SMTP (Email OTP)DevOpsPython-Dotenv, Git⚙️ PrerequisitesBefore running the project, ensure you have the following installed:Python 3.10+ (Required for FastAPI)Node.js (LTS) (Required for React)MongoDB (Local instance or Atlas Cloud URL)Google Cloud API Keys (Gemini & Vision API)📦 Installation & SetupThis project is divided into two parts: client (Frontend) and server (Backend).1. Backend Setup (FastAPI)Bash# Clone the repository
git clone https://github.com/Sanjay9176/Gen-Vidhik-Sahayak.git
cd Gen-Vidhik-Sahayak/server

# Create a virtual environment
python -m venv venv

# Activate Virtual Environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python Dependencies
pip install -r requirements.txt
2. Environment Variables (.env)Create a .env file inside the server/ directory and add your keys:Ini, TOML# Database
MONGO_URI=mongodb://localhost:27017/gen_vidhik_db

# Security
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-cloud-vision-json.json

# Email Service (For OTP)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
3. Run the Backend ServerBash# Make sure your virtual environment is active
uvicorn main:app --reload
✅ Server will start at: http://127.0.0.1:80004. Frontend Setup (React + Vite)Open a new terminal and navigate to the client/ folder.Bashcd ../client

# Install Dependencies
npm install

# Start Development Server
npm run dev
✅ App will open at: http://localhost:5173📸 Application Preview1. The "Quest Log" Roadmap (Workspace)The central hub where users track case progress step-by-step.2. AI Chat & TriageReal-time legal consultation with an AI that understands Indian Law.3. Evidence Upload (Multimodal RAG)Uploading a document which the AI "reads" via OCR.🛣️ System ArchitectureClient Layer: React.js handles the UI and State Management (Quest Log).Security Layer: JWT Middleware intercepts requests to protect routes.Application Layer: FastAPI orchestrates the "Triage Engine" and "Drafting Service" asynchronously.Intelligence Layer: Google Gemini (Reasoning) and Google Vision (OCR) operate as external microservices.Data Layer: MongoDB stores user profiles, case facts, and vector context.🤝 ContributionFork the ProjectCreate your Feature Branch (git checkout -b feature/AmazingFeature)Commit your Changes (git commit -m 'Add some AmazingFeature')Push to the Branch (git push origin feature/AmazingFeature)Open a Pull Request👤 AuthorSanjay Kumar Purohit
