-- Migration: 0001_initial.sql

-- Create User table
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL DEFAULT 'US',
    friends_json TEXT NOT NULL DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Pet table
CREATE TABLE IF NOT EXISTS Pet (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'egg',
    hunger INTEGER NOT NULL DEFAULT 50,
    hydration INTEGER NOT NULL DEFAULT 50,
    temperature INTEGER NOT NULL DEFAULT 50,
    happiness INTEGER NOT NULL DEFAULT 50,
    xp INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sync INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Create Inventory table
CREATE TABLE IF NOT EXISTS Inventory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_country ON User(country);
CREATE INDEX IF NOT EXISTS idx_pet_user_id ON Pet(user_id);
CREATE INDEX IF NOT EXISTS idx_pet_coins ON Pet(coins);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON Inventory(user_id);
