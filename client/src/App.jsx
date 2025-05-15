import { useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:5000/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setResponse(data.answer);
  };

  // Split response into SQL and Explanation parts safely
  const [sqlPart, explanationPart] = response
    ? response.split("Explanation:")
    : ["", ""];

  return (
    <div className="container" style={styles.container}>
      <img
        src="../assets/logo.png"
        alt=""
        className="logo"
        style={styles.logo}
      />
      <h1 className="title">Hello, What can I help you with?</h1>

      <div className="chatBox" style={styles.chatBox}>
        <input
          type="text"
          placeholder="How much did each customer spend overall?......"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="input"
          style={styles.input}
        />
        <button
          onClick={handleSubmit}
          style={styles.button}
          className="ask-btn"
        >
          Ask
        </button>
      </div>
      {response && (
        <div className="response-box" style={styles.response}>
          <h3>Answer:</h3>
          <div style={{ textAlign: "justify", color: "black" }}>
            <p>
              <strong>SQL: </strong>
              <pre className="sql-line">
                {sqlPart.replace("SQL:", "").trim()}
              </pre>
            </p>
            <p style={{ marginTop: 15, textAlign: "justify" }}>
              <strong>Explanation: </strong>
              {explanationPart?.trim()}
            </p>
          </div>
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
    border: "1px solid white",
    borderRadius: "40px",
    marginTop: 50,
  },
  logo: {
    width: "20rem",
    height: "auto",
  },
  chatBox: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: 20,
    color: "white",
  },
  input: {
    width: "60%",
    height: "50px",
    padding: 10,
    fontSize: "16px",
    borderRadius: "20px",
    border: "2px solid white",
    backgroundColor: "transparent",
    color: "#ffff",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "10px",
  },
  response: {
    marginTop: 30,
    backgroundColor: "#f4f4f4",
    padding: 20,
    borderRadius: "10px",
  },
};

export default App;
