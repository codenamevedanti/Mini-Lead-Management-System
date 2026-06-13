/**
 * Lead Auto-Assignment Service
 * Strategy: Least-loaded agent (agent with fewest active leads).
 * Falls back to round-robin when all agents have equal load,
 * and uses a DB-level transaction lock to handle concurrency.
 */

const userQ = require('../db/queries/user.queries');
const leadQ = require('../db/queries/lead.queries');

const assignLead = async () => {
  const agentsResult = await userQ.listAgents();
  const agents = agentsResult.rows;

  if (!agents.length) return null;   // no agents available

  // Build a map of agentId -> leadCount
  const countResult  = await userQ.countLeadsPerAgent();
  const countMap     = {};
  countResult.rows.forEach(({ agent_id, lead_count }) => {
    countMap[agent_id] = parseInt(lead_count, 10);
  });

  // Ensure every agent has an entry (0 if none assigned)
  agents.forEach((a) => { if (!countMap[a.id]) countMap[a.id] = 0; });

  // Find minimum load
  const minLoad  = Math.min(...agents.map((a) => countMap[a.id]));
  const eligible = agents.filter((a) => countMap[a.id] === minLoad).map((a) => a.id);

  // Among equally-loaded agents, use round-robin with a DB lock
  const assignedId = await leadQ.getAndUpdateRoundRobin(eligible);
  return assignedId;
};

module.exports = { assignLead };