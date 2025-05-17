const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { generatePrompt } = require("./utils/promptTemplate");
const sqlite3 = require("sqlite3").verbose();

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['https://bizquery-ai.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Routes
const askRoute = require("./routes/ask");
app.use("/api", askRoute);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


function sanitizeQuestion(question) {
  if (typeof question !== "string") return "";

  // Trim whitespace
  question = question.trim();

  // Limit length
  if (question.length > 300) {
    return "";
  }

  // Basic sanitization – remove problematic characters
  const unsafeChars = /[`"'\\;]/g;
  question = question.replace(unsafeChars, "");

  return question;
}

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
    console.error("Error connecting to SQLite:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function buildPrompt(question) {
  return `
You are a business analyst and SQL expert.

Schema:
- products(id INTEGER, name TEXT, price REAL)
- customers(id INTEGER, name TEXT, email TEXT, regn TEXT, age INTEGER, status TEXT, last_transaction_date TEXT)
- regions(id INTEGER, name TEXT, manager TEXT)
- sales(id INTEGER, customer_id INTEGER, product_id INTEGER, xx23 REAL, "123sales" REAL, date TEXT)

Generate a SQL query for:
"${question}"

Respond like:
SQL:
\`\`\`sql
-- SQL query
\`\`\`

Explanation:
-- Explanation
  `;
}

app.post("/api/ask", async (req, res) => {
  let { question } = req.body;
  question = sanitizeQuestion(question);

  if (!question || typeof question !== "string" || question.length > 300) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or too long question." });
  }

  const prompt = generatePrompt(question);
  console.log("Prompt:", prompt);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
      }
    );

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


    // Add a default date filter if not present
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
    console.error("💥 Error:", err.message);
    res.status(500).json({ success: false, error: "Server error. Try again." });
  }
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
