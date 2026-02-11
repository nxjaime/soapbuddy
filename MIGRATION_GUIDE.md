# 🚀 SoapBuddy Migration to Supabase + Vercel

**Date:** February 5, 2026

## ✅ Migration Complete

The application has been successfully migrated from a local Python backend to a Serverless architecture using **Supabase** (Backend/Database) and **Vercel** (Frontend).

### Key Changes
1. **Frontend-Only Architecture**: The Python FastAPI backend (`web/backend`) is no longer used. The React frontend communicates directly with Supabase.
2. **Database**: Migrated from local SQLite (`soapmanager.db`) to Supabase PostgreSQL.
3. **API Client**: `src/api/client.js` now uses `@supabase/supabase-js`.

### 📂 Project Structure
- `web/frontend/` - The main application (Deploy this to Vercel!)
- `web/frontend/.env` - Contains your Supabase API keys (DO NOT COMMIT THIS!)
- `supabase-schema.sql` - The database schema used to set up Supabase.

### 🚀 How to Deploy to Vercel

1. **Push to GitHub**
   The project is initialized and all changes are committed to the local `main` branch.
   
   Run this command in the terminal to push your code:
   ```bash
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to Vercel Dashboard -> Add New Project
   - Import your GitHub repository
   - Select `Vite` as the framework (it should auto-detect)
   - **Root Directory**: Set this to `web/frontend`
   
3. **Configure Environment Variables**
   In Vercel Project Settings -> Environment Variables, add:
   - `VITE_SUPABASE_URL`: `YOUR_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`: `YOUR_SUPABASE_ANON_KEY`

4. **Deploy**
   Click Deploy!

### 🧹 Cleanup
You can safely remove these folders if you no longer need the local version:
- `web/backend/`
- `src/` (Desktop app code)

---

**Note on Security**: RLS (Row Level Security) policies are currently set to "Allow All" for testing. Before launching publicly, you should implement Authentication and lock down these policies.
