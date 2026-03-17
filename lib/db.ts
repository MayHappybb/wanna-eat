import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/app.db';
const dbDir = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize schema
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User status table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      location TEXT,
      location_visible INTEGER NOT NULL DEFAULT 1,
      willing_to_eat INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Food preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS food_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      restaurant_name TEXT NOT NULL,
      priority_order INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Eating records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS eating_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_name TEXT NOT NULL,
      ate_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Eating participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS eating_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eating_record_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (eating_record_id) REFERENCES eating_records(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_statuses_user_id ON user_statuses(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_food_preferences_user_id ON food_preferences(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_eating_participants_record_id ON eating_participants(eating_record_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages(sent_at)`);
}

export default db;
