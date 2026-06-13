const app  = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    console.log('✅  Database connected');

    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
      console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err.message);
    process.exit(1);
  }
};

start();