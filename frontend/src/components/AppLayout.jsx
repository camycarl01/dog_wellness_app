import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase'
import {
  LayoutDashboard, HeartPulse, Utensils, Stethoscope,
  TrendingUp, Dog, Camera, BookOpen, FlaskConical,
  Users, Settings, LogOut, Menu, X, PawPrint, ChevronDown
} from 'lucide-react'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/dogs/new', icon: Dog, label: 'Add dog' },
    ]
  },
  {
    label: 'Health',
    items: [
      { to: '/health', icon: HeartPulse, label: 'Symptom checker' },
      { to: '/vet', icon: Stethoscope, label: 'Vet visits' },
      { to: '/vet/vaccines', icon: FlaskConical, label: 'Vaccines' },
    ]
  },
  {
    label: 'Nutrition',
    items: [
      { to: '/nutrition', icon: Utensils, label: 'Feeding plan' },
      { to: '/nutrition/toxic-foods', icon: BookOpen, label: 'Toxic foods' },
    ]
  },
  {
    label: 'Tracking',
    items: [
      { to: '/tracking/weight', icon: TrendingUp, label: 'Weight & growth' },
      { to: '/tracking/activity', icon: TrendingUp, label: 'Activity log' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { to: '/breed-id', icon: Camera, label: 'Breed identifier' },
      { to: '/training', icon: BookOpen, label: 'Training tips' },
    ]
  },
]

function NavGroup({ label, items }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{label}</p>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </div>
  )
}

export default function AppLayout() {
  const { displayName, isBreeder } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sidebar = (
    <aside className="flex flex-col h-full w-60 bg-white border-r border-gray-100 px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
          <PawPrint size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-900 text-base">PawCare</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((g) => <NavGroup key={g.label} {...g} />)}

        {/* Breeder section */}
        {isBreeder && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Breeder</p>
            <NavLink to="/breeder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={17} />
              Litter management
            </NavLink>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 pt-3 mt-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{displayName}</p>
          </div>
        </div>
        <NavLink to="/settings" className={({ isActive }) => `nav-link text-xs mt-1 ${isActive ? 'active' : ''}`}>
          <Settings size={15} />
          Settings
        </NavLink>
        <button onClick={handleSignOut} className="nav-link w-full text-left text-xs text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <PawPrint size={16} className="text-teal-600" />
            <span className="font-semibold text-gray-900">PawCare</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
