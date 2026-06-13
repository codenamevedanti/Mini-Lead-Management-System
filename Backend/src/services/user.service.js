const userQ = require('../db/queries/user.queries');

const listUsers = async () => {
  const result = await userQ.listUsers();
  return result.rows;
};

const listAgents = async () => {
  const result = await userQ.listAgents();
  return result.rows;
};

module.exports = { listUsers, listAgents };