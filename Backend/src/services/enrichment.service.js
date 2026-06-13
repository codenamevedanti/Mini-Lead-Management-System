

const fetch = require('node-fetch');

const ENRICHMENT_API = process.env.ENRICHMENT_API_URL || 'https://randomuser.me/api';

/**
 * Returns enrichment data for a lead (avatar URL, country, timezone).
 * Gracefully returns null on failure so the main flow is never blocked.
 */
const enrichLead = async () => {
  try {
    const url      = `${ENRICHMENT_API}/?inc=picture,location,nat&noinfo`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      console.warn(`[Enrichment] API returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    const user = json.results?.[0];
    if (!user) return null;

    return {
      avatar:   user.picture?.large  || null,
      country:  user.location?.country || null,
      city:     user.location?.city    || null,
      timezone: user.location?.timezone?.description || null,
      nat:      user.nat              || null,
    };
  } catch (err) {
    console.error('[Enrichment] Failed:', err.message);
    return null;   // non-fatal
  }
};

module.exports = { enrichLead };