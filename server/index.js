require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { runQuery } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working! 🔥" });
});

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;
  console.log("Received question:", question);

  const prompt = `
You are a business analyst and SQL expert.

Given the following schema:
- sales(id, col_1, xx23, "123sales", date)
- customers(id, name, regn)
- products(id, name, price)

Answer this vague business question by generating a SQL query and explaining the result in plain English.

Question: "${question}"

Respond like:
SQL:
\`\`\`
-- SQL goes here
\`\`\`

Explanation:
-- Your explanation goes here
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
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
    console.log("AI raw answer:\n", answer);

    const sqlMatch = answer.match(/SQL:\s*```(?:sql)?\s*([\s\S]*?)```/i);
    const explanationMatch = answer.match(/Explanation:\s*([\s\S]*)/i);
    let sql = sqlMatch ? sqlMatch[1].trim() : "";
    const explanation = explanationMatch ? explanationMatch[1].trim() : "";

    if (!sql) {
      return res.status(400).json({ error: "Could not parse SQL from AI response.", raw: answer });
    }

    // Replace schema mismatches (AI may assume "amt" and "dt")
    sql = sql
      .replace(/\bs\.amt\b/g, "s.xx23")
      .replace(/\bs\.dt\b/g, "s.date")
      .replace(/\bamt\b/g, "xx23")
      .replace(/\bdt\b/g, "date");

    // Inject proper date validation
    if (sql.includes("WHERE")) {
      sql = sql.replace(/WHERE/i, "WHERE date GLOB '????-??-??' AND");
    }

    console.log("Modified SQL:", sql);

    try {
      const rows = await runQuery(sql);
      res.json({ sql, explanation, result: rows });
    } catch (dbErr) {
      console.error("DB Error:", dbErr);
      res.status(500).json({ sql, explanation, result: [], error: dbErr.message });
    }
  } catch (err) {
    console.error("AI Request Error:", err);
    res.status(500).json({ error: "AI Service Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
