import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Activity, Plus, Loader2, Timer } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

const ENERGY_LEVELS = ['low', 'normal', 'high']

function energyColor(level) {
  if (level === 'low') return 'text-blue-400'
  if (level === 'normal') return 'text-green-400'
  return 'text-orange-400'
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ActivityPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { walk_minutes: 0, play_minutes: 0, energy_level: 'normal', notes: '' },
  })

  useEffect(() => {
    if (!activeDog) return
    setLoading(true)
    api.get(`/api/activity-logs/${activeDog.id}`)
      .then((res) => setLogs([...(res.data || [])].reverse()))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [activeDog])

  async function onSubmit(values) {
    setServerError('')
    try {
      const { data } = await api.post('/api/activity-logs', {
        dog_id: activeDog.id,
        walk_minutes: Number(values.walk_minutes) || 0,
        play_minutes: Number(values.play_minutes) || 0,
        energy_level: values.energy_level,
        notes: values.notes || null,
      })
      setLogs((prev) => [data, ...prev])
      reset()
      setShowForm(false)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not save activity log.')
    }
  }

  if (dogLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 flex flex-col gap-3">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!activeDog) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-dashed border-border py-20 px-4 text-center">
          <Activity size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to start tracking activity.</p>
          <Link to="/dogs/new" className="btn-primary mt-6" data-cursor="hover">
            <Plus size={15} /> Add a dog
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Tracking</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                Activity log
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Record walks and playtime for {activeDog.name}.
              </p>
            </div>
            <Magnetic>
              <button
                onClick={() => setShowForm((s) => !s)}
                className="btn-primary"
                data-cursor="hover"
              >
                <Plus size={15} /> Log activity
              </button>
            </Magnetic>
          </div>
        </Reveal>

        {showForm && (
          <Reveal className="mt-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex flex-col gap-5 p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Walk duration (minutes)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      {...register('walk_minutes', { min: { value: 0, message: 'Cannot be negative' } })}
                    />
                    {errors.walk_minutes && (
                      <p className="mt-1 text-sm text-destructive">{errors.walk_minutes.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Play duration (minutes)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      {...register('play_minutes', { min: { value: 0, message: 'Cannot be negative' } })}
                    />
                    {errors.play_minutes && (
                      <p className="mt-1 text-sm text-destructive">{errors.play_minutes.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Energy level</label>
                  <select className={inputClass} {...register('energy_level')}>
                    {ENERGY_LEVELS.map((l) => (
                      <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea
                    rows={3}
                    className={inputClass + ' h-auto resize-none py-2.5'}
                    placeholder="e.g. Off-lead at the park"
                    {...register('notes')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/50 px-6 py-4">
                {serverError
                  ? <p role="alert" className="text-sm text-destructive">{serverError}</p>
                  : <span className="text-xs text-muted-foreground">Log today&apos;s activity for {activeDog.name}.</span>}
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0" data-cursor="hover">
                  {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save activity'}
                </button>
              </div>
            </form>
          </Reveal>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : logs.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <Activity size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No activity logs yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Tap &quot;Log activity&quot; to record {activeDog.name}&apos;s first session.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className={`text-sm font-semibold capitalize ${energyColor(log.energy_level)}`}>
                          {log.energy_level} energy
                        </p>
                        <p className="text-xs text-muted-foreground">{fmtDate(log.logged_at)}</p>
                      </div>
                      {log.notes && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{log.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-right">
                      {log.walk_minutes > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Walk</p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground flex items-center gap-1 justify-end">
                            <Timer size={12} /> {log.walk_minutes}m
                          </p>
                        </div>
                      )}
                      {log.play_minutes > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Play</p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground flex items-center gap-1 justify-end">
                            <Timer size={12} /> {log.play_minutes}m
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </StaggerReveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
