import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Smile, Plus, Loader2 } from 'lucide-react'
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

const MOOD_LABELS = ['anxious', 'calm', 'playful', 'lethargic', 'aggressive']

const MOOD_SCORE_CONFIG = [
  { score: 1, label: 'Very low' },
  { score: 2, label: 'Low' },
  { score: 3, label: 'Neutral' },
  { score: 4, label: 'Good' },
  { score: 5, label: 'Great' },
]

function scoreColor(score) {
  if (score <= 2) return 'text-red-400'
  if (score === 3) return 'text-yellow-400'
  return 'text-green-400'
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function MoodPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { mood_score: 3, mood_label: 'calm', notes: '' },
  })

  const currentScore = Number(watch('mood_score'))

  useEffect(() => {
    if (!activeDog) return
    setLoading(true)
    api.get(`/api/mood-logs/${activeDog.id}`)
      .then((res) => setLogs([...(res.data || [])].reverse()))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [activeDog])

  async function onSubmit(values) {
    setServerError('')
    try {
      const { data } = await api.post('/api/mood-logs', {
        dog_id: activeDog.id,
        mood_score: Number(values.mood_score),
        mood_label: values.mood_label,
        notes: values.notes || null,
      })
      setLogs((prev) => [data, ...prev])
      reset()
      setShowForm(false)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not save mood log.')
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
          <Smile size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to start tracking mood.</p>
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
                Mood log
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Track how {activeDog.name} is feeling each day.
              </p>
            </div>
            <Magnetic>
              <button
                onClick={() => setShowForm((s) => !s)}
                className="btn-primary"
                data-cursor="hover"
              >
                <Plus size={15} /> Log mood
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
                <div>
                  <label className={labelClass}>
                    Mood score — <span className={`font-semibold ${scoreColor(currentScore)}`}>
                      {MOOD_SCORE_CONFIG.find((m) => m.score === currentScore)?.label}
                    </span>
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">1</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1 accent-primary"
                      {...register('mood_score')}
                    />
                    <span className="text-xs text-muted-foreground">5</span>
                  </div>
                  <div className="mt-1 flex justify-between px-4">
                    {MOOD_SCORE_CONFIG.map((m) => (
                      <span key={m.score} className="text-[10px] text-muted-foreground">{m.label}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Mood label</label>
                  <select className={inputClass} {...register('mood_label')}>
                    {MOOD_LABELS.map((l) => (
                      <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea
                    rows={3}
                    className={inputClass + ' h-auto resize-none py-2.5'}
                    placeholder="Any context worth recording..."
                    {...register('notes')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/50 px-6 py-4">
                {serverError
                  ? <p role="alert" className="text-sm text-destructive">{serverError}</p>
                  : <span className="text-xs text-muted-foreground">Record {activeDog.name}&apos;s mood right now.</span>}
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0" data-cursor="hover">
                  {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save mood'}
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
                <Smile size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No mood logs yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Tap &quot;Log mood&quot; to record {activeDog.name}&apos;s first entry.</p>
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
                    <div className="min-w-0">
                      <p className="text-sm font-semibold capitalize text-foreground">{log.mood_label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(log.logged_at)}</p>
                      {log.notes && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{log.notes}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Score</p>
                      <p className={`mt-0.5 text-lg font-bold ${scoreColor(log.mood_score)}`}>{log.mood_score}/5</p>
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
