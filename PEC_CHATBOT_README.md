# PEC AI Chatbot - Full Stack Setup Guide

This project matches the **exact tech stack** of the [pec-timetable](https://github.com/aryangoyal2401-dotcom/pec-timetable) repository:
- **Frontend (`pec-bot-client/`)**: React 19 + Vite + React Router + Lucide React + Google Identity Services.
- **Backend (`pec-bot-server/`)**: Node.js + Express + Google Auth Library (`verifyIdToken`) + JWT sessions with `httpOnly` cookies + Syncloop integration ready.
- **Login Design**: Aligned with the layout of [roboticspec.com/login](https://www.roboticspec.com/login/?redirect=%2F).

---

## 📁 Project Structure

```
Minor Project/
├── pec-bot-client/          <-- Frontend (React + Vite, identical to pec-timetable)
│   ├── .env                 <-- VITE_API_URL and VITE_GOOGLE_CLIENT_ID
│   ├── package.json
│   ├── vite.config.js       <-- Proxies /api to http://localhost:3001
│   ├── index.html
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.jsx   <-- RoboticsPEC layout + Google Sign-In button
│       │   └── ChatbotPage.jsx <-- Chat UI with persistent history & New Chat
│       ├── context/AuthContext.jsx
│       └── services/api.js
│
├── pec-bot-server/          <-- Backend (Node + Express)
│   ├── .env                 <-- GOOGLE_CLIENT_ID, JWT_SECRET, SYNCLOOP_API_*
│   ├── package.json
│   └── src/
│       └── index.js         <-- Express server (Auth, Google verification, Chat endpoint)
```

---

## 🔑 1. Configure Credentials & API Keys

### Client Configuration (`pec-bot-client/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

### Server Configuration (`pec-bot-server/.env`):
```env
PORT=3001
JWT_SECRET=super_secret_jwt_key_for_session
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
ALLOWED_EMAIL_DOMAIN=pec.edu.in

# Syncloop API Integration (paste your keys here when received):
SYNCLOOP_API_URL=
SYNCLOOP_API_KEY=
```

---

## 🚀 2. Running Locally

### Step 1: Start Backend Server
```bash
cd "d:\Semester 5\Minor Project\pec-bot-server"
npm run dev
```
Runs at `http://localhost:3001`.

### Step 2: Start Frontend Client
```bash
cd "d:\Semester 5\Minor Project\pec-bot-client"
npm run dev
```
Runs at `http://localhost:5173`.

---

## 🔐 3. Authentication & Features

1. **Restricted Domain**: Only accounts ending with `@pec.edu.in` can authenticate.
2. **RoboticsPEC Styled Login**: Header with logo, centered card, Google prompt, and university footer.
3. **Persistent Chat History**: Chat sessions are stored per user in `localStorage` (`pec_chatbot_sessions_<user_email>`).
4. **Syncloop AI Ready**: When `SYNCLOOP_API_URL` and `SYNCLOOP_API_KEY` are provided in `pec-bot-server/.env`, the server automatically proxies queries to Syncloop and returns answers with citations and document references.
