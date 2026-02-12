const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

/* ===========================
   ROUTES
=========================== */

// Root route (prevents 404 on base URL)
app.get("/", (req, res) => {
  res.status(200).send("AI Stylist Backend Running 🚀");
});

// Upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Dummy AI logic (replace with real AI later)
    const suggestions = {
      skinTone: "Medium",
      recommendedColors: ["Navy Blue", "Olive Green", "Maroon"],
      outfitSuggestion: "Slim-fit navy shirt with beige chinos",
      confidenceScore: "92%",
    };

    res.status(200).json({
      message: "Image uploaded successfully",
      fileName: req.file.filename,
      aiSuggestions: suggestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
