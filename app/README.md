# PORTPAL Sample App - Developer Setup

Interactive React prototype demonstrating the PORTPAL shift tracking and pay verification app.

## Quick Start

### Prerequisites
- Node.js v18+ (you have v22 - that's fine)
- npm v9+ (you have v11 - that's fine)

### Setup Steps

```bash
# 1. Navigate to the app folder
cd app

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

## What You'll See

### Main Phone App (`/`)
A mobile app mockup with bottom navigation:
- **Home** - Weekly earnings, pension progress, streaks, pay alerts
- **Shifts** - Add/edit shifts with automatic pay calculation
- **Calendar** - Week view of logged shifts
- **Analytics** - Charts by terminal, job type, earnings
- **Chat** - AI assistant mockup for rate questions

### Other Routes
| URL | Description |
|-----|-------------|
| `/#/landing` | Marketing landing page |
| `/#/dashboard` | Admin dashboard with metrics |
| `/#/command-center` | Full admin panel |
| `/#/social` | Social media graphics generator |

## Key Files for Pay Calculation Logic

The pay calculation logic lives in `src/data/mockData.ts`:

```
src/
├── data/
│   └── mockData.ts      # <-- All rate tables, differentials, jobs, locations
├── pages/
│   ├── Home.tsx         # Dashboard with earnings display
│   ├── Shifts.tsx       # Shift entry with pay calculation
│   └── ...
└── App.tsx              # Routing
```

### mockData.ts contains:
- `JOBS` - All 42 canonical job names
- `LOCATIONS` - All 24 terminals (including CENTENNIAL with 9-hour shifts)
- `BASE_RATES` - Year 3 rates (Apr 2025) by shift type and day type
- `DIFFERENTIALS` - All 6 classes (BASE, CLASS_1-4, WHEAT)
- `HOURS_BY_LOCATION` - CENTENNIAL override (9/9/7.5 vs standard 8/8/6.5)

## Tech Stack
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router DOM 7
- Recharts (charts)
- Lucide React (icons)

## Troubleshooting

**White screen / not loading:**
- Open browser DevTools (F12) → Console tab for errors
- Make sure you ran `npm install` first
- Try `npm run dev -- --port 3000` if port 5173 is blocked

**Port already in use:**
```bash
# Kill existing node processes (Windows PowerShell)
taskkill /F /IM node.exe

# Then restart
npm run dev
```
