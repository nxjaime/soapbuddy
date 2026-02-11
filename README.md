# SoapBuddy (formerly SoapManager)

A modern, serverless web application for soap making inventory management, recipe formulation, and production tracking.

## 🚀 Migration Status: COMPLETE
As of February 7, 2026, the application has transitioned from a Python Desktop/FastAPI app to a modern **Serverless Web Architecture**.

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Business Logic**: Ported to client-side JS and PostgreSQL RPC functions.

---

## Features

- ✅ **Inventory Management** - Real-time tracking of ingredients and supply orders.
- ✅ **Weighted Average Cost (WAC)** - Scientific cost tracking for ingredients across multiple purchases.
- ✅ **Lye Calculator** - Integrated NaOH/KOH calculations.
- ✅ **Production Tracking** - Manage batches from 'Planned' to 'Complete' with automatic inventory deduction.
- ✅ **Security** - Row Level Security (RLS) ensuring data integrity and privacy.

## Tech Stack

- **Frontend**: React (Vite)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Modules / Tailwind
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project

### Development Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd web/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `web/frontend/` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run the app**:
   ```bash
   npm run dev
   ```

## 🧹 Legacy Code
The original Python source code and SQLite database have been archived in the `_legacy_2026-02-07T20:30:00/` directory to eliminate "Split-Brain" state and maintain clear project direction.

## License
MIT License
