# Amr Samir Edris — Portfolio & Event Director Workspace

A high-end, premium, editorial-style single-page application (SPA) portfolio website for Amr Samir Edris, event project manager and digital marketing strategist. 

Built with Vanilla HTML/CSS/JS bundled by Vite, connected to Supabase for CMS content management and custom analytics tracking, and deployed to Vercel.

## Quick Start

### 1. Configure Credentials
Copy `.env.example` to `.env` and fill in your Supabase project API details:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Run Local Development Server
Install dependencies and spin up Vite locally:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Compilation
Compile assets for production deployment:
```bash
npm run build
```

## Setup Guides
* See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed database tables, storage bucketing, and security policy queries.
* See [FEATURES.md](FEATURES.md) for a comprehensive visual and functional feature list.
