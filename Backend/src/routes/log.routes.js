const router = require('express').Router();
const ctrl   = require('../controllers/log.controller');
const { authenticate } = require('../middleware/auth');
const { allow }        = require('../middleware/roleCheck');

router.use(authenticate);
router.get('/', allow('admin','manager'), ctrl.getLogs);

module.exports = router;