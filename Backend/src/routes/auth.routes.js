const router        = require('express').Router();
const ctrl          = require('../controllers/auth.controller');
const { authenticate }          = require('../middleware/auth');
const { authLimiter }           = require('../middleware/rateLimiter');
const { registerRules, loginRules, validate } = require('../utils/validators');

router.post('/register', authLimiter, registerRules, validate, ctrl.register);
router.post('/login',    authLimiter, loginRules,    validate, ctrl.login);
router.post('/logout',   authenticate, ctrl.logout);
router.get ('/me',       authenticate, ctrl.me);

module.exports = router;