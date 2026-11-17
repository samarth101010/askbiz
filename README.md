# AskBiz - AI Chatbot SaaS for Small Businesses

> A multi-tenant SaaS platform that allows small business owners to upload their internal knowledge documents (FAQs, pricing, return policies) and generate an embeddable AI chatbot widget for their websites powered by Google Gemini RAG.

![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success.svg)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Flash%20Lite%20%26%20Embeddings-orange.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg)

---

## Features

- **Multi-Tenant Authentication**: Secure user registration, password hashing with bcrypt, and JWT-guarded REST APIs.
- **Chatbot Management Studio**: Custom chatbot creation with business branding, custom colors, customizable welcome messages, and real-time simulator preview.
- **RAG Knowledge Base Ingestion**:
  - Upload PDFs or direct text documents.
  - Automatic sliding-window chunking (~500 characters with 100 character overlap).
  - High-dimensional vector embeddings generated using Google's `gemini-embedding-001`.
  - In-browser **Chunk Inspector** to inspect chunked tokens and vector metadata.
- **Grounded AI Retrieval**:
  - In-memory cosine similarity search retrieving top 4 matching chunks.
  - Strict anti-hallucination system prompt ensuring Gemini only answers from business documents.
  - In-dashboard **Chat Playground** with interactive test prompts and chunk citation viewers.
- **Zero-Dependency Embeddable Widget (`widget.js`)**:
  - Lightweight (<18 KB) vanilla JS script embeddable on any external website.
  - Floating action bubble, animated chat interface, session persistence, typing indicator, and responsive mobile layout.
  - Live customer conversation thread logging in MongoDB.
- **Customer Conversation Transcripts**: View visitor interactions and full Q&A transcripts from the owner dashboard.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Node.js, Express.js, Mongoose, Multer, Helmet, CORS, Express Rate Limit |
| **Database** | MongoDB / MongoDB Atlas |
| **AI / RAG** | Google Gemini API (`gemini-embedding-001`, `gemini-flash-lite-latest`) |
| **Document Processing** | `unpdf`, `pdf-parse` (dual-engine text extraction) |

---

## Project Structure

```text
askbiz/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── api/                # Axios API service instances
│   │   ├── components/         # Reusable UI & Widget components
│   │   │   ├── ChatPlayground.jsx
│   │   │   ├── ChatbotCard.jsx
│   │   │   ├── ChatbotModal.jsx
│   │   │   ├── ChunkViewerModal.jsx
│   │   │   ├── ConversationHistoryModal.jsx
│   │   │   ├── ConversationList.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/            # Global Auth state
│   │   ├── pages/              # Dashboard, Chatbot Details, Login, Signup
│   │   └── App.jsx
│   └── vercel.json             # SPA deep-link routing rewrites
│
├── server/                     # Express.js REST API & Widget Server
│   ├── public/
│   │   ├── widget.js           # Standalone embeddable floating widget
│   │   └── test-widget.html    # Demo business website
│   └── src/
│       ├── config/             # MongoDB connection
│       ├── controllers/        # Auth, Chatbot, Knowledge, Chat controllers
│       ├── middleware/         # JWT verification, Error handling, Rate limiting
│       ├── models/             # User, Chatbot, KnowledgeChunk, Conversation, Message
│       ├── routes/             # REST API routes
│       ├── services/           # Google Gemini AI & Embedding integration
│       └── utils/              # Text chunker & Cosine similarity ranking
└── README.md
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY and MONGO_URI
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## Embedding the Widget

Add this script tag right before the closing `</body>` tag of any HTML page:

```html
<script 
  src="https://<your-server-domain>/widget.js" 
  data-chatbot-id="<YOUR_CHATBOT_ID>" 
  defer>
</script>
```

---

## License

MIT License. Built with ❤️.
