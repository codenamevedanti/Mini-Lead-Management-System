import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsApi, logsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const STATUS_BADGE = {
  new:'primary', contacted:'info', qualified:'warning',
  proposal:'secondary', negotiation:'dark', won:'success', lost:'danger',
};

const ACTION_ICONS = {
  lead_created:'plus-circle-fill', lead_updated:'pencil-fill',
  lead_assigned:'person-fill', status_changed:'arrow-left-right',
  lead_deleted:'trash-fill',
};

export default function LeadDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead,    setLead]    = useState(null);
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [leadRes, logsRes] = await Promise.all([
          leadsApi.get(id),
          logsApi.list({ entityId: id, entityType: 'lead', limit: 20 }),
        ]);
        setLead(leadRes.data.data.lead);
        setLogs(logsRes.data.data.logs || []);
      } catch {
        setError('Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await leadsApi.delete(id);
      navigate('/leads');
    } catch {
      setError('Failed to delete lead');
    }
  };

  if (loading) return <Spinner centered />;
  if (error)   return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;
  if (!lead)   return null;

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <h4 className="fw-bold mb-0 me-auto">{lead.name}</h4>
        <span className={`badge bg-${STATUS_BADGE[lead.status] || 'secondary'} text-capitalize fs-6`}>
          {lead.status}
        </span>
        {(user.role === 'admin' || user.role === 'manager') && (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/leads/${id}/edit`)}>
              <i className="bi bi-pencil me-1" />Edit
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>
              <i className="bi bi-trash me-1" />Delete
            </button>
          </>
        )}
      </div>

      <div className="row g-3">
        {/* Lead Info */}
        <div className="col-md-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Lead Information</div>
            <div className="card-body">
              <dl className="row mb-0">
                {[
                  ['Email',       lead.email   || '—'],
                  ['Phone',       lead.phone   || '—'],
                  ['Source',      lead.source?.replace('_',' ') || '—'],
                  ['Assigned To', lead.assigned_to_name || 'Unassigned'],
                  ['Created By',  lead.created_by_name  || '—'],
                  ['Created At',  new Date(lead.created_at).toLocaleString()],
                  ['Updated At',  new Date(lead.updated_at).toLocaleString()],
                ].map(([label, val]) => (
                  <div key={label} className="col-sm-12 mb-2 d-flex">
                    <dt className="fw-semibold text-muted" style={{ width: 120, minWidth: 120 }}>{label}</dt>
                    <dd className="mb-0 text-capitalize">{val}</dd>
                  </div>
                ))}
              </dl>

              {lead.notes && (
                <div className="mt-3 pt-3 border-top">
                  <div className="fw-semibold text-muted mb-1">Notes</div>
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="col-md-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Activity Timeline</div>
            <div className="card-body p-0" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {logs.length === 0
                ? <p className="text-muted small p-3 mb-0">No activity recorded.</p>
                : (
                  <ul className="list-group list-group-flush">
                    {logs.map((log) => (
                      <li key={log.id} className="list-group-item border-0 py-2 px-3">
                        <div className="d-flex gap-2 align-items-start">
                          <i className={`bi bi-${ACTION_ICONS[log.action] || 'circle-fill'} text-primary mt-1`} style={{ fontSize: 13 }} />
                          <div>
                            <div className="small fw-semibold text-capitalize">
                              {log.action.replace(/_/g, ' ')}
                            </div>
                            {log.actor_name && <div className="text-muted" style={{ fontSize: 12 }}>by {log.actor_name}</div>}
                            {log.meta && (
                              <div className="text-muted" style={{ fontSize: 11 }}>
                                {JSON.stringify(log.meta)}
                              </div>
                            )}
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}