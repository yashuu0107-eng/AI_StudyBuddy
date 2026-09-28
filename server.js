require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const materialRoutes = require("./src/routes/materials");
const { notFound, errorHandler } = require("./src/middleware/error");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/api/materials", materialRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`StudyBuddy running on http://localhost:${PORT}`));
});
