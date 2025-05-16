const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open DB (adjust path to your DB file)
const dbPath = path.resolve(__dirname, 'bizquery.db'); // or wherever your .db file is
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to DB:', err.message);
  } else {
    console.log('Connected to SQLite DB.');
  }
});

// Helper to run SQL and return promise with results
function runQuery(sql) {
  return new Promise((resolve, reject) => {
    // For safety, allow only SELECT queries here for now
    if (!sql.trim().toLowerCase().startsWith('select')) {
      return reject(new Error('Only SELECT queries allowed for safety.'));
    }

    db.all(sql, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

module.exports = { runQuery };
