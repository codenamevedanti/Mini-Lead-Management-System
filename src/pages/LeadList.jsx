import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leadsApi } from '../services/api';
import { useAuth }  from '../context/AuthContext';
import Spinner      from '../components/Spinner';
import Pagination   from '../components/Pagination';

const STATUSES = ['new','contacted','qualified','proposal','negotiation','won','lost'];
const SOURCES  = ['website','referral','cold_call','email','social_media','event','other'];
const STATUS_BADGE = {
  new:'primary', contacted:'info', qualified:'warning',
  proposal:'secondary', negotiation:'dark', won:'success', lost:'danger',
};

export default function LeadList() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [leads,    setLeads]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error,    setError]    = useState('');

  const [filters, setFilters] = useState({
    page: 1, limit: 10, search: '', status: '', source: '',
    sortBy: 'created_at', sortOrder: 'DESC',
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await leadsApi.list(filters);
      setLeads(data.data.leads);
      setTotal(data.data.total);
    } catch {
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSort = (col) => {
    setFilters((prev) => ({
      ...prev,
      sortBy:    col,
      sortOrder: prev.sortBy === col && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    setDeleting(id);
    try {
      await leadsApi.delete(id);
      fetchLeads();
    } catch {
      setError('Failed to delete lead');
    } finally {
      setDeleting(null);
    }
  };

  const sortIcon = (col) => {
    if (filters.sortBy !== col) return <i className="bi bi-arrow-down-up text-muted ms-1" />;
    return filters.sortOrder === 'ASC'
      ? <i className="bi bi-sort-up text-primary ms-1" />
      : <i className="bi bi-sort-down text-primary ms-1" />;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Leads</h4>
        {(user.role === 'admin' || user.role === 'manager') && (
          <Link to="/leads/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1" />Add Lead
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search" /></span>
                <input
                  type="text" name="search" className="form-control"
                  placeholder="Search by name or email…"
                  value={filters.search} onChange={handleFilter}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select name="status" className="form-select form-select-sm" value={filters.status} onChange={handleFilter}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s} className="text-capitalize">{s}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select name="source" className="form-select form-select-sm" value={filters.source} onChange={handleFilter}>
                <option value="">All Sources</option>
                {SOURCES.map((s) => <option key={s} value={s} className="text-capitalize">{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select name="limit" className="form-select form-select-sm" value={filters.limit} onChange={handleFilter}>
                {[10,25,50].map((n) => <option key={n} value={n}>{n} per page</option>)}
              </select>
            </div>
            <div className="col-md-2 text-end text-muted small">
              {total} result{total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {loading ? <Spinner centered /> : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name {sortIcon('name')}</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('source')}>Source {sortIcon('source')}</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortIcon('status')}</th>
                    <th>Assigned To</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>Created {sortIcon('created_at')}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-muted py-5">No leads found.</td></tr>
                  ) : leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="fw-semibold">{lead.name}</td>
                      <td className="text-muted small">{lead.email || '—'}</td>
                      <td className="text-muted small">{lead.phone || '—'}</td>
                      <td><span className="text-capitalize small">{lead.source?.replace('_',' ')}</span></td>
                      <td>
                        <span className={`badge bg-${STATUS_BADGE[lead.status] || 'secondary'} text-capitalize`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="small">{lead.assigned_to_name || <span className="text-muted">Unassigned</span>}</td>
                      <td className="text-muted small">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={() => navigate(`/leads/${lead.id}`)}>
                            <i className="bi bi-eye" />
                          </button>
                          {(user.role === 'admin' || user.role === 'manager') && (
                            <>
                              <button className="btn btn-outline-primary" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                                <i className="bi bi-pencil" />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(lead.id)}
                                disabled={deleting === lead.id}
                              >
                                {deleting === lead.id
                                  ? <span className="spinner-border spinner-border-sm" />
                                  : <i className="bi bi-trash" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3">
            <Pagination
              page={filters.page}
              total={total}
              limit={filters.limit}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </div>
        </>
      )}
    </div>
  );
}