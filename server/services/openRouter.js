// services/callOpenRouter.js
const fetch = require("node-fetch");

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // milliseconds

async function callOpenRouter(prompt, model = "openai/gpt-3.5-turbo") {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://bizquery-ai.vercel.app",
    "X-Title": "bizquery-ai",
  };

  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("No valid response from OpenRouter");
      }

      return data.choices[0].message.content;

    } catch (error) {
      const errorMsg = error.message || "Unknown error";

      const isOverload = errorMsg.toLowerCase().includes("overloaded");
      const isLastAttempt = attempt === MAX_RETRIES;

      if (isOverload && !isLastAttempt) {
        console.warn(`⚠️ Attempt ${attempt} failed due to overload. Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error(`❌ OpenRouter API failed on attempt ${attempt}:`, errorMsg);

        // Friendly message on final failure
        throw new Error(
          isOverload
            ? "Oops! Our AI is a bit overwhelmed right now. Please try again in a moment."
            : `OpenRouter API error: ${errorMsg}`
        );
      }
    }
  }
}

module.exports = callOpenRouter;
