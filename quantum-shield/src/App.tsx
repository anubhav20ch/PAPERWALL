import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/public/Landing';
import { Login } from './pages/public/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { ProfessorDashboard } from './pages/dashboards/ProfessorDashboard';
import { ExamCentreDashboard } from './pages/dashboards/ExamCentreDashboard';
import { UploadPaper } from './pages/features/UploadPaper';
import { PaperDetails } from './pages/features/PaperDetails';
import { Verification } from './pages/features/Verification';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Users } from './pages/admin/Users';
import { Settings } from './pages/admin/Settings';

import { CryptoDashboard } from './pages/dashboards/CryptoDashboard';
import { PerformanceBenchmark } from './pages/dashboards/PerformanceBenchmark';
import { AttackSimulation } from './pages/dashboards/AttackSimulation';
import { IncidentCenter } from './pages/dashboards/IncidentCenter';
import { ResearchAnalytics } from './pages/dashboards/ResearchAnalytics';

import { AuthProvider } from './lib/AuthContext';

import { CryptoVisualizer } from './pages/dashboards/CryptoVisualizer';
import { AESSandbox } from './pages/dashboards/AESSandbox';
import { AccessPolicies } from './pages/admin/AccessPolicies';
import { About } from './pages/public/About';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="professor" element={<ProfessorDashboard />} />
            <Route path="centre" element={<ExamCentreDashboard />} />
            
            {/* Phase 5 Routes */}
            <Route path="visualizer" element={<CryptoVisualizer />} />
            <Route path="sbox" element={<AESSandbox />} />
            <Route path="crypto-analytics" element={<CryptoDashboard />} />
            <Route path="benchmarks" element={<PerformanceBenchmark />} />
            <Route path="attack-lab" element={<AttackSimulation />} />
            <Route path="incidents" element={<IncidentCenter />} />
            <Route path="research" element={<ResearchAnalytics />} />
            <Route path="about" element={<About />} />

            <Route path="upload" element={<UploadPaper />} />
            <Route path="papers" element={<ProfessorDashboard />} />
            <Route path="papers/:id" element={<PaperDetails />} />
            <Route path="policies" element={<AccessPolicies />} />
            <Route path="verification" element={<Verification />} />
            
            <Route path="logs" element={<AuditLogs />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
            
            <Route index element={<Navigate to="admin" replace />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
