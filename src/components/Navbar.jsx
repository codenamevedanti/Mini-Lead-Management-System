import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-funnel-fill me-2" />
          LeadMS
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                <i className="bi bi-speedometer2 me-1" />Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/leads">
                <i className="bi bi-people me-1" />Leads
              </Link>
            </li>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <li className="nav-item">
                <Link className="nav-link" to="/leads/new">
                  <i className="bi bi-plus-circle me-1" />New Lead
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 small">
              <i className="bi bi-person-circle me-1" />
              {user?.name}
              <span className="badge bg-light text-primary ms-2 text-capitalize">{user?.role}</span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1" />Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}