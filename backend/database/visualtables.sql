-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Create Items table
CREATE TABLE IF NOT EXISTS Items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    user_id INTEGER,
    is_checked BOOLEAN DEFAULT 0,
    item_state TEXT DEFAULT 'Low',
    location TEXT NOT NULL,
    in_list BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SavedRecipes (
    user_id INTEGER,
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    link TEXT,
    calories REAL,
    diet_labels TEXT,
    Flag BOOLEAN DEFAULT 0, 
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);