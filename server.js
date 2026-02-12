const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("AI Stylist Backend Running");
});

app.post("/analyze", upload.single("image"), async (req, res) => {

  // For now returning demo response
  res.json({
    suggestions: [
      "Try pairing this with white sneakers.",
      "Add structured outerwear.",
      "Neutral accessories will enhance this look."
    ]
  });

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
