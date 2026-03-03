import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import AdminDashboard from './pages/AdminDashboard';

const isAuthenticated = () => !!localStorage.getItem('servsync_token');
const getUserRole = () => localStorage.getItem('servsync_role') || 'customer';

const PrivateRoute = ({ children, requiredRole }) => {
  const userRole = getUserRole();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={`/${userRole}-dashboard`} replace />;
  }
  
  return children;
};

export default function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          min-height: 100vh;
          background: #f8fafc;
        }

        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
      
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          
          <Route
            path="/customer-dashboard"
            element={
              <PrivateRoute requiredRole="customer">
                <CustomerDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/operator-dashboard"
            element={
              <PrivateRoute requiredRole="operator">
                <OperatorDashboard />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to={`/${getUserRole()}-dashboard`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

