const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database("./bizquery.db", (err) => {
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

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  console.log("📥 Received question:", question);

  const prompt = `
You are a business analyst and SQL expert.

Given the following schema:
- products(id INTEGER, name TEXT, price REAL)
- customers(id INTEGER, name TEXT, email TEXT, regn TEXT, age INTEGER, status TEXT, last_transaction_date TEXT)
- regions(id INTEGER, name TEXT, manager TEXT)
- sales(id INTEGER, customer_id INTEGER, product_id INTEGER, xx23 REAL, "123sales" REAL, date TEXT)

Answer this vague business question by generating a SQL query and explaining the result in plain English.

Question: "${question}"

Please respond like:
SQL:
\`\`\`sql
-- your SQL query here
\`\`\`

Explanation:
-- your explanation here
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173", // Update this if deployed
        "X-Title": "bizquery-ai",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: data.error?.message || "No response from AI" });
    }

    const answer = data.choices[0].message.content;
    console.log("🤖 AI raw answer:\n", answer);

    const sqlMatch = answer.match(/SQL:\s*```(?:sql)?\s*([\s\S]*?)```/i);
    const explanationMatch = answer.match(/Explanation:\s*([\s\S]*)/i);

    let sql = sqlMatch ? sqlMatch[1].trim() : "";
    const explanation = explanationMatch ? explanationMatch[1].trim() : "";

    if (!sql) {
      return res.status(400).json({ error: "Could not parse SQL from AI response.", raw: answer });
    }

    // Add a default date filter if missing
    const hasDateFilter = /date\s+(=|>=|<=|>|<|GLOB|LIKE)/i.test(sql);
    if (!hasDateFilter) {
      if (sql.match(/WHERE/i)) {
        sql = sql.replace(/WHERE/i, "WHERE date GLOB '????-??-??' AND");
      } else if (sql.match(/GROUP BY|ORDER BY|LIMIT/i)) {
        sql = sql.replace(/(GROUP BY|ORDER BY|LIMIT)/i, "WHERE date GLOB '????-??-??' $1");
      } else {
        sql += "\nWHERE date GLOB '????-??-??'";
      }
    }

    console.log("🛠️ Modified SQL:\n", sql);

    try {
      const rows = await runQuery(sql);
      res.json({
        sql,
        explanation,
        rows,
      });
    } catch (dbErr) {
      console.error("💥 DB Error:", dbErr);
      res.status(500).json({ sql, explanation, rows: [], error: dbErr.message });
    }
  } catch (err) {
    console.error("💥 AI Request Error:", err);
    res.status(500).json({ error: "AI Service Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
