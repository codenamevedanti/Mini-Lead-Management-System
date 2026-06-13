const { query } = require('../../config/db');

const createLog = ({ action, entityType, entityId, actorId, meta }) =>
  query(
    `INSERT INTO activity_logs (action, entity_type, entity_id, actor_id, meta)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [action, entityType, entityId || null, actorId || null, meta ? JSON.stringify(meta) : null]
  );

const listLogs = ({ entityId, entityType, actorId, page = 1, limit = 20 }) => {
  const offset     = (page - 1) * limit;
  const conditions = [];
  const params     = [];
  let idx = 1;

  if (entityId) {
    conditions.push(`al.entity_id = $${idx++}`);
    params.push(entityId);
  }
  if (entityType) {
    conditions.push(`al.entity_type = $${idx++}`);
    params.push(entityType);
  }
  if (actorId) {
    conditions.push(`al.actor_id = $${idx++}`);
    params.push(actorId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  return query(
    `SELECT al.*, u.name AS actor_name
     FROM activity_logs al
     LEFT JOIN users u ON al.actor_id = u.id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
};

module.exports = { createLog, listLogs };