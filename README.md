# StockMind

AI-powered store management app — inventory, sales, suppliers, and 4 AI features (product descriptions, daily insights, restock recommendations, chat assistant with tool calling).

**Stack**: Django + DRF + PostgreSQL (backend) · React + Vite + Bootstrap (frontend) · Groq Llama 3.3 70B (LLM) · Docker Compose (orchestration)

## Quick Start

1. **Copy env file**:
   ```bash
   cp .env.example .env
   ```
   (You can leave `GROQ_API_KEY` empty for now — only needed for AI features in later phases.)

2. **Start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Open in browser**:
   - Backend (Django admin): http://localhost:8000/admin
   - Frontend (Vite dev server): http://localhost:5173

## Project Status

Currently in **Phase 0: Project Bootstrap**. See `C:\Users\MSI\.claude\plans\full-vivid-orbit.md` for the full implementation plan.
