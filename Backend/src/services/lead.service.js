const leadQ      = require('../db/queries/lead.queries');
const assignSvc  = require('./assignment.service');
const enrichSvc  = require('./enrichment.service');
const logSvc     = require('./log.service');

const createLead = async (data, actorId, actorRole) => {
  // Auto-assign when a manager creates a lead
  let assignedTo = data.assignedTo || null;
  if (actorRole === 'manager' || actorRole === 'admin') {
    assignedTo = await assignSvc.assignLead();
  }

  const result = await leadQ.createLead({ ...data, assignedTo, createdBy: actorId });
  const lead   = result.rows[0];

  // Log creation
  await logSvc.log({ action: 'lead_created', entityType: 'lead', entityId: lead.id, actorId, meta: { name: lead.name } });
  if (assignedTo) {
    await logSvc.log({ action: 'lead_assigned', entityType: 'lead', entityId: lead.id, actorId, meta: { assigned_to: assignedTo } });
  }

  // Async enrichment — fire and forget (non-blocking)
  enrichSvc.enrichLead().then(async (enrichData) => {
    if (enrichData) {
      await leadQ.updateLead(lead.id, { notes: lead.notes ? `${lead.notes}\n\n[Enriched] ${JSON.stringify(enrichData)}` : `[Enriched] ${JSON.stringify(enrichData)}`, enriched: true });
    }
  }).catch(() => {});

  return lead;
};

const updateLead = async (id, data, actorId) => {
  const existing = await leadQ.findById(id);
  if (!existing.rows.length) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const prev   = existing.rows[0];
  const result = await leadQ.updateLead(id, data);
  const lead   = result.rows[0];

  await logSvc.log({ action: 'lead_updated', entityType: 'lead', entityId: id, actorId });

  if (data.status && data.status !== prev.status) {
    await logSvc.log({ action: 'status_changed', entityType: 'lead', entityId: id, actorId, meta: { from: prev.status, to: data.status } });
  }
  if (data.assigned_to && data.assigned_to !== prev.assigned_to) {
    await logSvc.log({ action: 'lead_assigned', entityType: 'lead', entityId: id, actorId, meta: { assigned_to: data.assigned_to } });
  }

  return lead;
};

const deleteLead = async (id, actorId) => {
  const result = await leadQ.deleteLead(id);
  if (!result.rows.length) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
  await logSvc.log({ action: 'lead_deleted', entityType: 'lead', entityId: id, actorId });
  return result.rows[0];
};

const getLeadById = async (id) => {
  const result = await leadQ.findById(id);
  if (!result.rows.length) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
  return result.rows[0];
};

const listLeads = async (query, user) => {
  const [dataResult, countResult] = await leadQ.listLeads({ ...query, userId: user.id, role: user.role });
  return {
    leads:      dataResult.rows,
    total:      parseInt(countResult.rows[0].count, 10),
    page:       parseInt(query.page  || 1, 10),
    limit:      parseInt(query.limit || 10, 10),
  };
};

module.exports = { createLead, updateLead, deleteLead, getLeadById, listLeads };