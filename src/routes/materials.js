const express = require("express");
const Material = require("../models/Material");
const Resource = require("../models/Resource");
const gemini = require("../services/gemini");

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function findMaterial(id) {
  const m = await Material.findById(id);
  if (!m) {
    const e = new Error("Material not found");
    e.status = 404;
    throw e;
  }
  return m;
}

// Create material
router.post("/", wrap(async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content are required" });
  res.status(201).json(await Material.create({ title, content }));
}));

// List materials
router.get("/", wrap(async (req, res) => {
  res.json(await Material.find().sort({ createdAt: -1 }).select("-content"));
}));

// Get one material
router.get("/:id", wrap(async (req, res) => res.json(await findMaterial(req.params.id))));

// Delete material and its resources
router.delete("/:id", wrap(async (req, res) => {
  const m = await findMaterial(req.params.id);
  await Resource.deleteMany({ material: m._id });
  await m.deleteOne();
  res.json({ message: "Deleted" });
}));

// Generate helper: asks Gemini, saves result to MongoDB, returns it
const generator = (type, fn) =>
  wrap(async (req, res) => {
    const material = await findMaterial(req.params.id);
    const options = req.body || {};
    const data = await fn(material, options);
    const resource = await Resource.create({ material: material._id, type, options, data });
    res.status(201).json(resource);
  });

router.post("/:id/summary", generator("summary", gemini.summary));
router.post("/:id/flashcards", generator("flashcards", gemini.flashcards));
router.post("/:id/quiz", generator("quiz", gemini.quiz));
router.post("/:id/study-plan", generator("study-plan", gemini.studyPlan));

// List saved resources for a material (optional ?type=quiz)
router.get("/:id/resources", wrap(async (req, res) => {
  const filter = { material: req.params.id };
  if (req.query.type) filter.type = req.query.type;
  res.json(await Resource.find(filter).sort({ createdAt: -1 }));
}));

module.exports = router;
