const db = require('./connect');

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("SQL Error:", err.message);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

module.exports = runQuery;
