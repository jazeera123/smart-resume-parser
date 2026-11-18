# Smart Resume Parser

A complete, modern web application that lets you upload PDF and DOCX resumes, automatically extract candidate information (name, email, phone, education, experience, and technical skills), and search/filter/match candidates against required job skills.

## Features

- **User Authentication** — Register and sign in with email and password. Each user sees only their own uploaded resumes.
- **Resume Upload** — Drag-and-drop or click to upload PDF and DOCX files (up to 10MB). File type and size are validated before parsing.
- **Real Resume Parsing** — Text is extracted directly in the browser from the uploaded file (no fake data):
  - PDF parsing via `pdfjs-dist`
  - DOCX parsing via `mammoth`
  - Name, email, and phone are detected with pattern matching
  - Education and experience sections are located by keyword
  - Technical skills are extracted using a 150+ entry dictionary with word-boundary-aware matching (a spaCy-inspired NER-style approach that runs client-side)
- **Dashboard** — Stats cards (total resumes, unique skills), a searchable candidate table, and a detail drawer to view full parsed info. Delete records any time.
- **Search & Match (Admin)** — Search candidates by name, filter by skill, and enter a list of required job skills to see each candidate's match percentage with a per-skill pass/fail breakdown, sorted by best match.
- **Persistent Storage** — All candidate data is stored in a Postgres database (Supabase) with full Create / Read / Update / Delete support and row-level security so users can only access their own records.
- **Responsive Design** — Works on desktop (sidebar layout) and mobile (drawer navigation + card views).

## Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| PDF parsing | pdfjs-dist |
| DOCX parsing | mammoth |
| Backend / Database / Auth | Supabase (Postgres + Auth + Row Level Security) |

> **Note on the original spec:** The request asked for a Python Flask + SQLite + spaCy backend. This Bolt project runs a React frontend that cannot host a separate Python server, so the equivalent functionality is implemented entirely in the browser: PDF/DOCX text extraction uses the same libraries used by production web parsers, and skill extraction uses a dictionary-based NER approach inspired by spaCy's entity matching. Data persistence and authentication use Supabase (Postgres) instead of SQLite, with the same CRUD semantics and per-user isolation. No part of the parsing is mocked — it runs on the actual uploaded file content.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Environment

This project uses [Supabase](https://supabase.com) for the database and authentication. Set up your credentials locally:

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Create a free Supabase project at https://supabase.com (or use an existing one).
3. In **Project Settings → API**, copy your **Project URL** and **anon public** key.
4. Paste them into `.env`:
   ```
   VITE_SUPABASE_URL=https://yourproject.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Open the **SQL Editor** in the Supabase dashboard and run the migration file located at `supabase/migrations/20261118093437_create_candidates_table.sql`. This creates the `candidates` table with row-level security policies.

### Run the dev server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## How to Use

1. **Register** a new account on the sign-in page (or sign in if you already have one).
2. Go to **Upload Resume** and drop a PDF or DOCX resume.
3. Click **Parse Resume** — the app extracts text and shows the detected name, email, phone, skills, education, and experience.
4. Click **Save to Dashboard** to store the candidate.
5. Open the **Dashboard** to see all your candidates, search them, view full details, or delete records.
6. Open **Search & Match** to filter by name/skill and match candidates against a comma-separated list of required job skills (e.g. `React, Node.js, PostgreSQL`). Results are ranked by match percentage with a per-skill breakdown.

## Project Structure

```
src/
  components/
    AuthPage.tsx        # Login + Register screen
    Dashboard.tsx       # Stats, table, detail drawer, delete
    EmptyState.tsx      # Reusable empty-state component
    Layout.tsx          # Sidebar + mobile drawer shell
    Loader.tsx          # Reusable loading spinner
    SearchPage.tsx      # Name search, skill filter, skill matching
    UploadPage.tsx      # Upload, parse, preview, save
  lib/
    auth.tsx            # Auth context (Supabase session)
    resumeParser.ts     # Text extraction + info/skill extraction + matching
    supabaseClient.ts   # Supabase client + Candidate type
  App.tsx               # Routing between auth and app pages
```
