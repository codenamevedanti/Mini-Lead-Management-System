require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler   = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');
const userRoutes = require('./routes/user.routes');
const logRoutes  = require('./routes/log.routes');

const app = express();

// ── Global Middleware ──────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// ── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs',  logRoutes);

// ── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

module.exports = app;