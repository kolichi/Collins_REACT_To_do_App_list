import express from "express";
import { Pool } from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, DB_ADMIN_PASS } =
  process.env;

// Pool to bootstrap from the built-in 'postgres' DB
const bootstrapPool = new Pool({
  user: "postgres",
  host: DB_HOST,
  password: DB_ADMIN_PASS,
  port: DB_PORT,
  database: "postgres",
});

// Pool to manage schema + tables in your app DB
const setupPool = new Pool({
  user: "postgres",
  host: DB_HOST,
  password: DB_ADMIN_PASS,
  port: DB_PORT,
  database: DB_NAME,
});

// Pool for your app user
const appPool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASS,
  port: DB_PORT,
});

async function initializeDatabase() {
  try {
    // 1. Create database
    await bootstrapPool.query(`CREATE DATABASE ${DB_NAME};`).catch(() => {});

    // 2. Create app user & grant CONNECT
    await bootstrapPool.query(`
        DO $$
        BEGIN
          CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
        EXCEPTION WHEN duplicate_object THEN
          NULL;
        END
        $$;
      `);
    await bootstrapPool.query(
      `GRANT CONNECT ON DATABASE ${DB_NAME} TO ${DB_USER};`
    );

    // 3. Schema grants in the new DB
    await setupPool.query(`
        REVOKE ALL ON SCHEMA public FROM PUBLIC;
        GRANT ALL ON SCHEMA public TO ${DB_USER};
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
      `);

    await setupPool.query(`
        GRANT ALL PRIVILEGES
          ON ALL TABLES IN SCHEMA public
          TO ${DB_USER};
      `);

    // (Optional) Default privileges for future tables:
    await setupPool.query(`
        ALTER DEFAULT PRIVILEGES
          IN SCHEMA public
          GRANT ALL PRIVILEGES ON TABLES
          TO ${DB_USER};
      `);

    // 4. Create tables via setupPool
    await setupPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    await setupPool.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id UUID PRIMARY KEY,
          task TEXT NOT NULL,
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          user_id INTEGER REFERENCES users(id)
        );
      `);
      
      await setupPool.query(`
        -- Grant on existing sequences
        GRANT USAGE, SELECT, UPDATE
          ON ALL SEQUENCES IN SCHEMA public
          TO ${DB_USER};
      
        -- Default privileges for future sequences
        ALTER DEFAULT PRIVILEGES
          IN SCHEMA public
          GRANT USAGE, SELECT, UPDATE ON SEQUENCES
          TO ${DB_USER};
      `);
      
      

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  } finally {
    await bootstrapPool.end();
    await setupPool.end();
  }
}

initializeDatabase().then(() => {
  // Authentication middleware
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Alias for backward compatibility with your route code:
  const pool = appPool;
  // Routes
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if email exists
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
        [email, hashedPassword]
      );

      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET);
      res.json({ token });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        message: "Registration failed",
        error: error.message,
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET);
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  // Add authentication middleware to todo routes
  app.post("/api/todos", authenticate, async (req, res) => {
    try {
      const { task } = req.body;
      const id = uuidv4();
      const { rows } = await pool.query(
        "INSERT INTO todos (id, task, user_id) VALUES ($1, $2, $3) RETURNING *",
        [id, task, req.userId]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.get("/api/todos", authenticate, async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
        [req.userId] // Filter by current user
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.put("/api/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { task, completed } = req.body;

      const { rows } = await pool.query(
        `UPDATE todos 
         SET task = $1, completed = $2 
         WHERE id = $3 
         RETURNING *, false as "isEditing"`, // Add isEditing flag
        [task, completed, id]
      );

      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/todos/:id", async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.sendStatus(204);
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
