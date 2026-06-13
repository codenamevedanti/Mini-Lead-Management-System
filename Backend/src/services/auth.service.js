const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userQ  = require('../db/queries/user.queries');
const logQ   = require('../db/queries/log.queries');

const SALT_ROUNDS = 12;

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async ({ name, email, password, role = 'agent' }) => {
  const existing = await userQ.findByEmail(email);
  if (existing.rows.length) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result       = await userQ.createUser({ name, email, passwordHash, role });
  const user         = result.rows[0];

  await logQ.createLog({ action: 'user_registered', entityType: 'user', entityId: user.id, actorId: user.id });

  const token = generateToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const result = await userQ.findByEmail(email);
  if (!result.rows.length) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  const user  = result.rows[0];
  if (!user.is_active) throw Object.assign(new Error('Account deactivated'), { statusCode: 403 });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  await logQ.createLog({ action: 'user_login', entityType: 'user', entityId: user.id, actorId: user.id });

  const { password_hash, ...safeUser } = user;
  const token = generateToken(safeUser);
  return { user: safeUser, token };
};

const getMe = async (userId) => {
  const result = await userQ.findById(userId);
  if (!result.rows.length) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return result.rows[0];
};

module.exports = { register, login, getMe };