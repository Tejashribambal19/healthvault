# HealthVault — Frontend

React 18 + Vite single-page app for the HealthVault Digital Health Record system.
Talks to a separate Express + PostgreSQL backend over REST.

## Open this in VS Code
```bash
code .
```
VS Code will prompt you to install the recommended extensions
(ESLint, Prettier, React snippets) — accept that, then:

## Run it

```bash
npm install
cp .env.example .env     # point VITE_API_URL at your backend, default http://localhost:5000/api
npm run dev               # http://localhost:5173
```

The backend must be running separately for login/records/chatbot to work —
see the backend repo's README for setup.

## Project structure

```
src/
├── main.jsx              Entry point
├── App.jsx                Routes + role guards
├── services/api.js        Every backend call goes through here
├── context/AuthContext.jsx  Global login state (JWT)
├── styles/                 CSS variables + global styles
├── components/
│   ├── layout/             Sidebar, Topbar, AppLayout
│   └── ui/                 Badge, Modal, StatCard, Icons, RecordItem
└── pages/                  One file per screen (Login, Dashboard, Records, etc.)
```

## Push this to your own GitHub repo

This folder is already a git repository with an initial commit. To push it to
your own GitHub:

```bash
# 1. Create an empty repo on GitHub first (no README/license), then:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

If you ever need to start the git history over:
```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit — HealthVault frontend"
```

## Tech Stack
React 18 · React Router 6 · Axios · Vite
