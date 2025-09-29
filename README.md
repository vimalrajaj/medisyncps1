# MediSync Terminology & Clinical Coding Platform

Unified NAMASTE ↔ ICD-11 dual coding, FHIR R4 bundle creation, patient session recording, and Supabase-backed persistence. Includes a government‑style header, dark/light theme toggle, diagnosis auto-search with debounced suggestions, and structured clinical session storage.

> Branding note: Portal title changed to "MediSync" and footer/login attribution updated to "Powered by Team InterOpX".

## 🚀 Core Capabilities

- Dual coding workflow: NAMASTE + optional ICD‑11 mapping per diagnosis
- Problem List management & session save to backend (diagnosis sessions + entries)
- FHIR Bundle generation (legacy simplified bundle + placeholder for full FHIR service)
- Patient persistence (create/update) before saving diagnosis sessions
- Auto-refresh of patient records after save (no manual refresh required)
- Debounced terminology search with AbortController + highlighted matches
- API client management with dummy key fallback (prototype resilience)
- Dark / Light theme toggle (Tailwind class strategy with CSS variables)
- Government‑style global header + secondary navigation bar

## 🔧 Tech Stack

Frontend:
- React 18 + React Router 6
- TailwindCSS (semantic CSS custom properties + dark theme via `.dark` class)
- Lucide Icons, Framer Motion (available), Recharts / D3 (optional analytics integration)
- Supabase JS client (auth / persistence)
- Vite build / dev server

Backend (server/):
- Node.js + Express (REST endpoints: patients, diagnosis sessions, terminology)
- Supabase (Postgres) for persistence
- Middleware: security (helmet, rate limit), logging (morgan)

FHIR Layer (prototype):
- Routes + service objects for CodeSystem / ConceptMap / Bundle (R4 orientation)

## 📁 Monorepo Layout

```
root
├─ src/                     # React application
│  ├─ components/           # UI + domain components (headers, search, clinical panels)
│  ├─ pages/                # Page-level containers (login-authentication, clinical-diagnosis-entry, etc.)
│  ├─ services/             # Frontend service wrappers (fhirService, apiClientService, etc.)
│  ├─ contexts/             # Context providers (Auth, Theme)
│  ├─ styles/               # Tailwind + global CSS
│  └─ lib/                  # Supabase init
├─ server/                  # Express backend
│  ├─ src/routes/           # API routes (patients, diagnosis-sessions, terminology)
│  ├─ src/services/         # Server-side helpers
│  └─ sample_bundle.json
├─ scripts/                 # Data + setup scripts (Supabase load, table verify, etc.)
├─ supabase/                # Migrations + generated metadata
├─ public/ & build/         # Static assets / production build output
└─ README.md
```

## 🧪 Key Frontend Modules

| Module | Purpose |
|--------|---------|
| `components/GovHeaderBar.jsx` | Government style top ribbon (branding) |
| `components/ui/Header.jsx` | App nav bar (now light blue + dark mode aware) |
| `pages/clinical-diagnosis-entry/components/SearchInput.jsx` | Debounced terminology search + suggestions |
| `pages/clinical-diagnosis-entry/components/ProblemList.jsx` | Interactive problem list (dual code display) |
| `pages/clinical-diagnosis-entry/components/PatientContext.jsx` | Patient create/update + status badges |
| `pages/clinical-diagnosis-entry/components/PatientRecords.jsx` | Saved diagnosis sessions (auto-refresh) |
| `services/fhirService.js` | Legacy FHIR + session creation logic |
| `contexts/ThemeContext.jsx` | Dark/light theme provider |

## 🌗 Dark Mode

Implemented using Tailwind `darkMode: 'class'` + CSS variable swapping:
1. Variables defined in `src/styles/tailwind.css` under `:root` and `.dark`.
2. `ThemeProvider` toggles `<html class="dark">`.
3. Header adapts gradient with `dark:` utility variants.

To add new semantic colors: extend CSS vars then map in `tailwind.config.js`.

## 🗃️ Data & Persistence Flow

1. User enters patient info → clicks Save (POST /api/v1/patients) → patient id assigned.
2. User searches & adds diagnoses (NAMASTE + optional ICD‑11 mapping).
3. On Save to Patient Record: creates FHIR-like bundle + diagnosis session payload → POST /api/v1/diagnosis-sessions.
4. `recordsRefreshCounter` triggers records fetch display instantly.

## 🔍 Terminology Search

Enhanced search component uses:
- Debounce timer (≈300ms) to limit API calls
- AbortController to cancel stale requests
- Highlighted substring matches for readability
- Accessible ARIA listbox semantics

## 🧪 Scripts (Selected)

| Script | Command | Purpose |
|--------|---------|---------|
| `checkSupabaseConnection.mjs` | node scripts/checkSupabaseConnection.mjs | Validate DB connectivity |
| `create-tables.js` | node scripts/create-tables.js | Manual table creation |
| `loadActualData.mjs` | node scripts/loadActualData.mjs | Load seed terminology into Supabase |
| `populateSnomedLoincData.mjs` | node scripts/populateSnomedLoincData.mjs | Bridge dataset population |
| `createAndLoadData.mjs` | node scripts/createAndLoadData.mjs | End‑to‑end bootstrap |

## 🔑 Supabase Setup

1. Retrieve `service_role` key (see `GET_SERVICE_KEY_INSTRUCTIONS.md`).
2. Configure `.env` (frontend + server) with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
3. Run migrations / load data:
```bash
node scripts/createAndLoadData.mjs
```

## ⚕️ FHIR / Interop Layer

Minimal FHIR adapter currently supports:
- Bundle creation (legacy transaction style)
- Concept translation placeholders
- Future extension: deploy real conformant R4 endpoints behind `/fhir` (see `server/FHIR_README.md`).

## ▶️ Development

Install and run both frontend & server (two terminals recommended):
```bash
# Frontend
npm install
npm start

# Backend
cd server
npm install
npm run dev
```

Preview production build:
```bash
npm run build
npm run serve
```

## 🧪 Testing (Server)
```bash
cd server
npm test
```

## 🔐 Prototype Resilience

If API key generation fails, UI produces a dummy key so the flow is not blocked during demos.

## 🛡️ Security & Hardening (Planned / Partial)
- Rate limiting & helmet configured on server
- Add JWT auth for internal admin endpoints (future)
- Enhance audit logging for clinical writes

## 🗺️ Roadmap (Next Steps)
- Replace legacy bundle creation with full FHIR operation set
- Add granular field validation + toasts on patient form
- Global text/branding finalization (ensure no stale references)
- Session detail drill-down & editing
- Role-based access (clinician vs admin)

## 🤝 Attribution
Powered by Team InterOpX. Original concept aligned with AYUSH digital terminology modernization goals.

## 📄 License
MIT (see server package metadata; add root LICENSE file if needed).

## ☁️ Deployment (Vercel)

This project can be deployed to Vercel using the included `vercel.json`.

### Build Targets
- React frontend: static build (`npm run build`) outputs to `build/`.
- Serverless API: Express app exported from `server/src/app.js` handles `/api/*` & `/fhir/*`.

### Steps
1. Push repository to GitHub/GitLab and import into Vercel.
2. In Vercel Project Settings:
	- Build Command: `npm run build`
	- Output Directory: `build`
3. Add Environment Variables (Production & Preview):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FHIR_BASE_URL=https://<your-domain>/fhir
RATE_LIMIT_MAX_REQUESTS=150
RATE_LIMIT_WINDOW_MS=900000
CORS_ALLOWED_ORIGINS=https://<your-domain>
```
4. Deploy (Vercel will create a preview URL).
5. Test endpoints:
	- `GET /health`
	- `GET /api/v1/terminology/search?q=test`
	- `GET /fhir/metadata`

### Local Production Simulation
```bash
npm run build
npm run serve
```

### Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 404 on /api routes | `vercel.json` missing | Ensure file at repo root and redeploy |
| CORS errors | Origin mismatch | Set `CORS_ALLOWED_ORIGINS` env |
| Slow first API call | Cold start | Warm by pinging `/health` periodically |
| Cron tasks not running | Serverless limitation | Move cron to external worker (GitHub Action) |

### Post-Deploy Checklist
- [ ] Dark mode toggle works
- [ ] Patient create + session save updates list instantly
- [ ] Terminology search suggestions appear quickly
- [ ] FHIR endpoints reachable

