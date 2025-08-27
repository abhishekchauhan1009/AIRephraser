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

    // Ask GPT for 3 styles
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that always rephrases a given text into 3 distinct styles:
1. Formal
2. Polite
3. Casual

Format the answer exactly as:
Formal: <text>
Polite: <text>
Casual: <text>`,
        },
        {
          role: "user",
          content: `Rephrase this message: "${message}"`,
        },
      ],
      max_tokens: 300,
    });

    let output = response.choices[0].message.content.trim();

    // 🔥 Cleanup duplicate labels (like "Formal: Formal:")
    output = output
      .replace(/Formal:\s*Formal:/gi, "Formal:")
      .replace(/Polite:\s*Polite:/gi, "Polite:")
      .replace(/Casual:\s*Casual:/gi, "Casual:");

    // Parse variations
    const variations = {
      formal:
        output.match(/Formal:\s*(.*)/i)?.[1]?.trim() || "No formal variation",
      polite:
        output.match(/Polite:\s*(.*)/i)?.[1]?.trim() || "No polite variation",
      casual:
        output.match(/Casual:\s*(.*)/i)?.[1]?.trim() || "No casual variation",
    };

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
