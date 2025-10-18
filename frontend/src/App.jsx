import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Planning from './pages/Planning'
import Trends from './pages/Trends'
import ViralFinder from './pages/ViralFinder'
import Analytics from './pages/Analytics'
import CombinedPlanning from './pages/CombinedPlanning'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="planning" element={<Planning />} />
          <Route path="trends" element={<Trends />} />
          <Route path="viral" element={<ViralFinder />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="combined" element={<CombinedPlanning />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
