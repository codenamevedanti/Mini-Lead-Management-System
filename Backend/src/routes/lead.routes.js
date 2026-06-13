const router = require('express').Router();
const ctrl   = require('../controllers/lead.controller');
const { authenticate } = require('../middleware/auth');
const { allow }        = require('../middleware/roleCheck');
const { leadRules, validate } = require('../utils/validators');

router.use(authenticate);

router.get   ('/',     ctrl.list);
router.get   ('/:id',  ctrl.getOne);
router.post  ('/',     allow('admin','manager'), leadRules, validate, ctrl.create);
router.put   ('/:id',  allow('admin','manager'), leadRules, validate, ctrl.update);
router.delete('/:id',  allow('admin','manager'), ctrl.remove);

module.exports = router;