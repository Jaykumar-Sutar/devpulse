const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// 1. CORS & JSON Body Parser
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'x-workspace-id']
}));
app.use(express.json());

// 2. Extract Workspace ID for Multi-Tenant Session Isolation
app.use((req, res, next) => {
  req.workspaceId = req.headers['x-workspace-id'] || 'default-workspace';
  next();
});

// Neon PostgreSQL Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eQBamn24MZvE@ep-wandering-pond-bekebxoi-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Ensure workspace_id columns exist on startup
const initWorkspaceColumns = async () => {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(255) DEFAULT 'default-workspace'`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(255) DEFAULT 'default-workspace'`);
    await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(255) DEFAULT 'default-workspace'`);
    console.log('✅ Workspace isolation columns verified');
  } catch (err) {
    console.error('Error verifying workspace columns:', err.message);
  }
};
initWorkspaceColumns();

// Test Endpoint
app.get('/', (req, res) => {
  res.send('DevPulse Backend API is running!');
});

// 1. REST API Route: Get all users in workspace
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE workspace_id = $1 ORDER BY id ASC',
      [req.workspaceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 1.1 REST API Route: Create a new user in workspace
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const newUser = await pool.query(
      'INSERT INTO users (name, email, role, workspace_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role, req.workspaceId]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 1.2 REST API Route: Delete a user & associated tasks in workspace
app.delete('/api/users/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM tasks WHERE assigned_to = $1 AND workspace_id = $2',
      [id, req.workspaceId]
    );
    await client.query(
      'DELETE FROM users WHERE id = $1 AND workspace_id = $2',
      [id, req.workspaceId]
    );
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

// 2. REST API Route: Get all projects in workspace
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE workspace_id = $1 ORDER BY id ASC',
      [req.workspaceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2.1 REST API Route: Create a new project in workspace
app.post('/api/projects', async (req, res) => {
  try {
    const { title, description } = req.body;
    const newProject = await pool.query(
      'INSERT INTO projects (title, description, workspace_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, req.workspaceId]
    );
    res.status(201).json(newProject.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2.2 REST API Route: Delete a project & its associated tasks in workspace
app.delete('/api/projects/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM tasks WHERE project_id = $1 AND workspace_id = $2',
      [id, req.workspaceId]
    );
    await client.query(
      'DELETE FROM projects WHERE id = $1 AND workspace_id = $2',
      [id, req.workspaceId]
    );
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

// 3. REST API Route: Get all tasks in workspace
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE workspace_id = $1 ORDER BY id ASC',
      [req.workspaceId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 4. REST API Route: Create a new task in workspace
app.post('/api/tasks', async (req, res) => {
  try {
    const { project_id, title, status, assigned_to } = req.body;
    const newTask = await pool.query(
      'INSERT INTO tasks (project_id, title, status, assigned_to, workspace_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_id, title, status || 'In Progress', assigned_to, req.workspaceId]
    );
    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 5. REST API Route: Update task status in workspace
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateTask = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 AND workspace_id = $3 RETURNING *',
      [status, id, req.workspaceId]
    );
    res.json(updateTask.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 6. REST API Route: Delete a task in workspace
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND workspace_id = $2',
      [id, req.workspaceId]
    );
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