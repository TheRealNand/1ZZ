import Database from "better-sqlite3";

const db = new Database("server/1zz.db");

db.pragma("journal_mode = WAL");

db.prepare(`
  CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    rate REAL NOT NULL
  )
`).run();

export function saveObservation(timestamp, rate) {
  db.prepare(`
    INSERT INTO observations (timestamp, rate)
    VALUES (?, ?)
  `).run(timestamp, rate);
}

export function getObservations() {
  return db.prepare(`
    SELECT timestamp, rate
    FROM observations
    ORDER BY timestamp ASC
  `).all();
}