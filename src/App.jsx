import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Navbar           from './components/Navbar';
import Login            from './pages/Login';
import Dashboard        from './pages/Dashboard';
import LeadList         from './pages/LeadList';
import LeadForm         from './pages/LeadForm';
import LeadDetail       from './pages/LeadDetail';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Layout><LeadList /></Layout></ProtectedRoute>} />
          <Route path="/leads/new" element={<ProtectedRoute roles={['admin','manager']}><Layout><LeadForm /></Layout></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute><Layout><LeadDetail /></Layout></ProtectedRoute>} />
          <Route path="/leads/:id/edit" element={<ProtectedRoute roles={['admin','manager']}><Layout><LeadForm /></Layout></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}