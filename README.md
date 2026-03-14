# Spelunky Bingo

This project now includes:
- A Python backend API that serves random prompts.
- A simple React webpage with a white background, header, and 5 prompt boxes.
- GitHub Pages deployment for the React frontend.

## Project Structure

- `bingo_generator.py` — CLI bingo board generator (existing).
- `backend/app.py` — Flask API backend.
- `frontend/` — React + Vite web UI.

## Backend (Python)

Install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run API:

```bash
python3 backend/app.py
```

API endpoints:
- `GET /api/health`
- `GET /api/areas`
- `GET /api/prompts?count=25&area=dwelling`

Area tabs are driven by text files in `prompts/areas/`.
Each `*.txt` file becomes one tab (`tide_pool.txt` -> `Tide Pool`).
Add, remove, or edit files in that folder to customize the tab list.

## Frontend (React)

Install and run locally:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend uses `VITE_API_BASE_URL` (default `http://localhost:8000`).

## GitHub Pages Deployment

`frontend` is deployed by GitHub Actions via `.github/workflows/deploy-pages.yml`.

1. Push to `main`.
2. In GitHub repo settings:
   - Enable Pages source as **GitHub Actions**.
3. Add repository variable (Actions):
   - `VITE_API_BASE_URL` = your deployed backend URL (for example, Render/Railway/Fly.io).

Important: GitHub Pages can host only static files. The Python backend must be deployed to a separate service, then the frontend calls it via `VITE_API_BASE_URL`.
Use an `https://` backend URL when calling from GitHub Pages.
