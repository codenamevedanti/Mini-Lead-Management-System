const userSvc = require('../services/user.service');
const { success } = require('../utils/response');

const listUsers = async (req, res, next) => {
  try {
    const users = await userSvc.listUsers();
    success(res, { users });
  } catch (err) { next(err); }
};

const listAgents = async (req, res, next) => {
  try {
    const agents = await userSvc.listAgents();
    success(res, { agents });
  } catch (err) { next(err); }
};

module.exports = { listUsers, listAgents };