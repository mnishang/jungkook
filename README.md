# StudyBuddy — Online Study Buddy Platform

A multi-page React + TypeScript + Vite frontend inspired by the supplied UI reference. The interface uses a warm **dark brown, orange, and cream** palette, a fixed left navigation sidebar, compact top bar, rounded cards, and consistent page layouts.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

## Project structure

```text
studybuddy-full-react/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── PageHeader.tsx
│   │   └── UI.tsx
│   ├── context/
│   │   └── StudyBuddyContext.tsx
│   ├── lib/
│   │   └── data.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── FindBuddy.tsx
│   │   ├── StudyGroups.tsx
│   │   ├── StudySessions.tsx
│   │   ├── NotesResources.tsx
│   │   ├── MyTasks.tsx
│   │   ├── StudyTimer.tsx
│   │   ├── Messages.tsx
│   │   ├── QA.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Settings.tsx
│   │   ├── Landing.tsx
│   │   └── Login.tsx
│   ├── style/
│   │   └── global.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

## Note
This is a frontend starter with sample content and local UI interactions. Authentication, persistent database storage, real-time chat, file uploads, and video meeting integrations need a backend/service connection.
