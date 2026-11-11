# RepoChat 🚀

**Chat with your GitHub codebase using AI.**

RepoChat is an AI-powered developer tool that lets you connect your GitHub repositories, index them using Retrieval-Augmented Generation (RAG), and have natural language conversations about your code. It features a Cursor-like IDE interface where the AI automatically understands the file you are currently viewing.

---

## 🌐 Live Demo

- **Frontend:** [https://repo-chat-6ftk-tawny.vercel.app/](https://repo-chat-6ftk-tawny.vercel.app/)
- **Backend API:** [https://repochat-hanv.onrender.com](https://repochat-hanv.onrender.com)

---

## 🧠 How It Works (The RAG Pipeline)

Standard LLMs (like ChatGPT) don't know anything about your private or newly written code. RepoChat solves this by fetching your code, breaking it down, and storing it in a way that the AI can search through it before answering.

1. **Fetching:** When you click "Index", the backend uses the GitHub API to fetch the file tree and the contents of all eligible source code files.
2. **Chunking:** Large files are split into smaller, manageable chunks (~800 characters) using token-based splitting, preserving line numbers.
3. **Embedding:** Each chunk is sent to the Gemini Embedding API, which converts the code into a 1536-dimensional vector (a mathematical representation of the code's meaning).
4. **Storage:** These vectors are stored in a PostgreSQL database using the `pgvector` extension.
5. **Retrieval:** When you ask a question, your question is also converted into a vector. The database runs a similarity search to find the 8 most relevant code chunks.
6. **Generation:** The retrieved code chunks and your question are sent to Groq (Llama 3). The AI reads the context and generates a grounded answer, complete with file path and line number citations.

---

## ✨ Features

- **GitHub OAuth Integration:** Securely log in and grant read access to your public and private repositories.
- **Automated Code Indexing:** Background indexing with live progress tracking and error handling for API rate limits.
- **In-Browser IDE Interface:** A sleek, 3-pane layout (File Tree, Code Viewer, Chat) inspired by Cursor and VS Code.
- **Context-Aware Chat:** The AI automatically reads the file you have open in the code viewer and uses it as the primary context for your question.
- **Syntax Highlighting & Zoom:** A beautiful dark-mode code viewer with built-in zoom controls.
- **Source Citations:** Every AI response includes clickable citations showing exactly which file and line number the answer came from.
- **Session History:** Chat sessions are saved to the database, so you can continue your conversation later.

---

## 🛠️ Tech Stack

### Backend

- **Framework:** Spring Boot 3 (Java 21)
- **AI Orchestration:** Spring AI
- **Chat Model:** Groq (`openai/gpt-oss-120b`) via OpenAI-compatible API
- **Embedding Model:** Google Gemini (`gemini-embedding-001` - 1536 dimensions)
- **Vector Database:** PostgreSQL + `pgvector` extension
- **Security:** Spring Security (OAuth2 Client for GitHub), Session Cookies

### Frontend

- **Framework:** Next.js 14 (App Router, Turbopack)
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** TanStack React Query (for server state)
- **Syntax Highlighting:** `react-syntax-highlighter` (VS Code Dark theme)
- **Icons:** Lucide React

---

## 🏗️ Project Architecture

The project is split into two main directories:

```text
RepoChat/
├── Backend/                 # Spring Boot Application
│   ├── src/main/java/       # Java Source Code
│   │   ├── controller/      # REST & SSE Endpoints
│   │   ├── services/        # Core Logic (Indexing, Chat, GitHub API)
│   │   └── config/          # Spring AI & Security Configs
│   ├── src/main/resources/  # application.properties
│   ├── Dockerfile           # For production deployment
│   └── pom.xml              # Maven dependencies
│
└── frontend/                # Next.js Application
    ├── app/                 # Next.js App Router (Pages)
    ├── components/          # UI Components (Chat, IDE View, File Tree)
    ├── hooks/               # React Query Hooks (useChat, useRepos)
    ├── lib/                 # API Client & Utilities
    └── package.json         # NPM dependencies
```

---

## 💻 Running Locally

### Prerequisites

- Java 21 (or higher)
- Node.js 18+
- Docker (for PostgreSQL)
- GitHub OAuth App (Client ID & Secret)
- Groq API Key
- Gemini API Key

### 1. Start the Database

We use Docker to run PostgreSQL with the `pgvector` extension:

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5433` and creates the `repochat` database.

### 2. Backend Setup

Open the `Backend` folder.

Set the following environment variables in your IDE (IntelliJ/Eclipse):

```env
GEMINI_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost:3000
TOKEN_ENCRYPTOR_PASSWORD=your_random_password
TOKEN_ENCRYPTOR_SALT=1234567890123456
```

**Note:** `TOKEN_ENCRYPTOR_SALT` must contain exactly 16 characters.

Run the Spring Boot application:

```bash
./mvnw spring-boot:run
```

Backend will start at:

```text
http://localhost:8080
```

### 3. Frontend Setup

Open the `frontend` folder.

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Frontend will start at:

```text
http://localhost:3000
```

---

## ⚙️ Core Engineering Challenges Solved

### 1. Provider Abstraction (Groq + Gemini)

Handled the limitation of Groq not providing an embedding API by configuring Spring AI to route chat generation to Groq and embedding generation to Gemini simultaneously, resolving bean conflicts via auto-configuration exclusion.

### 2. Rate Limiting

Implemented custom backoff and sleep intervals during the indexing process to prevent exceeding Gemini's free-tier limit of 100 embedding requests per minute.

### 3. Streaming Responses (SSE)

Implemented Server-Sent Events (SSE) for the chat interface, allowing the AI's response to stream token-by-token for a better user experience. Handled client disconnects gracefully to prevent wasting LLM tokens.

### 4. Cross-Domain Session Management

Configured `SameSite` and `Secure` cookie policies to allow the Vercel frontend to securely communicate with the Render backend.

---

## 🔒 Security & Privacy

- **Token Encryption:** GitHub access tokens are encrypted using AES before being stored in the database.
- **No Code Retention:** Your code is only stored as mathematical vectors in your own isolated PostgreSQL database. It is never used to train any AI models.
- **Scoped Access:** The GitHub OAuth app only requests `read:user` and `repo` scopes.

---

## 📬 Contact

**Alok Kumar Dubey**

- **Email:** [dubeyalokkumar2005@gmail.com](mailto:dubeyalokkumar2005@gmail.com)

---

**Built to demonstrate modern full-stack AI engineering and Retrieval-Augmented Generation (RAG) architecture.**
