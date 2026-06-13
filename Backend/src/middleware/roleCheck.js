const { forbidden } = require('../utils/response');

/**
 * Factory: returns middleware that allows only the given roles.
 * Usage: router.post('/leads', authenticate, allow('admin','manager'), ...)
 */
const allow = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return forbidden(res, `Access restricted to: ${roles.join(', ')}`);
  }
  next();
};

module.exports = { allow };