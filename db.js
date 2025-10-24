const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database or open existing one
const dbPath = path.resolve(__dirname, '../data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table', err.message);
      } else {
        console.log('Users table ready');
        
        // Insert some sample data if the table is empty
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
          if (err) {
            console.error('Error checking users table', err.message);
          } else if (row.count === 0) {
            // Insert sample data
            const sampleUsers = [
              { name: 'John Doe', email: 'john@example.com' },
              { name: 'Jane Smith', email: 'jane@example.com' }
            ];
            
            const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
            sampleUsers.forEach(user => {
              stmt.run(user.name, user.email);
            });
            stmt.finalize();
            console.log('Sample users added');
          }
        });
      }
    });
  }
});

module.exports = db;

// Made with Bob
