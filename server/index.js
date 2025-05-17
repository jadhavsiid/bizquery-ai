const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { generatePrompt } = require("./utils/promptTemplate");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: ["https://bizquery-ai.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database("./db/bizquery.db", (err) => {
  if (err) {
    console.error("❌ Error connecting to SQLite:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

function sanitizeQuestion(question) {
  if (typeof question !== "string") return "";
  question = question.trim();
  if (question.length > 300) return "";

  // Remove unsafe characters
  const unsafeChars = /[`"'\\;]/g;
  return question.replace(unsafeChars, "");
}

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

app.post("/api/ask", async (req, res) => {
  let { question } = req.body;
  question = sanitizeQuestion(question);

  if (!question) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or too long question." });
  }

  const prompt = generatePrompt(question);
  console.log("📥 Prompt:", prompt);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bizquery-ai.vercel.app",
        "X-Title": "bizquery-ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res
        .status(500)
        .json({ success: false, error: "No response from AI." });
    }

    const answer = data.choices[0].message.content;

    let sql = "", explanation = "";

    try {
      const parsed = JSON.parse(answer);
      sql = parsed.sql?.trim();
      explanation = parsed.explanation?.trim();

      if (!sql) {
        return res.status(400).json({
          success: false,
          error: "AI returned an invalid SQL field.",
          raw: answer,
        });
      }
    } catch (parseErr) {
      console.error("❌ JSON Parsing Error:", parseErr);
      return res.status(500).json({
        success: false,
        error: "Could not parse JSON from AI response.",
        raw: answer,
      });
    }

    // Add date filter if missing
    if (!/date\s+(=|>=|<=|>|<|GLOB|LIKE)/i.test(sql)) {
      if (/WHERE/i.test(sql)) {
        sql = sql.replace(/WHERE/i, "WHERE date GLOB '????-??-??' AND");
      } else if (/(GROUP BY|ORDER BY|LIMIT)/i.test(sql)) {
        sql = sql.replace(
          /(GROUP BY|ORDER BY|LIMIT)/i,
          "WHERE date GLOB '????-??-??' $1"
        );
      } else {
        sql += "\nWHERE date GLOB '????-??-??'";
      }
    }

    const rows = await runQuery(sql);
    res.json({ success: true, sql, explanation, rows });
  } catch (err) {
    console.error("💥 Full Error:", err);
    res.status(500).json({ success: false, error: "Server error. Try again." });
  }
});

// Start server once
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
