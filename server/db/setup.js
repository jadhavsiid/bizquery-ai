// === setup.js ===
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

if (fs.existsSync("./bizquery.db")) {
  fs.unlinkSync("./bizquery.db");
}

const db = new sqlite3.Database("./bizquery.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      price REAL
    );
  `);

  db.run(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT
    );
  `);

  db.run(`
    CREATE TABLE regions (
      id INTEGER PRIMARY KEY,
      name TEXT,
      manager TEXT
    );
  `);

  db.run(`
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      product_id INTEGER,
      xx23 REAL,
      "123sales" REAL,
      date TEXT,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );
  `);

  const insertSales = db.prepare(`
    INSERT INTO sales (customer_id, product_id, xx23, "123sales", date)
    VALUES (?, ?, ?, ?, ?);
  `);

  insertSales.run(1, 1, 123.45, 200.5, "2024-01-01");
  insertSales.run(2, 2, 300, null, "2024-01-10");
  insertSales.run(1, 3, 400, 500, "not_a_date");
  insertSales.run(3, 1, null, 600, "2024-02-20");

  insertSales.finalize();
});

db.close();
console.log("Database setup complete. Tables created and sample data inserted.");