import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, HeartPulse, Plus } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import PageTransition from '../components/motion/PageTransition'

const SEVERITY_BADGE = {
  mild: 'bg-green-500/10 text-green-600 dark:text-green-400',
  moderate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  severe: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  emergency: 'bg-red-500/10 text-red-600 dark:text-red-400',
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

  if (dogLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 flex flex-col gap-3">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!activeDog) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <History size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to see symptom history.</p>
          <Link to="/dogs/new" className="btn-primary mt-6" data-cursor="hover">
            <Plus size={15} /> Add a dog
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Health log</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                Symptom history
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {activeDog.name}&apos;s past checks.
              </p>
            </div>
            <Magnetic>
              <Link to="/health" className="btn-primary" data-cursor="hover">
                <HeartPulse size={16} /> New check
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : error ? (
            <Reveal>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </Reveal>
          ) : logs.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <History size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No symptom checks logged yet.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{log.prediction}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(log.logged_at)}</p>
                    </div>
                    <span className={`shrink-0 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_BADGE[log.severity] || SEVERITY_BADGE.mild}`}>
                      {log.severity?.charAt(0).toUpperCase() + log.severity?.slice(1)}
                    </span>
                  </div>
                  {log.symptoms && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {Object.entries(log.symptoms)
                        .filter(([, v]) => v)
                        .map(([k]) => k.replace(/_/g, ' '))
                        .join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </StaggerReveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
