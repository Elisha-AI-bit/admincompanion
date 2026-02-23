import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import UsersPage from './pages/UsersPage'
import EmergencyCallsPage from './pages/EmergencyCallsPage'
import PhysicalSafetyPage from './pages/PhysicalSafetyPage'
import CyberSafetyPage from './pages/CyberSafetyPage'
import HealthPage from './pages/HealthPage'
import NearbyServicesPage from './pages/NearbyServicesPage'
import NewsPage from './pages/NewsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import MigrationPage from './pages/MigrationPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-purple-600">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="emergency-calls" element={<EmergencyCallsPage />} />
        <Route path="physical-safety" element={<PhysicalSafetyPage />} />
        <Route path="cyber-safety" element={<CyberSafetyPage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="nearby-services" element={<NearbyServicesPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="migrate" element={<MigrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
