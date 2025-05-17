import { useState, useEffect, useRef } from "react";
import "./App.css";

import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message || "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response && !response.error && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const sqlPart = response?.sql || "";
  const explanationPart = response?.explanation || "";
  const resultData = Array.isArray(response?.rows) ? response.rows : [];

  let chartType = null;
  if (resultData.length > 0) {
    const keys = Object.keys(resultData[0]);
    if (keys.length === 2) {
      const [x, y] = keys;
      if (typeof resultData[0][x] === "string" && typeof resultData[0][y] === "number") {
        chartType = "bar";
      } else if (typeof resultData[0][x] === "number" && typeof resultData[0][y] === "number") {
        chartType = "line";
      }
    }
  }

  const sampleQuestions = [
    "Which product category caused most refunds in Q3?",
    "Did increased marketing spend increase revenue?",
    "Which region has the worst profit margin?",
    "Which region saw the highest sales in 2024?",
    "Where is sales-to-cost ratio lowest?",
  ];

  return (
    <div className="container" style={styles.container}>
      <img src="/assets/logo.png" alt="BizQuery AI Logo" className="logo" style={styles.logo} />
      <h1 className="title" style={{ color: "#db00ff" }}>Hello, What can I help you with?</h1>

      <div className="chatBox" style={styles.chatBox}>
        <input
          type="text"
          placeholder="How much did each customer spend overall?......"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input"
          style={styles.input}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          style={styles.button}
          className="ask-btn"
          disabled={loading}
        >
          {loading ? "Thinking..." : "ASK"}
        </button>
        {loading && <div className="spinner" style={styles.spinner} />}
      </div>

      <div style={styles.samples}>
        <h3>Try Sample Questions:</h3>
        <div style={styles.sampleList}>
          {sampleQuestions.map((sampleQ, idx) => (
            <button
              key={idx}
              style={styles.sampleBtn}
              onClick={() => setQuestion(sampleQ)}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#483d8b")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#6a5acd")}
            >
              {sampleQ}
            </button>
          ))}
        </div>
      </div>

      {response && !response.error && (
        <div ref={resultRef} className="response-box" style={styles.response}>
          <h3>SQL Query:</h3>
          <pre className="sql-line">{sqlPart}</pre>

          <h3>Explanation:</h3>
          <p style={{ textAlign: "justify" }}>{explanationPart}</p>

          <h3>Result:</h3>

          {chartType && resultData.length > 0 ? (
            <div style={{ marginBottom: "2rem" }}>
              <h3>Chart:</h3>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === "bar" ? (
                  <BarChart data={resultData}>
                    <XAxis dataKey={Object.keys(resultData[0])[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={Object.keys(resultData[0])[1]} fill="#8884d8" />
                  </BarChart>
                ) : (
                  <LineChart data={resultData}>
                    <XAxis dataKey={Object.keys(resultData[0])[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={Object.keys(resultData[0])[1]} stroke="#8884d8" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ fontStyle: "italic" }}>Chart unavailable for this result.</p>
          )}

          {resultData.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  {Object.keys(resultData[0]).map((col) => (
                    <th key={col} style={styles.th}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultData.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} style={styles.td}>
                        {val !== null ? val.toString() : "NULL"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No results found.</p>
          )}
          <button style={styles.clearBtn} onClick={() => { setResponse(null); setQuestion(""); }}>
            Clear
          </button>
        </div>
      )}

      {response?.error && (
        <div style={styles.errorBox}>
          ⚠️ Error: {response.error}
          <button
            onClick={() => {
              setResponse(null);
              setQuestion("");
            }}
            style={styles.clearBtn}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 40,
    fontFamily: "Arial",
    textAlign: "center",
    marginTop: 50,
    color: "#fff",
  },
  logo: {
    width: "20rem",
    height: "auto",
  },
  chatBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: 20,
  },
  input: {
    width: "60%",
    height: "50px",
    padding: 10,
    fontSize: "16px",
    borderRadius: "20px",
    border: "2px solid white",
    backgroundColor: "transparent",
    color: "#fff",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "10px",
    background: "linear-gradient(90deg, #ff00cc, #333399)",
    border: "none",
    color: "white",
    fontWeight: "600",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "4px solid #999",
    borderTop: "4px solid #db00ff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  samples: {
    marginTop: 20,
    textAlign: "center",
    maxWidth: 900,
    marginLeft: "auto",
    marginRight: "auto",
  },
  sampleList: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px",
  },
  sampleBtn: {
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#6a5acd",
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
    minWidth: "200px",
    textAlign: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    transition: "background-color 0.3s",
  },
  response: {
    marginTop: 30,
    backgroundColor: "#f4f4f4",
    color: "#000",
    padding: 20,
    borderRadius: "10px",
  },
  table: {
    margin: "0 auto",
    borderCollapse: "collapse",
  },
  th: {
    border: "1px solid #ddd",
    padding: "8px",
    backgroundColor: "#f2f2f2",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px",
  },
  errorBox: {
    color: "#a94442",
    backgroundColor: "#f2dede",
    border: "1px solid #ebccd1",
    borderRadius: "5px",
    padding: "10px 15px",
    marginTop: 20,
    maxWidth: "600px",
    marginLeft: "auto",
    marginRight: "auto",
    fontWeight: "bold",
  },
  clearBtn: {
    marginTop: 20,
    marginLeft: 10,
    cursor: "pointer",
    borderRadius: "5px",
    padding: "5px 10px",
    border: "none",
    background: "#a94442",
    color: "white",
  }
};

export default App;
