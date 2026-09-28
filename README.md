# AI StudyBuddy

Paste in study notes and let Google Gemini turn them into a summary, flashcards, a quiz, or a day-by-day study plan. Built with Node.js, Express, MongoDB (Mongoose) and the Gemini API.

## Setup

1. Install Node.js 18+ and MongoDB (local, or a free MongoDB Atlas URI).
2. Get a free API key at https://aistudio.google.com/apikey
3. In this folder:

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# edit .env and paste your GEMINI_API_KEY (and MONGO_URI if not local)
npm run dev
```

Server starts on http://localhost:5000. Open that address in your browser to use the web app.

## Test with Postman

Import `AI-StudyBuddy.postman_collection.json`. Run **Create material** first; it saves `materialId` automatically, then run any Generate request.

## API

| Method | Endpoint | Body (all optional except create) |
|---|---|---|
| POST | /api/materials | `title`, `content` |
| GET | /api/materials | |
| GET | /api/materials/:id | |
| DELETE | /api/materials/:id | |
| POST | /api/materials/:id/summary | `level` |
| POST | /api/materials/:id/flashcards | `level`, `count` |
| POST | /api/materials/:id/quiz | `level`, `count`, `difficulty` |
| POST | /api/materials/:id/study-plan | `level`, `days`, `minutesPerDay` |
| GET | /api/materials/:id/resources?type=quiz | |

`level` is `beginner`, `intermediate` or `advanced`; this is how output gets personalized.

## Structure

```
server.js
public/                   Frontend (index.html, style.css, app.js)
src/config/db.js          MongoDB connection
src/models/               Material, Resource schemas
src/services/gemini.js    Gemini prompts
src/routes/materials.js   REST endpoints
src/middleware/error.js   Error handling
```

## Ideas to extend
User accounts (JWT), PDF upload (multer + pdf-parse), a React frontend, spaced-repetition scheduling.
