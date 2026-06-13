const leadSvc = require('../services/lead.service');
const { success, created } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const { name, email, phone, source, status, notes } = req.body;
    const lead = await leadSvc.createLead(
      { name, email, phone, source: source || 'other', status: status || 'new', notes },
      req.user.id,
      req.user.role
    );
    created(res, { lead }, 'Lead created');
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status, source, sortBy, sortOrder } = req.query;
    const result = await leadSvc.listLeads(
      { page, limit, search, status, source, sortBy, sortOrder },
      req.user
    );
    success(res, result);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const lead = await leadSvc.getLeadById(req.params.id);
    success(res, { lead });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const allowed = ['name','email','phone','source','status','assigned_to','notes'];
    const data    = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    const lead = await leadSvc.updateLead(req.params.id, data, req.user.id);
    success(res, { lead }, 'Lead updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await leadSvc.deleteLead(req.params.id, req.user.id);
    success(res, {}, 'Lead deleted');
  } catch (err) { next(err); }
};

module.exports = { create, list, getOne, update, remove };