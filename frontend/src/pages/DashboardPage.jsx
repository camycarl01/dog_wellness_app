import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDogs } from '../context/DogContext'
import { ageFromDob } from '../lib/utils'
import {
  HeartPulse, Utensils, Syringe, Weight, PawPrint,
  Plus, Activity, Calendar, Loader2
} from 'lucide-react'

const quickActions = [
  { icon: HeartPulse, label: 'Check symptoms', to: '/health', color: 'text-red-500 bg-red-50' },
  { icon: Utensils, label: 'Log a meal', to: '/nutrition/log', color: 'text-amber-500 bg-amber-50' },
  { icon: Weight, label: 'Log weight', to: '/tracking/weight', color: 'text-blue-500 bg-blue-50' },
  { icon: Syringe, label: 'Vaccine tracker', to: '/vet/vaccines', color: 'text-teal-600 bg-teal-50' },
  { icon: Activity, label: 'Log activity', to: '/tracking/activity', color: 'text-purple-500 bg-purple-50' },
  { icon: Calendar, label: 'Book vet visit', to: '/vet', color: 'text-green-600 bg-green-50' },
]

export default function DashboardPage() {
  const { displayName } = useAuth()
  const firstName = displayName.split(' ')[0]
  const { dogs, activeDogId, loading } = useDogs()

  const activeDog = dogs.find((d) => d.id === activeDogId) || null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Let's take care of your dog today.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : dogs.length === 0 ? (
        <div className="card border-dashed border-gray-200 text-center py-14 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-2xl mb-4">
            <PawPrint size={28} className="text-teal-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Add your first dog</h2>
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
            Create a profile to start tracking health, meals, vaccines, and more.
          </p>
          <Link to="/dogs/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Add a dog
          </Link>
        </div>
      ) : activeDog ? (
        <>
          <Link
            to={`/dogs/${activeDog.id}`}
            className="card flex items-center gap-4 mb-3 hover:shadow-sm transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center overflow-hidden shrink-0">
              {activeDog.photo_url ? (
                <img src={activeDog.photo_url} alt={activeDog.name} className="w-full h-full object-cover" />
              ) : (
                <PawPrint size={24} className="text-teal-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{activeDog.name}</h3>
              <p className="text-sm text-gray-500 truncate">
                {activeDog.breed} · {ageFromDob(activeDog.dob)}
              </p>
            </div>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="card py-4">
              <div className="flex items-center gap-2 mb-1">
                <HeartPulse size={16} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Health status</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">Not checked yet</p>
            </div>
            <div className="card py-4">
              <div className="flex items-center gap-2 mb-1">
                <Utensils size={16} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today's feeding</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">Not set yet</p>
            </div>
            <div className="card py-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next vet visit</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">Not set yet</p>
            </div>
          </div>
        </>
      ) : null}

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickActions.map(({ icon: Icon, label, to, color }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} shrink-0`}>
              <Icon size={18} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}