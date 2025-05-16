const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Remove old DB if exists (optional, for testing)
if (fs.existsSync('./bizquery.db')) {
  fs.unlinkSync('./bizquery.db');
}

const db = new sqlite3.Database('./bizquery.db');

db.serialize(() => {
  // Create Tables
  db.run(`
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY,
      col_1 TEXT,
      xx23 REAL,
      "123sales" REAL,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      price REAL
    )
  `);

  db.run(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT
    )
  `);

  db.run(`
    CREATE TABLE regions (
      id INTEGER PRIMARY KEY,
      name TEXT,
      manager TEXT
    )
  `);

  // Insert dummy + dirty data into `sales`
  const insertSales = db.prepare(`
    INSERT INTO sales (col_1, xx23, "123sales", date) VALUES (?, ?, ?, ?)
  `);

  insertSales.run("Product A", 123.45, 200.5, "2024-01-01");
  insertSales.run(null, 300, null, "2024-01-10");
  insertSales.run("Typo Prduct", 400, 500, "not_a_date");
  insertSales.run("Product B", null, 600, "2024-02-20");

  insertSales.finalize();
});

db.close();
