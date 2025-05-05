-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create todos table with user relationship
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY,
  task TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id INTEGER REFERENCES users(id)
);

-- Grant privileges (run these as PostgreSQL superuser)
GRANT ALL PRIVILEGES ON TABLE users TO todo_user;
GRANT ALL PRIVILEGES ON TABLE todos TO todo_user;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO todo_user;

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- Additional permissions for foreign key relationship
GRANT REFERENCES ON users TO todo_user;