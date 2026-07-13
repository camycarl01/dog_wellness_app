import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ComingSoon from './components/ComingSoon'
import AddDog from './pages/AddDog'
import DogProfile from './pages/DogProfile'  // we'll build this next
import VetPage from './pages/VetPage'
import VaccinesPage from './pages/VaccinesPage'
import HealthPage from './pages/HealthPage'
import HealthResultPage from './pages/HealthResultPage'
import HealthHistoryPage from './pages/HealthHistoryPage'

function PlaceholderPage({ title, day }) {
  return <ComingSoon title={title} day={day} />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes inside app layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dogs/new" element={<AddDog />} />
            <Route path="/dogs/:id" element={<DogProfile />} />

            {/* Health */}
            <Route path="/health" element={<HealthPage />} />
            <Route path="/health/result" element={<HealthResultPage />} />
            <Route path="/health/history" element={<HealthHistoryPage />} />

            {/* Nutrition */}
            <Route path="/nutrition" element={<PlaceholderPage title="Feeding plan" day={11} />} />
            <Route path="/nutrition/log" element={<PlaceholderPage title="Log a meal" day={11} />} />
            <Route path="/nutrition/toxic-foods" element={<PlaceholderPage title="Toxic foods database" day={20} />} />

            {/* Vet */}
            <Route path="/vet" element={<VetPage />} />
            <Route path="/vet/vaccines" element={<VaccinesPage />} />

            {/* Tracking */}
            <Route path="/tracking/weight" element={<PlaceholderPage title="Weight & growth chart" day={12} />} />
            <Route path="/tracking/mood" element={<PlaceholderPage title="Mood log" day={13} />} />
            <Route path="/tracking/activity" element={<PlaceholderPage title="Activity log" day={13} />} />

            {/* Tools */}
            <Route path="/breed-id" element={<PlaceholderPage title="Breed identifier (AI)" day={16} />} />
            <Route path="/training" element={<PlaceholderPage title="Training tips" day={19} />} />
            <Route path="/reproductive" element={<PlaceholderPage title="Reproductive cycle tracker" day={18} />} />

            {/* Breeder */}
            <Route path="/breeder" element={<PlaceholderPage title="Breeder dashboard" day={22} />} />
            <Route path="/breeder/litters" element={<PlaceholderPage title="Litter management" day={22} />} />
            <Route path="/breeder/litters/:id" element={<PlaceholderPage title="Litter detail" day={23} />} />
            <Route path="/breeder/puppies/:id" element={<PlaceholderPage title="Puppy profile" day={23} />} />

            <Route path="/settings" element={<PlaceholderPage title="Settings" day={26} />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
