const { GoogleGenAI } = require("@google/genai");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
let client;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    const e = new Error("GEMINI_API_KEY is not set in .env");
    e.status = 500;
    throw e;
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

async function ask(prompt, { json = false } = {}) {
  try {
    const res = await getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: json ? { responseMimeType: "application/json" } : undefined,
    });
    const text = res.text;
    if (!json) return text;
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    if (err.status && err.message.startsWith("GEMINI_API_KEY")) throw err;
    const e = new Error("Gemini request failed: " + err.message);
    e.status = 502;
    throw e;
  }
}

const base = (material, level) =>
  `You are StudyBuddy, a friendly tutor. Learner level: ${level}.\n` +
  `Use ONLY the study material below.\n\nTITLE: ${material.title}\n\nMATERIAL:\n${material.content}\n\n`;

exports.summary = (m, { level = "beginner" } = {}) =>
  ask(base(m, level) + "Write a clear summary: a short overview, then key points as bullets, then key terms with one-line definitions.");

exports.flashcards = (m, { level = "beginner", count = 10 } = {}) =>
  ask(
    base(m, level) +
      `Create ${count} flashcards. Return ONLY a JSON array: [{"front": "question or term", "back": "answer or definition"}]`,
    { json: true }
  );

exports.quiz = (m, { level = "beginner", count = 5, difficulty = "medium" } = {}) =>
  ask(
    base(m, level) +
      `Create a ${difficulty} multiple-choice quiz with ${count} questions. Return ONLY a JSON array: ` +
      `[{"question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..."}]`,
    { json: true }
  );

exports.studyPlan = (m, { level = "beginner", days = 7, minutesPerDay = 45 } = {}) =>
  ask(
    base(m, level) +
      `Build a ${days}-day study plan at about ${minutesPerDay} minutes per day. Return ONLY a JSON array: ` +
      `[{"day": 1, "focus": "...", "tasks": ["..."], "review": "..."}]`,
    { json: true }
  );
