const authSvc  = require('../services/auth.service');
const { success, created } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authSvc.register({ name, email, password, role });
    created(res, result, 'Registration successful');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authSvc.login({ email, password });
    success(res, result, 'Login successful');
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await authSvc.getMe(req.user.id);
    success(res, { user });
  } catch (err) { next(err); }
};

const logout = (_req, res) => {
  // JWT is stateless — client drops the token.
  // Optionally: add token to a blocklist (Redis).
  success(res, {}, 'Logged out');
};

module.exports = { register, login, me, logout };