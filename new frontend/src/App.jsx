import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Cursor from './components/motion/Cursor'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import AddDog from './pages/AddDog'
import DogProfile from './pages/DogProfile'
import VetPage from './pages/VetPage'
import VaccinesPage from './pages/VaccinesPage'
import HealthPage from './pages/HealthPage'
import HealthResultPage from './pages/HealthResultPage'
import HealthHistoryPage from './pages/HealthHistoryPage'
import NutritionPage from './pages/NutritionPage'
import BreedIdPage from './pages/BreedIdPage'
import MoodPage from './pages/MoodPage'
import ActivityPage from './pages/ActivityPage'
import TrainingPage from './pages/TrainingPage'
import ToxicFoodsPage from './pages/ToxicFoodsPage'
import ReproductivePage from './pages/ReproductivePage'
import BreederPage from './pages/BreederPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Cursor />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<LandingPage />} />

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
              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/nutrition/log" element={<NutritionPage />} />
              <Route path="/nutrition/toxic-foods" element={<ToxicFoodsPage />} />

              {/* Vet */}
              <Route path="/vet" element={<VetPage />} />
              <Route path="/vet/vaccines" element={<VaccinesPage />} />

              {/* Tracking */}
              <Route path="/tracking/weight" element={<NutritionPage />} />
              <Route path="/tracking/mood" element={<MoodPage />} />
              <Route path="/tracking/activity" element={<ActivityPage />} />

              {/* Tools */}
              <Route path="/breed-id" element={<BreedIdPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/reproductive" element={<ReproductivePage />} />

              {/* Breeder */}
              <Route path="/breeder" element={<BreederPage />} />
              <Route path="/breeder/litters" element={<BreederPage />} />

              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
