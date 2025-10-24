const express = require('express');
const db = require('./db');
const { register, metricsMiddleware } = require('./metrics');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(metricsMiddleware);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// GET all users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});

// GET user by id
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

// POST new user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  db.run(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        console.error(err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      res.status(201).json({
        id: this.lastID,
        name,
        email
      });
    }
  );
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});

// For local development
if (require.main === module) {
  const application_port = process.env.application_port || 3000;
  app.listen(application_port, () => {
    console.log(`Server running on port ${application_port}`);
    console.log(`Metrics available at http://localhost:${application_port}/metrics`);
  });
}

// Export for Knative Functions
module.exports = app;
