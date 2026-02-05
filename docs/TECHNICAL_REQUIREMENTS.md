# Technical Requirements: Agent Command Center

## Frontend Architecture
- **Framework:** Next.js 14+ (App Router) or SvelteKit
- **Styling:** Tailwind CSS + Headless UI / Shadcn UI
- **State Management:** React Context or Zustand
- **Real-time:** Socket.io client for agent status updates

## Backend Architecture
- **Language:** Python (FastAPI) or Node.js (TypeScript)
- **API Style:** REST for CRUD, WebSockets for status feeds
- **Database:** 
  - **Relational:** PostgreSQL (Supabase or local) for Tasks, Agents, Projects
  - **Vector:** Pinecone or pgvector for Knowledge Base RAG
- **Storage:** S3 or local storage for task attachments

## Feature Implementation Requirements
1. **Agent Status Engine:** Service to poll/receive heartbeats from all active agents
2. **Knowledge Extraction Pipeline:** 
   - Hook into agent task completion events
   - Auto-summarization of daily research via LLM
   - Embedding generation for semantic search
3. **Kanban Backend:** Drag-and-drop state persistence with optimistic UI updates

## Integration Points
- **Notion RAG:** Syncing with existing project data in Notion
- **Clawdbot API:** Hooking into the agent environment to track activity
