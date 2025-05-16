# 🧠 BizQuery AI – Architecture Documentation

BizQuery AI is a full-stack AI-powered business analytics tool that converts natural language questions into SQL queries, runs them on a local database, and visualizes the results using interactive charts.

---

## 🧱 Tech Stack

### Frontend
- **React (Vite)**
- **TailwindCSS** for UI
- **Recharts** for data visualization

### Backend
- **Node.js + Express**
- **SQLite** for simplicity (local `.db` file)
- **OpenRouter.ai API** for AI-generated SQL & explanations

---

## 🧾 Prompt Design

### Strategy
We construct prompts like:
- Which product category caused most refunds in Q3?
- Did increased marketing spend increase revenue?
- Which region has the worst profit margin?
- Which region saw the highest sales in 2024?
- Which region saw the highest sales in 2024?


### Special Considerations
- Includes **dirty column names** like `xx23`, `123sales`
- Prompt may include **contextual clues** about column purposes
- Few-shot prompting is used occasionally for guiding structure

---

## 🛠️ SQL Execution Flow

1. Backend receives SQL from the AI agent
2. Uses a **helper function** to safely run SQL on the `bizquery.db`
3. Uses **parameterized queries** to prevent injection (optional but recommended)
4. On error, sends back a user-friendly message + stack trace if debugging

---

## 📊 Visualization Logic

Once SQL and explanation are received:
1. **Raw data** is returned and parsed on frontend
2. AI also outputs **suggested chart type** (bar, line, pie)
3. Based on data structure:
    - Key–value → Pie Chart
    - Time-series → Line Chart
    - Categorical groups → Bar Chart
4. Chart is rendered using **Recharts**

---

## 🧼 Handling Dirty Schema & Vague Queries

### Dirty Schema Challenges
- Non-intuitive column names like:
  - `xx23`
  - `123sales`
  - `regn` instead of `region`
- AI is prompted with **exact schema** to learn column meanings

### Vague Query Handling
- Questions like *"How did Q4 perform in South?"* are mapped to:
    - Time filter (`date` field)
    - Region mapping via joins
- AI's natural language reasoning enables it to:
    - Join related tables correctly
    - Apply time filters
    - Derive groupings

---

## 🧪 Sample Query Behavior

| User Question | What AI Does |
|---------------|--------------|
| "Show me sales by region in the last quarter" | Joins `sales`, `customers`, `regions`, groups by region |
| "Which product sold the most in Q3?" | Filters date for Q3, groups by product_id |
| "Compare performance across all age groups" | Joins `customers`, aggregates on `age` groupings |

---
Ask About Unnamed/Dirty Columns
Examples:

“How much xx23 did we sell last year?”

“Is 123sales improving?”

These should test:

Whether the prompt-to-SQL mapping accounts for weird column names

Whether your schema description in prompt is clear enough

🔹 3. Ask with Typos
Examples:

“Show sales by ragion” → should infer region

“Cuustomer age trends” → should catch customer

Watch for:

How robust your LLM is with OpenRouter (Claude/OpenAI) in fuzzy matching

Whether you get fallback errors or hallucinations
### Final Prompt Testing

| Prompt | SQL | Result | Notes |
|--------|-----|--------|-------|
| What happened in March? | ✅ | ✅ | Good default to sales |
| Cuustomers by ragion | ✅ | ✅ | SQL error - fix prompt injection |
| Show 123sales by region | ✅ | ✅ | Works with dirty column |

## 🗂️ Future Enhancements
- Let AI return **chart config JSON** directly
- Add **prompt templates** per query category
- Build **feedback loop** to fix bad SQL or visual mismatches

---
