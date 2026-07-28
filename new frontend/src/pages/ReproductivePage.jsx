import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Heart, Plus, Loader2, CalendarRange, Info } from 'lucide-react'
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

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function ReproductivePage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [cycles, setCycles] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [notEligible, setNotEligible] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { start_date: '', end_date: '', notes: '' },
  })

  useEffect(() => {
    if (!activeDog) return
    setLoading(true)
    setNotEligible(false)
    setServerError('')
    Promise.allSettled([
      api.get(`/api/heat-cycles/${activeDog.id}`),
      api.get(`/api/predict/next-cycle/${activeDog.id}`),
    ]).then(([cyclesRes, predRes]) => {
      if (cyclesRes.status === 'fulfilled') {
        setCycles([...(cyclesRes.value.data || [])].reverse())
      } else if (cyclesRes.reason?.response?.status === 400) {
        setNotEligible(true)
      }
      if (predRes.status === 'fulfilled') {
        setPrediction(predRes.value.data)
      }
    }).finally(() => setLoading(false))
  }, [activeDog])

  async function onSubmit(values) {
    setServerError('')
    try {
      const { data } = await api.post('/api/heat-cycles', {
        dog_id: activeDog.id,
        start_date: values.start_date,
        end_date: values.end_date || null,
        notes: values.notes || null,
      })
      setCycles((prev) => [data, ...prev])
      // Re-fetch the prediction with the new data
      api.get(`/api/predict/next-cycle/${activeDog.id}`)
        .then((res) => setPrediction(res.data))
        .catch(() => {})
      reset()
      setShowForm(false)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not save heat cycle.')
    }
  }

  if (dogLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 flex flex-col gap-3">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!activeDog) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-dashed border-border py-20 px-4 text-center">
          <Heart size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to use the reproductive cycle tracker.</p>
          <Link to="/dogs/new" className="btn-primary mt-6" data-cursor="hover">
            <Plus size={15} /> Add a dog
          </Link>
        </div>
      </PageTransition>
    )
  }

  if (notEligible) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Reproductive</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
              Cycle tracker
            </h1>
          </Reveal>
          <Reveal className="mt-8">
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
              <Info size={20} className="shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Not available for {activeDog.name}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  Heat cycle tracking is only available for non-neutered female dogs. {activeDog.name} does not meet this criteria based on the profile settings.
                </p>
                <Link to={`/dogs/${activeDog.id}`} className="mt-4 inline-flex btn-primary text-sm" data-cursor="hover">
                  Update profile
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </PageTransition>
    )
  }

  const daysUntilNext = prediction?.predicted_start ? daysUntil(prediction.predicted_start) : null

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Reproductive</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                Cycle tracker
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Track {activeDog.name}&apos;s heat cycles and predict the next one.
              </p>
            </div>
            <Magnetic>
              <button
                onClick={() => setShowForm((s) => !s)}
                className="btn-primary"
                data-cursor="hover"
              >
                <Plus size={15} /> Log cycle
              </button>
            </Magnetic>
          </div>
        </Reveal>

        {/* Prediction card */}
        {!loading && prediction && (
          <Reveal className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarRange size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Next cycle prediction</h2>
              </div>
              {prediction.message ? (
                <p className="text-sm text-muted-foreground">{prediction.message}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <PredStat
                    label="Predicted start"
                    value={fmtDate(prediction.predicted_start)}
                    sub={daysUntilNext !== null ? (daysUntilNext >= 0 ? `in ${daysUntilNext} days` : `${Math.abs(daysUntilNext)} days ago`) : null}
                  />
                  <PredStat label="Breeding window start" value={fmtDate(prediction.breeding_window_start)} />
                  <PredStat label="Breeding window end" value={fmtDate(prediction.breeding_window_end)} />
                  <PredStat label="Avg cycle" value={prediction.average_cycle_days ? `${prediction.average_cycle_days} days` : '—'} />
                </div>
              )}
            </div>
          </Reveal>
        )}

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
                    <label className={labelClass}>Start date</label>
                    <input
                      type="date"
                      className={inputClass}
                      {...register('start_date', { required: 'Start date is required' })}
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-destructive">{errors.start_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>End date (optional)</label>
                    <input type="date" className={inputClass} {...register('end_date')} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea
                    rows={3}
                    className={inputClass + ' h-auto resize-none py-2.5'}
                    placeholder="Any observations..."
                    {...register('notes')}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/50 px-6 py-4">
                {serverError
                  ? <p role="alert" className="text-sm text-destructive">{serverError}</p>
                  : <span className="text-xs text-muted-foreground">Record a heat cycle for {activeDog.name}.</span>}
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0" data-cursor="hover">
                  {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save cycle'}
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
          ) : cycles.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <Heart size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No heat cycles logged yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Log at least 2 cycles to enable next-cycle prediction.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {fmtDate(cycle.start_date)}{cycle.end_date ? ` — ${fmtDate(cycle.end_date)}` : ' (ongoing)'}
                      </p>
                      {cycle.notes && (
                        <p className="mt-1.5 text-sm text-muted-foreground">{cycle.notes}</p>
                      )}
                    </div>
                    {cycle.start_date && cycle.end_date && (
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Duration</p>
                        <p className="mt-0.5 text-sm font-medium text-primary">
                          {Math.ceil((new Date(cycle.end_date) - new Date(cycle.start_date)) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    )}
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

function PredStat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-primary">{sub}</p>}
    </div>
  )
}
