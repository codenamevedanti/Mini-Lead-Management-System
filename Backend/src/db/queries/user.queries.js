const { query } = require('../../config/db');

const findByEmail = (email) =>
  query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);

const findById = (id) =>
  query('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1 LIMIT 1', [id]);

const createUser = ({ name, email, passwordHash, role }) =>
  query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  );

const listAgents = () =>
  query(
    `SELECT id, name, email, role FROM users WHERE role = 'agent' AND is_active = TRUE ORDER BY name`,
    []
  );

const listUsers = () =>
  query(
    `SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC`,
    []
  );

const countLeadsPerAgent = () =>
  query(
    `SELECT assigned_to AS agent_id, COUNT(*) AS lead_count
     FROM leads
     WHERE assigned_to IS NOT NULL
     GROUP BY assigned_to`,
    []
  );

module.exports = { findByEmail, findById, createUser, listAgents, listUsers, countLeadsPerAgent };