import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leadsApi, logsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const STATUS_COLORS = {
  new: 'primary', contacted: 'info', qualified: 'warning',
  proposal: 'secondary', negotiation: 'dark', won: 'success', lost: 'danger',
};

export default function Dashboard() {
  const { user }                   = useAuth();
  const [stats,   setStats]        = useState(null);
  const [logs,    setLogs]         = useState([]);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [leadsRes, logsRes] = await Promise.all([
          leadsApi.list({ limit: 1000 }),
          (user.role !== 'agent') ? logsApi.list({ limit: 8 }) : Promise.resolve({ data: { data: { logs: [] } } }),
        ]);

        const leads = leadsRes.data.data.leads;
        const byStatus = leads.reduce((acc, l) => {
          acc[l.status] = (acc[l.status] || 0) + 1;
          return acc;
        }, {});

        setStats({ total: leads.length, byStatus });
        setLogs(logsRes.data.data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.role]);

  if (loading) return <Spinner centered />;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-0">Dashboard</h4>
          <p className="text-muted small mb-0">Welcome back, {user.name}!</p>
        </div>
        {(user.role === 'admin' || user.role === 'manager') && (
          <Link to="/leads/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" />New Lead
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-people-fill text-primary fs-4" />
              </div>
              <div>
                <div className="text-muted small">Total Leads</div>
                <div className="fs-3 fw-bold">{stats?.total ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
        {['new','won','lost'].map((s) => (
          <div key={s} className="col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`bg-${STATUS_COLORS[s]} bg-opacity-10 rounded-3 p-3`}>
                  <i className={`bi bi-${s === 'new' ? 'star' : s === 'won' ? 'trophy' : 'x-circle'}-fill text-${STATUS_COLORS[s]} fs-4`} />
                </div>
                <div>
                  <div className="text-muted small text-capitalize">{s} Leads</div>
                  <div className="fs-3 fw-bold">{stats?.byStatus?.[s] ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold border-bottom-0 pb-0">
              Leads by Status
            </div>
            <div className="card-body pt-2">
              {Object.entries(STATUS_COLORS).map(([s, color]) => {
                const count = stats?.byStatus?.[s] || 0;
                const pct   = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={s} className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-capitalize">{s}</span>
                      <span className="fw-semibold">{count}</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className={`progress-bar bg-${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {user.role !== 'agent' && (
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-semibold border-bottom-0 pb-0">
                Recent Activity
              </div>
              <div className="card-body pt-2 p-0">
                {logs.length === 0
                  ? <p className="text-muted small px-3 pt-2">No recent activity.</p>
                  : (
                    <ul className="list-group list-group-flush">
                      {logs.map((log) => (
                        <li key={log.id} className="list-group-item border-0 py-2 px-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <span className="small">
                              <span className="badge bg-secondary me-2 text-capitalize">
                                {log.action.replace(/_/g, ' ')}
                              </span>
                              {log.actor_name && <span className="text-muted">by {log.actor_name}</span>}
                            </span>
                            <span className="text-muted" style={{ fontSize: 11 }}>
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}