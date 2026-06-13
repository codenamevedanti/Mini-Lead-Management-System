/**
 * Global error handler — must be registered last in Express.
 */
const errorHandler = (err, req, res, next) => {  // eslint-disable-line no-unused-vars
    console.error('[Error]', err.stack || err.message);
  
    // Postgres unique violation
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate entry', detail: err.detail });
    }
    // Postgres foreign key violation
    if (err.code === '23503') {
      return res.status(400).json({ success: false, message: 'Invalid reference', detail: err.detail });
    }
  
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  };
  
  module.exports = errorHandler;