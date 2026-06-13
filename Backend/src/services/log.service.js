const logQ = require('../db/queries/log.queries');

const log = ({ action, entityType, entityId, actorId, meta }) =>
  logQ.createLog({ action, entityType, entityId, actorId, meta }).catch((err) => {
    // Logging must never crash the main request
    console.error('[Log] Failed to write activity log:', err.message);
  });

const getLogs = ({ entityId, entityType, actorId, page, limit }) =>
  logQ.listLogs({ entityId, entityType, actorId, page, limit });

module.exports = { log, getLogs };