const { query, getClient } = require('../../config/db');

const createLead = ({ name, email, phone, source, status, assignedTo, createdBy, notes }) =>
  query(
    `INSERT INTO leads (name, email, phone, source, status, assigned_to, created_by, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [name, email, phone, source, status, assignedTo, createdBy, notes]
  );

const updateLead = (id, fields) => {
  const keys   = Object.keys(fields);
  const values = Object.values(fields);
  const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  return query(
    `UPDATE leads SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
};

const deleteLead = (id) =>
  query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);

const findById = (id) =>
  query(
    `SELECT l.*,
            u1.name AS assigned_to_name, u1.email AS assigned_to_email,
            u2.name AS created_by_name
     FROM leads l
     LEFT JOIN users u1 ON l.assigned_to  = u1.id
     LEFT JOIN users u2 ON l.created_by   = u2.id
     WHERE l.id = $1 LIMIT 1`,
    [id]
  );

const listLeads = ({ page = 1, limit = 10, search = '', status, source, sortBy = 'created_at', sortOrder = 'DESC', userId, role }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  // Role-based filtering: agents only see their own leads
  if (role === 'agent') {
    conditions.push(`l.assigned_to = $${idx++}`);
    params.push(userId);
  }

  if (search) {
    conditions.push(`(l.name ILIKE $${idx} OR l.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (status) {
    conditions.push(`l.status = $${idx++}`);
    params.push(status);
  }

  if (source) {
    conditions.push(`l.source = $${idx++}`);
    params.push(source);
  }

  const allowedSorts  = ['name', 'email', 'status', 'source', 'created_at', 'updated_at'];
  const allowedOrders = ['ASC', 'DESC'];
  const safeSort  = allowedSorts.includes(sortBy)    ? sortBy    : 'created_at';
  const safeOrder = allowedOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataQuery = `
    SELECT l.*,
           u1.name  AS assigned_to_name,  u1.email AS assigned_to_email,
           u2.name  AS created_by_name
    FROM leads l
    LEFT JOIN users u1 ON l.assigned_to = u1.id
    LEFT JOIN users u2 ON l.created_by  = u2.id
    ${where}
    ORDER BY l.${safeSort} ${safeOrder}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `SELECT COUNT(*) FROM leads l ${where}`;

  return Promise.all([
    query(dataQuery,  [...params, limit, offset]),
    query(countQuery, params),
  ]);
};

// Lock + fetch next agent (for round-robin, done inside a transaction)
const getAndUpdateRoundRobin = async (agentIds) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const state = await client.query(
      'SELECT last_agent_id FROM assignment_state WHERE id = 1 FOR UPDATE'
    );
    const lastId = state.rows[0]?.last_agent_id;
    const lastIdx = agentIds.indexOf(lastId);
    const nextIdx = (lastIdx + 1) % agentIds.length;
    const nextId  = agentIds[nextIdx];
    await client.query(
      'UPDATE assignment_state SET last_agent_id = $1, updated_at = NOW() WHERE id = 1',
      [nextId]
    );
    await client.query('COMMIT');
    return nextId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = { createLead, updateLead, deleteLead, findById, listLeads, getAndUpdateRoundRobin };