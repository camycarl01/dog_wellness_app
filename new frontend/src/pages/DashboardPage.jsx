import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDogs } from '../context/DogContext'
import { Reveal, TextReveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import {
  HeartPulse, Utensils, Syringe, Weight, PawPrint,
  Plus, Activity, Calendar, ArrowUpRight, Dog as DogIcon
} from 'lucide-react'

const quickActions = [
  { icon: HeartPulse, label: 'Check symptoms', to: '/health' },
  { icon: Utensils, label: 'Log a meal', to: '/nutrition/log' },
  { icon: Weight, label: 'Log weight', to: '/tracking/weight' },
  { icon: Syringe, label: 'Vaccine tracker', to: '/vet/vaccines' },
  { icon: Activity, label: 'Log activity', to: '/tracking/activity' },
  { icon: Calendar, label: 'Book vet visit', to: '/vet' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function ActiveDogCard({ dog }) {
  const age = dog.dob
    ? Math.max(0, Math.floor((Date.now() - new Date(dog.dob)) / (365.25 * 24 * 3600 * 1000)))
    : null

  return (
    <Link
      to={`/dogs/${dog.id}`}
      data-cursor="hover"
      className="panel group relative flex items-center gap-5 overflow-hidden p-6 transition-colors hover:border-accent/40"
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent/10">
        {dog.photo_url ? (
          <img src={dog.photo_url} alt={dog.name} className="size-full object-cover" />
        ) : (
          <DogIcon size={28} className="text-accent" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Active dog</p>
        <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-foreground">{dog.name}</h2>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {[dog.breed, age !== null ? `${age} yr${age === 1 ? '' : 's'}` : null, dog.weight_kg ? `${dog.weight_kg} kg` : null]
            .filter(Boolean)
            .join(' · ') || 'Profile'}
        </p>
      </div>
      <ArrowUpRight
        size={18}
        className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="panel border-dashed px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent/10">
        <PawPrint size={28} className="text-accent" />
      </div>
      <h2 className="mb-1 text-base font-semibold text-foreground">Add your first dog</h2>
      <p className="mx-auto mb-6 max-w-xs text-sm text-muted-foreground text-pretty">
        Create a profile to start tracking health, meals, vaccines, and more.
      </p>
      <Magnetic strength={0.2}>
        <Link to="/dogs/new" data-cursor="hover" className="btn-primary">
          <Plus size={16} />
          Add a dog
        </Link>
      </Magnetic>
    </div>
  )
}

export default function DashboardPage() {
  const { displayName } = useAuth()
  const { dogs, activeDogId, loading } = useDogs()
  const firstName = displayName.split(' ')[0]
  const activeDog = dogs.find((d) => d.id === activeDogId) ?? dogs[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Reveal stagger={0.08}>
        {/* Greeting */}
        <div data-reveal className="mb-10">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">Dashboard</p>
          <TextReveal
            as="h1"
            text={`${greeting()}, ${firstName}.`}
            className="text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl"
          />
          <p className="mt-2 text-sm text-muted-foreground">Let&apos;s take care of your dog today.</p>
        </div>

        {/* Active dog / empty state */}
        <div data-reveal className="mb-10">
          {loading ? (
            <div className="panel h-28 animate-pulse" />
          ) : activeDog ? (
            <ActiveDogCard dog={activeDog} />
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Quick actions */}
        <div data-reveal>
          <h2 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActions.map(({ icon: Icon, label, to }) => (
              <Link
                key={to}
                to={to}
                data-cursor="hover"
                className="panel group flex items-center gap-3 p-4 transition-colors hover:border-accent/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                  <Icon size={17} strokeWidth={1.75} />
                </div>
                <span className="text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  )
}
