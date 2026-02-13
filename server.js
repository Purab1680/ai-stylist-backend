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

const upload = multer({ storage });

/* =========================
   Health Route
========================= */

app.get("/", (req, res) => {
  res.send("AI Stylist Backend Running 🚀");
});

/* =========================
   Upload + AI Vision
========================= */

app.post("/upload", upload.single("image"), async (req, res) => {
  console.log("=== UPLOAD ROUTE HIT ===");

  try {
    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({ error: "No image uploaded" });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY MISSING");
      return res.status(500).json({ error: "API key not configured" });
    }

    console.log("File received:", req.file.filename);

    const imagePath = req.file.path;

    const imageBase64 = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    console.log("Calling OpenAI Vision...");

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
                text: `
You are a professional fashion stylist.

Analyze this person's outfit carefully and provide:

1. Detailed style description
2. Color analysis
3. Specific improvement suggestions
4. Suitable occasions
5. Overall fashion rating (out of 10)

Be specific to this exact image.
                `,
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

    console.log("OpenAI response received");

    /* =========================
       Extract Text Safely
    ========================= */

    let suggestions = "No suggestions returned.";

    if (
      aiResponse.data &&
      aiResponse.data.output &&
      aiResponse.data.output.length > 0
    ) {
      const contentArray = aiResponse.data.output[0].content;

      for (let item of contentArray) {
        if (item.type === "output_text") {
          suggestions = item.text;
          break;
        }
      }
    }

    res.json({
      success: true,
      suggestions: suggestions,
    });

  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message);

    res.status(500).json({
      error: "AI processing failed",
      details: error.response?.data || error.message,
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
