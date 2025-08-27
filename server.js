import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// __dirname fix (for ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- API Route ----------
app.post("/api/rephrase", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Ask GPT for 3 rephrased versions
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that always rephrases text into 3 distinct styles: Formal, Polite, and Casual. Return them clearly labeled as 1. Formal, 2. Polite, 3. Casual.",
        },
        {
          role: "user",
          content: `Rephrase this message into 3 different styles:\n\n"${message}"`,
        },
      ],
      max_tokens: 300,
    });

    const output = response.choices[0].message.content.trim();

    // Split into variations based on numbering (1. 2. 3.)
    let variations = output
      .split(/\n(?=\d+\.)/)
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    // Fallback: split by new lines if numbering not present
    if (variations.length < 3) {
      variations = output
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Ensure exactly 3 results (Formal, Polite, Casual)
    if (variations.length > 3) {
      variations = variations.slice(0, 3);
    }
    if (variations.length < 3) {
      while (variations.length < 3) {
        variations.push(variations[variations.length - 1] || output);
      }
    }

    res.json({ rephrased: variations });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Failed to rephrase message" });
  }
});

// ---------- Serve Frontend ----------
app.use(express.static(path.join(__dirname, "../frontend")));

// Catch-all route -> index.html
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
