import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase'
import { DogProvider, useDogs } from '../context/DogContext'
import Magnetic from './motion/Magnetic'
import ThemeToggle from './ThemeToggle'
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
    <div className="mb-5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] px-3 mb-1.5">{label}</p>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          data-cursor="link"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Icon size={16} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </div>
  )
}

function DogSwitcher() {
  const { dogs, activeDogId, setActiveDogId, loading } = useDogs()

  if (loading) {
    return (
      <div className="px-3 mb-5">
        <div className="h-9 rounded-lg bg-secondary animate-pulse" />
      </div>
    )
  }
  if (!dogs.length) {
    return (
      <div className="px-3 mb-5">
        <NavLink
          to="/dogs/new"
          data-cursor="link"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-accent hover:border-accent/50 transition-colors"
        >
          + Add your first dog
        </NavLink>
      </div>
    )
  }

  return (
    <div className="px-3 mb-5">
      <label htmlFor="dog-switcher" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Active dog</label>
      <div className="relative mt-1.5">
        <select
          id="dog-switcher"
          value={activeDogId ?? ''}
          onChange={(e) => setActiveDogId(e.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-secondary px-3 py-2 pr-8 text-sm text-foreground focus:border-accent focus:outline-none transition-colors"
        >
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}

function AppLayoutInner() {
  const { displayName, isBreeder } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

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
    <aside className="flex flex-col h-full w-60 bg-card border-r border-border px-3 py-5">
      {/* Logo */}
      <NavLink to="/dashboard" data-cursor="link" className="flex items-center gap-2.5 px-3 mb-7 group">
        <div className="size-8 bg-accent rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-8deg]">
          <PawPrint size={15} className="text-accent-foreground" />
        </div>
        <span className="font-semibold text-foreground text-[15px] tracking-tight">PawCare</span>
      </NavLink>

      {/* Dog switcher */}
      <DogSwitcher />

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto">
        {navGroups.map((g) => <NavGroup key={g.label} {...g} />)}

        {isBreeder && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] px-3 mb-1.5">Breeder</p>
            <NavLink to="/breeder" data-cursor="link" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={16} strokeWidth={1.75} />
              Litter management
            </NavLink>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border pt-3 mt-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
          <div className="size-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[11px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
          </div>
          <ThemeToggle className="size-7 shrink-0" />
        </div>
        <NavLink to="/settings" data-cursor="link" className={({ isActive }) => `nav-link text-xs mt-1 ${isActive ? 'active' : ''}`}>
          <Settings size={14} strokeWidth={1.75} />
          Settings
        </NavLink>
        <button
          onClick={handleSignOut}
          data-cursor="link"
          className="nav-link w-full text-left text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full z-50 animate-slide-in">
            {sidebar}
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 -right-11 size-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <PawPrint size={15} className="text-accent" />
            <span className="font-semibold text-foreground text-sm">PawCare</span>
          </div>
          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto" key={pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <DogProvider>
      <AppLayoutInner />
    </DogProvider>
  )
}
