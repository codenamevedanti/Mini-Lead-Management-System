import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leadsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const STATUSES = ['new','contacted','qualified','proposal','negotiation','won','lost'];
const SOURCES  = ['website','referral','cold_call','email','social_media','event','other'];

const EMPTY = { name: '', email: '', phone: '', source: 'other', status: 'new', assigned_to: '', notes: '' };

export default function LeadForm() {
  const { id }     = useParams();     // exists if editing
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const isEdit     = Boolean(id);

  const [form,    setForm]    = useState(EMPTY);
  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');

  useEffect(() => {
    // Load agents list (for manual override, admin/manager only)
    usersApi.agents().then(({ data }) => setAgents(data.data.agents)).catch(() => {});

    if (isEdit) {
      leadsApi.get(id)
        .then(({ data }) => {
          const l = data.data.lead;
          setForm({
            name:        l.name        || '',
            email:       l.email       || '',
            phone:       l.phone       || '',
            source:      l.source      || 'other',
            status:      l.status      || 'new',
            assigned_to: l.assigned_to || '',
            notes:       l.notes       || '',
          });
        })
        .catch(() => setApiErr('Failed to load lead'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name   = 'Name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiErr('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setApiErr('');
    try {
      const payload = { ...form };
      if (!payload.assigned_to) delete payload.assigned_to;

      if (isEdit) {
        await leadsApi.update(id, payload);
      } else {
        await leadsApi.create(payload);
      }
      navigate('/leads');
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner centered />;

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <h4 className="fw-bold mb-0">{isEdit ? 'Edit Lead' : 'New Lead'}</h4>
      </div>

      {apiErr && (
        <div className="alert alert-danger py-2 small">
          <i className="bi bi-exclamation-triangle-fill me-2" />{apiErr}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">

              {/* Name */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                <input
                  type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={form.name} onChange={handleChange} placeholder="John Doe"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email" name="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={form.email} onChange={handleChange} placeholder="john@example.com"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Phone */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone</label>
                <input
                  type="tel" name="phone" className="form-control"
                  value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000"
                />
              </div>

              {/* Source */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Source</label>
                <select name="source" className="form-select" value={form.source} onChange={handleChange}>
                  {SOURCES.map((s) => (
                    <option key={s} value={s} className="text-capitalize">
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">Status</label>
                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="text-capitalize">{s}</option>
                  ))}
                </select>
              </div>

              {/* Assigned To — manual override */}
              {user.role === 'admin' && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Assign To (override)</label>
                  <select name="assigned_to" className="form-select" value={form.assigned_to} onChange={handleChange}>
                    <option value="">Auto-assign</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                  <div className="form-text">Leave blank to use automatic assignment.</div>
                </div>
              )}

              {/* Notes */}
              <div className="col-12">
                <label className="form-label fw-semibold">Notes</label>
                <textarea
                  name="notes" className="form-control" rows={4}
                  value={form.notes} onChange={handleChange}
                  placeholder="Any additional information…"
                />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                  : <><i className="bi bi-check-lg me-2" />{isEdit ? 'Update Lead' : 'Create Lead'}</>}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}