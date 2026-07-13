import { useLocation, useNavigate, Link } from 'react-router-dom'
import { HeartPulse, AlertTriangle, CheckCircle2, ArrowLeft, History } from 'lucide-react'
import { useDogs } from '../context/DogContext'

const SEVERITY_STYLES = {
  mild: { badge: 'bg-green-100 text-green-700', icon: CheckCircle2, iconColor: 'text-green-600' },
  moderate: { badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-600' },
  severe: { badge: 'bg-orange-100 text-orange-700', icon: AlertTriangle, iconColor: 'text-orange-600' },
  emergency: { badge: 'bg-red-100 text-red-700', icon: AlertTriangle, iconColor: 'text-red-600' },
}

export default function HealthResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeDog } = useDogs()
  const result = location.state?.result

  if (!result) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-gray-500 mb-4">No result to show — run a symptom check first.</p>
        <Link to="/health" className="text-teal-600 text-sm font-medium hover:underline">
          Go to symptom checker
        </Link>
      </div>
    )
  }

  const style = SEVERITY_STYLES[result.severity] || SEVERITY_STYLES.mild
  const Icon = style.icon
  const isUrgent = result.severity === 'severe' || result.severity === 'emergency'
  const confidencePct = Math.round((result.confidence || 0) * 100)

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate('/health')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} /> Check again
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-6 flex items-center gap-4 border-b border-gray-100">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
              <Icon size={22} className={style.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">
                {activeDog?.name ? `${activeDog.name}'s result` : 'Result'}
              </p>
              <h1 className="text-xl font-semibold text-gray-900 truncate">{result.prediction}</h1>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                {result.severity?.charAt(0).toUpperCase() + result.severity?.slice(1)}
              </span>
              <span className="text-xs text-gray-400">{confidencePct}% confidence</span>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1.5">Recommendation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.recommendation}</p>
            </div>

            {isUrgent && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  This may need urgent attention. Please contact your vet as soon as possible.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-6 sm:px-8 py-4 flex flex-wrap gap-3">
            <Link
              to="/vet"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Book a vet visit
            </Link>
            <Link
              to="/health/history"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <History size={15} /> View history
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4 max-w-sm mx-auto">
          This is an automated estimate, not a diagnosis. Always consult a vet for medical concerns.
        </p>
      </div>
    </div>
  )
}