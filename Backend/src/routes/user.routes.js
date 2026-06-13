const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { allow }        = require('../middleware/roleCheck');

router.use(authenticate);

router.get('/',        allow('admin'), ctrl.listUsers);
router.get('/agents',  allow('admin','manager'), ctrl.listAgents);

module.exports = router;