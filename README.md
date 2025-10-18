# YouTube Content Studio AI

AI-powered YouTube & SNS content planning and analytics tool.

## Features

### Phase 1: AI Planning (MVP)
- ✅ AI-powered channel strategy planning
- ✅ Video concept generation based on persona
- ✅ Strategic content calendar

### Phase 2: Trend Analysis
- 🔄 Trending shorts analysis (YouTube, TikTok, Instagram)
- 🔄 Platform-specific insights
- 🔄 Competitor analysis

### Phase 3: Analytics & Production
- 🔄 YouTube Analytics CSV upload and analysis
- 🔄 Automatic production document generation
- 🔄 Shooting script templates
- 🔄 Data-driven insights and recommendations

## Tech Stack

### Backend
- FastAPI (Python)
- Google Gemini 2.0 Flash
- YouTube Data API v3
- Supabase PostgreSQL

### Frontend
- React + Vite
- TailwindCSS
- Supabase Auth

### Infrastructure
- Railway (Backend)
- Vercel (Frontend)
- Supabase (Database & Auth)

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## License

MIT
