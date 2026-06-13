import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState('login');   // 'login' | 'register'
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'agent' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="bi bi-funnel-fill text-primary" style={{ fontSize: 40 }} />
            <h4 className="fw-bold mt-2 mb-0">Lead Management</h4>
            <p className="text-muted small">
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small">
              <i className="bi bi-exclamation-triangle-fill me-2" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name</label>
                <input
                  type="text" name="name" className="form-control"
                  value={form.name} onChange={handleChange}
                  placeholder="Jane Smith" required
                />
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email" name="email" className="form-control"
                value={form.email} onChange={handleChange}
                placeholder="you@example.com" required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password" name="password" className="form-control"
                value={form.password} onChange={handleChange}
                placeholder="••••••••" required minLength={6}
              />
            </div>

            {mode === 'register' && (
              <div className="mb-3">
                <label className="form-label fw-semibold">Role</label>
                <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 mt-1" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Please wait…</>
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <hr className="my-3" />
          <p className="text-center small mb-0">
            {mode === 'login'
              ? <>Don't have an account? <button className="btn btn-link btn-sm p-0" onClick={() => setMode('register')}>Register</button></>
              : <>Already have an account? <button className="btn btn-link btn-sm p-0" onClick={() => setMode('login')}>Sign in</button></>}
          </p>
        </div>
      </div>
    </div>
  );
}