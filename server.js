require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   Create Upload Folder
========================= */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* =========================
   Multer Config
========================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

/* =========================
   Routes
========================= */

app.get("/", (req, res) => {
  res.send("AI Stylist Backend Running 🚀");
});

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePath = req.file.path;

    // Convert image to base64
    const imageBase64 = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    /* =========================
       Call AI API
    ========================= */

    const aiResponse = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "You are a professional fashion stylist. Analyze the clothing in this image and give: 1) Style description 2) Color suggestions 3) Outfit improvements 4) Occasion suitability",
              },
              {
                type: "input_image",
                image_base64: imageBase64,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const suggestions =
      aiResponse.data.output[0].content[0].text ||
      "No suggestions returned.";

    res.json({
      success: true,
      suggestions: suggestions,
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: "AI processing failed",
    });
  }
});

/* =========================
   404 Handler
========================= */

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =========================
   Start Server
========================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
