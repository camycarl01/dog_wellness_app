import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ArrowLeft, HeartPulse } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'

const SEVERITY_BADGE = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-700',
  severe: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function HealthHistoryPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!activeDog) return
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/api/predict/illness/${activeDog.id}`)
        if (active) setLogs(data || [])
      } catch (err) {
        if (active) {
          setLogs([])
          setError(err.response?.data?.detail || 'Could not load symptom history.')
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [activeDog])

  if (dogLoading) return <div className="p-10 text-center text-gray-400">Loading…</div>
  if (!activeDog) return <div className="p-10 text-center text-gray-500">Add a dog to see symptom history.</div>

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
              <History size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Symptom history</h1>
              <p className="text-sm text-gray-500">{activeDog.name}'s past checks</p>
            </div>
          </div>
          <Link
            to="/health"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <HeartPulse size={16} /> New check
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading history…</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <History size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No symptom checks logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{log.prediction}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(log.logged_at)}</p>
                  </div>
                  <span className={`shrink-0 inline-block text-xs font-medium px-2.5 py-1 rounded-full ${SEVERITY_BADGE[log.severity] || SEVERITY_BADGE.mild}`}>
                    {log.severity?.charAt(0).toUpperCase() + log.severity?.slice(1)}
                  </span>
                </div>
                {log.symptoms && (
                  <p className="text-xs text-gray-500 mt-2">
                    {Object.entries(log.symptoms)
                      .filter(([, v]) => v)
                      .map(([k]) => k.replace(/_/g, ' '))
                      .join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}