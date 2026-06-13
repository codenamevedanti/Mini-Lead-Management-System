const logSvc = require('../services/log.service');
const { success } = require('../utils/response');

const getLogs = async (req, res, next) => {
  try {
    const { entityId, entityType, actorId, page, limit } = req.query;
    const result = await logSvc.getLogs({ entityId, entityType, actorId, page, limit });
    success(res, { logs: result.rows });
  } catch (err) { next(err); }
};

module.exports = { getLogs };