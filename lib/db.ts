import Database from "better-sqlite3";

export const DATA_MODE = process.env.DATA_MODE === "demo" ? "demo" : "real";

export const db = new Database(DATA_MODE === "demo" ? "demo.db" : "dev.db");

/**
 * Executes the sql query that generates data, if in demo mode then populate 
 * to demo.db
 * if in real mode then populate to dev.db
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight REAL NOT NULL CHECK (weight > 0)
  );

  CREATE TABLE IF NOT EXISTS periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL UNIQUE,
    end_date TEXT,
    CHECK (end_date IS NULL OR end_date >= start_date)
  );
`);