import type Database from "better-sqlite3"

const statements = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT NOT NULL,
    label TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS profiles_alias_unique ON profiles(alias)`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    auth_token TEXT NOT NULL,
    valid INTEGER,
    last_verified_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS sessions_profile_unique ON sessions(profile_id)`,
  `CREATE TABLE IF NOT EXISTS electricity_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    area_code TEXT NOT NULL,
    ele_customer_id TEXT NOT NULL,
    metering_point_id TEXT NOT NULL,
    metering_point_number TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL,
    user_name TEXT NOT NULL,
    refreshed_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS accounts_profile_account_unique ON electricity_accounts(profile_id, account_number)`,
  `CREATE INDEX IF NOT EXISTS accounts_profile_idx ON electricity_accounts(profile_id)`,
  `CREATE TABLE IF NOT EXISTS balance_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    balance REAL NOT NULL,
    arrears REAL NOT NULL,
    queried_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS balances_profile_account_idx ON balance_snapshots(profile_id, account_number)`,
  `CREATE TABLE IF NOT EXISTS usage_months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_total_cost REAL,
    month_total_kwh REAL,
    ladder INTEGER,
    ladder_start_date TEXT,
    ladder_remaining_kwh REAL,
    tariff REAL,
    queried_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS usage_month_profile_account_month_unique ON usage_months(profile_id, account_number, year, month)`,
  `CREATE TABLE IF NOT EXISTS usage_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usage_month_id INTEGER NOT NULL REFERENCES usage_months(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    charge REAL NOT NULL,
    kwh REAL NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS usage_days_month_date_unique ON usage_days(usage_month_id, date)`,
  `CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    profile_alias TEXT,
    account_number TEXT,
    status TEXT NOT NULL,
    summary TEXT,
    error TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS operation_logs_created_idx ON operation_logs(created_at)`,
  `CREATE TABLE IF NOT EXISTS auth_user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL,
    image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    username TEXT UNIQUE,
    display_username TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS auth_session (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS auth_account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS jwks (
    id TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER
  )`,
]

export function runMigrations(sqlite: Database.Database) {
  sqlite.pragma("foreign_keys = ON")
  const migrate = sqlite.transaction(() => {
    for (const statement of statements) {
      sqlite.prepare(statement).run()
    }
  })
  migrate()
}
