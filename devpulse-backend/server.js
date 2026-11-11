const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Neon PostgreSQL Database Connection
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eQBamn24MZvE@ep-wandering-pond-bekebxoi-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require', 
  ssl: {
    rejectUnauthorized: false
  }
});

// Test Endpoint
app.get('/', (req, res) => {
  res.send('DevPulse Backend API is running!');
});

// 1. REST API Route: Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 1.1 REST API Route: Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const newUser = await pool.query(
      'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [name, email, role]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 1.2 REST API Route: Delete a user (Team Member)
app.delete('/api/users/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    // Delete associated tasks assigned to this user first
    await client.query('DELETE FROM tasks WHERE assigned_to = $1', [id]);
    // Then delete the user
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'User and associated tasks deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 2. REST API Route: Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2.1 REST API Route: Create a new project
app.post('/api/projects', async (req, res) => {
  try {
    const { title, description } = req.body;
    const newProject = await pool.query(
      'INSERT INTO projects (title, description) VALUES ($1, $2) RETURNING *',
      [title, description]
    );
    res.status(201).json(newProject.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2.2 REST API Route: Delete a project & its associated tasks safely via Transaction (FIXED)
app.delete('/api/projects/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    // 1. Delete associated tasks first
    await client.query('DELETE FROM tasks WHERE project_id = $1', [id]);
    // 2. Delete the project
    await client.query('DELETE FROM projects WHERE id = $1', [id]);
    await client.query('COMMIT');

    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting project:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 3. REST API Route: Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 4. REST API Route: Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { project_id, title, status, assigned_to } = req.body;
    const newTask = await pool.query(
      'INSERT INTO tasks (project_id, title, status, assigned_to) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, title, status, assigned_to]
    );
    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 5. REST API Route: Update task status
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateTask = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(updateTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 6. REST API Route: Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 DevPulse server is running on port ${PORT}`);
});