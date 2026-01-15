<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gen-Vidhik Sahayak - Project Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        h1 { font-size: 2.5em; color: #0366d6; }
        blockquote { border-left: 4px solid #dfe2e5; color: #6a737d; padding-left: 1em; margin: 0; }
        code { background-color: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
        pre { background-color: #f6f8fa; padding: 16px; overflow: auto; border-radius: 6px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
        th { background-color: #f6f8fa; font-weight: bold; text-align: left; }
        tr:nth-child(2n) { background-color: #f8f8f8; }
        img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; padding: 5px; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>

    <header>
        <h1>⚖️ Gen-Vidhik Sahayak (AI Legal Assistant)</h1>
        <blockquote>
            <strong>Democratizing Access to Justice with Agentic AI</strong>
        </blockquote>
    </header>

    <section id="overview">
        <h2>📖 Overview</h2>
        <p>
            <strong>Gen-Vidhik Sahayak</strong> is an advanced, AI-powered legal self-representation platform designed for the Indian context. Unlike standard legal chatbots, this is an <strong>Agentic System</strong> that proactively guides users through complex legal procedures (like Bail Applications, Affidavits, and FIRs).
        </p>
        <p>
            It features a unique <strong>"Quest Log" Roadmap</strong> that breaks down legal battles into manageable steps. Powered by a <strong>Multimodal RAG Engine</strong>, it can "read" uploaded evidence (via OCR) to cross-verify facts against user statements, ensuring that the generated legal documents are not just formatted correctly, but factually grounded.
        </p>
    </section>

    <section id="features">
        <h2>🚀 Key Features</h2>
        <ul>
            <li><strong>🕵️ Multimodal RAG Engine:</strong> The AI "sees" evidence. Upload scanned FIRs, handwritten notes, or cheques, and the system uses <strong>Google Cloud Vision</strong> to extract text and cross-reference it with your case facts.</li>
            <li><strong>🗺️ Gamified Case Roadmap:</strong> Replaces boring forms with a "Quest Log." Users must complete "Step 1: Fact Collection" before unlocking "Step 2: Drafting," ensuring procedural compliance.</li>
            <li><strong>📄 Automated Drafting Engine:</strong> Generates court-ready legal documents (Vakalatnama, Bail Application, RTI) in seconds by injecting verified case facts into compliant templates.</li>
            <li><strong>💾 Lazy Persistence (Auto-Save):</strong> Never lose progress. Chat history, drafts, and evidence metadata are synced to MongoDB in real-time, allowing you to resume your case days later.</li>
            <li><strong>🧠 Indian Legal Expert AI:</strong> Fine-tuned prompts ensure the AI adheres strictly to the <strong>IPC (Indian Penal Code)</strong>, <strong>CrPC</strong>, and <strong>BNSS</strong>, avoiding hallucinations common in generic LLMs.</li>
            <li><strong>🔐 Enterprise-Grade Security:</strong> Features <strong>JWT Authentication</strong>, Role-Based Access Control (RBAC), and a secure Email OTP system for password recovery.</li>
        </ul>
    </section>

    <section id="tech-stack">
        <h2>🛠️ Technology Stack</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Technology</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Frontend</strong></td>
                    <td>React.js (Vite), Tailwind CSS, Shadcn/UI, Lucide React</td>
                </tr>
                <tr>
                    <td><strong>Backend</strong></td>
                    <td>Python <strong>FastAPI</strong> (Async/Await), Uvicorn</td>
                </tr>
                <tr>
                    <td><strong>Database</strong></td>
                    <td><strong>MongoDB</strong> (Motor Async Driver)</td>
                </tr>
                <tr>
                    <td><strong>AI Logic</strong></td>
                    <td><strong>Google Gemini Pro 1.5</strong> (Reasoning), <strong>Google Cloud Vision</strong> (OCR)</td>
                </tr>
                <tr>
                    <td><strong>Auth</strong></td>
                    <td>JWT (JSON Web Tokens), BCrypt (Hashing), SMTP (Email OTP)</td>
                </tr>
                <tr>
                    <td><strong>DevOps</strong></td>
                    <td>Python-Dotenv, Git</td>
                </tr>
            </tbody>
        </table>
    </section>

    <section id="prerequisites">
        <h2>⚙️ Prerequisites</h2>
        <p>Before running the project, ensure you have the following installed:</p>
        <ul>
            <li><strong>Python 3.10+</strong> (Required for FastAPI)</li>
            <li><strong>Node.js (LTS)</strong> (Required for React)</li>
            <li><strong>MongoDB</strong> (Local instance or Atlas Cloud URL)</li>
            <li><strong>Google Cloud API Keys</strong> (Gemini & Vision API)</li>
        </ul>
    </section>

    <hr>

    <section id="installation">
        <h2>📦 Installation & Setup</h2>
        <p>This project is divided into two parts: <code>client</code> (Frontend) and <code>server</code> (Backend).</p>

        <h3>1. Backend Setup (FastAPI)</h3>
        <pre><code># Clone the repository
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
pip install -r requirements.txt</code></pre>

        <h3>2. Environment Variables (.env)</h3>
        <p>Create a <code>.env</code> file inside the <code>server/</code> directory and add your keys:</p>
        <pre><code># Database
MONGO_URI=mongodb://localhost:27017/gen_vidhik_db

# Security
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-cloud-vision-json.json

# Email Service (For OTP)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password</code></pre>

        <h3>3. Run the Backend Server</h3>
        <pre><code># Make sure your virtual environment is active
uvicorn main:app --reload</code></pre>
        <p>✅ <em>Server will start at: <code>http://127.0.0.1:8000</code></em></p>

        <h3>4. Frontend Setup (React + Vite)</h3>
        <p>Open a new terminal and navigate to the <code>client/</code> folder.</p>
        <pre><code>cd ../client

# Install Dependencies
npm install

# Start Development Server
npm run dev</code></pre>
        <p>✅ <em>App will open at: <code>http://localhost:5173</code></em></p>
    </section>

    <hr>

    <section id="preview">
        <h2>📸 Application Preview</h2>

        <h3>1. The "Quest Log" Roadmap (Workspace)</h3>
        <p><em>The central hub where users track case progress step-by-step.</em></p>
        <img src="https://github.com/user-attachments/assets/placeholder-1.png" alt="Workspace Screenshot">

        <h3>2. AI Chat & Triage</h3>
        <p><em>Real-time legal consultation with an AI that understands Indian Law.</em></p>
        <img src="https://github.com/user-attachments/assets/placeholder-2.png" alt="Chat Interface Screenshot">

        <h3>3. Evidence Upload (Multimodal RAG)</h3>
        <p><em>Uploading a document which the AI "reads" via OCR.</em></p>
        <img src="https://github.com/user-attachments/assets/placeholder-3.png" alt="Evidence Panel Screenshot">
    </section>

    <hr>

    <section id="architecture">
        <h2>🛣️ System Architecture</h2>
        <ul>
            <li><strong>Client Layer:</strong> React.js handles the UI and State Management (Quest Log).</li>
            <li><strong>Security Layer:</strong> JWT Middleware intercepts requests to protect routes.</li>
            <li><strong>Application Layer:</strong> FastAPI orchestrates the "Triage Engine" and "Drafting Service" asynchronously.</li>
            <li><strong>Intelligence Layer:</strong> Google Gemini (Reasoning) and Google Vision (OCR) operate as external microservices.</li>
            <li><strong>Data Layer:</strong> MongoDB stores user profiles, case facts, and vector context.</li>
        </ul>
    </section>

    <section id="contribution">
        <h2>🤝 Contribution</h2>
        <ol>
            <li>Fork the Project</li>
            <li>Create your Feature Branch (<code>git checkout -b feature/AmazingFeature</code>)</li>
            <li>Commit your Changes (<code>git commit -m 'Add some AmazingFeature'</code>)</li>
            <li>Push to the Branch (<code>git push origin feature/AmazingFeature</code>)</li>
            <li>Open a Pull Request</li>
        </ol>
    </section>

    <section id="author">
        <h2>👤 Author</h2>
        <p><strong>Sanjay Kumar Purohit</strong></p>
        <ul>
            <li><strong>GitHub:</strong> <a href="https://github.com/Sanjay9176">Sanjay9176</a></li>
            <li><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/sanjay-kumar-purohit">Sanjay Kumar Purohit</a></li>
        </ul>
    </section>

    <footer>
        <p><em>Built with ❤️ for Justice & Code.</em></p>
    </footer>

</body>
</html>
