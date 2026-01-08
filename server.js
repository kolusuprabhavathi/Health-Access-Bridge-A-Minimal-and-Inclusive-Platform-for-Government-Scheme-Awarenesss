import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ PostgreSQL connection
const pool = new Pool({
  user: "postgres",        // change if needed
  host: "localhost",
  database: "health_access_bridge",
  password: "995121",      // your PostgreSQL password
  port: 5432,
});

// ✅ Create tables if not exist
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schemes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        age_group VARCHAR(100),
        gender VARCHAR(20),
        income_group VARCHAR(100),
        apply_link TEXT
      );
    `);
    console.log("✅ Tables verified/created successfully!");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
}
initDB();

// ✅ JWT secret
const SECRET_KEY = "healthAccessBridgeSecret";

// ------------------------------------
// 🔹 ADMIN REGISTRATION
// ------------------------------------
app.post("/admin/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await pool.query("SELECT * FROM admins WHERE username=$1", [username]);
    if (existing.rows.length > 0)
      return res.json({ success: false, message: "Admin already exists!" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO admins (username, password) VALUES ($1, $2)", [username, hashed]);
    res.json({ success: true, message: "Admin registered successfully!" });
  } catch (err) {
    console.error("Error registering admin:", err);
    res.status(500).json({ success: false, message: "Registration failed!" });
  }
});

// ------------------------------------
// 🔹 USER REGISTRATION
// ------------------------------------
app.post("/user/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    if (existing.rows.length > 0)
      return res.json({ success: false, message: "User already exists!" });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed]);
    res.json({ success: true, message: "User registered successfully!" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ success: false, message: "Registration failed!" });
  }
});

// ------------------------------------
// 🔹 ADMIN LOGIN
// ------------------------------------
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM admins WHERE username=$1", [username]);

    if (result.rows.length === 0)
      return res.json({ success: false, message: "Admin not found!" });

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.json({ success: false, message: "Invalid password!" });

    const token = jwt.sign({ id: admin.id, role: "admin" }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ success: true, token });
  } catch (err) {
    console.error("Error logging in admin:", err);
    res.status(500).json({ success: false, message: "Login failed!" });
  }
});

// ------------------------------------
// 🔹 USER LOGIN
// ------------------------------------
app.post("/user/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);

    if (result.rows.length === 0)
      return res.json({ success: false, message: "User not found!" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ success: false, message: "Invalid password!" });

    const token = jwt.sign({ id: user.id, role: "user" }, SECRET_KEY, { expiresIn: "2h" });
    res.json({ success: true, token });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ success: false, message: "Login failed!" });
  }
});

// ------------------------------------
// 🔹 ADD SCHEME (ADMIN ONLY)
// ------------------------------------
app.post("/admin/schemes", async (req, res) => {
  try {
    const { name, description, category, age_group, gender, income_group, apply_link } = req.body;

    const result = await pool.query(
      `INSERT INTO schemes (name, description, category, age_group, gender, income_group, apply_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
      [name, description, category, age_group, gender, income_group, apply_link]
    );

    res.status(201).json({ message: "Scheme added successfully", scheme: result.rows[0] });
  } catch (err) {
    console.error("Error adding scheme:", err);
    res.status(500).json({ error: "Failed to add scheme" });
  }
});

// ------------------------------------
// 🔹 UPDATE SCHEME
// ------------------------------------
app.put("/admin/schemes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, age_group, gender, income_group, apply_link } = req.body;

    const result = await pool.query(
      `UPDATE schemes SET 
       name=$1, description=$2, category=$3, age_group=$4, gender=$5, income_group=$6, apply_link=$7 
       WHERE id=$8 RETURNING *;`,
      [name, description, category, age_group, gender, income_group, apply_link, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating scheme:", err);
    res.status(500).json({ error: "Failed to update scheme" });
  }
});

// ------------------------------------
// 🔹 DELETE SCHEME
// ------------------------------------
app.delete("/admin/schemes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM schemes WHERE id=$1", [id]);
    res.json({ message: "Scheme deleted successfully" });
  } catch (err) {
    console.error("Error deleting scheme:", err);
    res.status(500).json({ error: "Failed to delete scheme" });
  }
});

// ------------------------------------
// 🔹 FETCH SCHEMES (FOR ALL USERS)
// ------------------------------------
app.get("/schemes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM schemes ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching schemes:", err);
    res.status(500).json({ error: "Failed to fetch schemes" });
  }
});

// ------------------------------------
// 🔹 Serve frontend files
// ------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// ------------------------------------
// ✅ Start server
// ------------------------------------
app.listen(5002, () =>
  console.log("🚀 Health Access Bridge backend running on http://localhost:5002")
);
