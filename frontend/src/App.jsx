import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintNewPage from './pages/ComplaintNewPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import NetworkGraphPage from './pages/NetworkGraphPage';
import NetworksOverviewPage from './pages/NetworksOverviewPage';
import TransactionsPage from './pages/TransactionsPage';
import AuditLogsPage from './pages/AuditLogsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="complaints/new" element={<ComplaintNewPage />} />
            <Route path="cases" element={<CasesPage />} />
            <Route path="cases/:id" element={<CaseDetailPage />} />
            <Route path="cases/:id/network" element={<NetworkGraphPage />} />
            <Route path="networks" element={<NetworksOverviewPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route 
              path="audit-logs" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'INVESTIGATOR']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
