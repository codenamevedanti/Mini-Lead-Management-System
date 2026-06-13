const { body, validationResult } = require('express-validator');
const { badRequest } = require('./response');

// Middleware: reject request if express-validator found errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest(res, 'Validation failed', errors.array());
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'agent']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const leadRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').optional({ nullable: true }).trim().isEmail().withMessage('Valid email required'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('source').optional().isIn(['website','referral','cold_call','email','social_media','event','other']),
  body('status').optional().isIn(['new','contacted','qualified','proposal','negotiation','won','lost']),
];

module.exports = { validate, registerRules, loginRules, leadRules };