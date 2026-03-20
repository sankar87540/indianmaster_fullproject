import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Users from './pages/Users.tsx'
import Jobs from './pages/Jobs.tsx'
import Settings from './pages/Settings.tsx'
import AdminLayout from './components/AdminLayout.tsx'
import { AuthProvider, useAuth } from './lib/AuthContext.tsx'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  // We'll allow access if we bypass the router to `/` with the fallback login
  if (!session && !loading && window.location.pathname !== '/' && window.location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
