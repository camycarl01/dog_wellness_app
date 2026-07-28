import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Utensils, Loader2, Plus, Scale } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function NutritionPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [recommendation, setRecommendation] = useState(null)
  const [feedingLogs, setFeedingLogs] = useState([])
  const [weightLogs, setWeightLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState('')
  const [activity, setActivity] = useState('moderate')

  const mealForm = useForm({
    defaultValues: { meal_time: 'morning', food_type: '', quantity_grams: '', notes: '' },
  })
  const weightForm = useForm({
    defaultValues: { weight_kg: '' },
  })

  useEffect(() => {
    if (!activeDog) return
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [recRes, mealsRes, weightRes] = await Promise.all([
          api.get(`/api/feeding-recommendation/${activeDog.id}`, { params: { activity } }),
          api.get(`/api/feeding-logs/${activeDog.id}`),
          api.get(`/api/weight-logs/${activeDog.id}`),
        ])
        if (!active) return
        setRecommendation(recRes.data)
        setFeedingLogs(mealsRes.data || [])
        setWeightLogs(weightRes.data || [])
      } catch (err) {
        if (active) setServerError(err.response?.data?.detail || 'Could not load nutrition data.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [activeDog, activity])

  async function onMealSubmit(values) {
    setServerError('')
    try {
      const payload = {
        dog_id: activeDog.id,
        meal_time: values.meal_time,
        food_type: values.food_type,
        quantity_grams: Number(values.quantity_grams),
        notes: values.notes || null,
      }
      const { data } = await api.post('/api/feeding-logs', payload)
      setFeedingLogs((prev) => [data, ...prev])
      mealForm.reset()
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not save meal log.')
    }
  }

  async function onWeightSubmit(values) {
    setServerError('')
    try {
      const { data } = await api.post('/api/weight-logs', {
        dog_id: activeDog.id,
        weight_kg: Number(values.weight_kg),
      })
      setWeightLogs((prev) => [data, ...prev])
      weightForm.reset()
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not save weight log.')
    }
  }

  if (dogLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-center text-muted-foreground">Loading…</div>
  }
  if (!activeDog) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-center text-muted-foreground">
        Add a dog to use feeding plans and logs.
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Nutrition</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Feeding plan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Daily guidance and recent logs for {activeDog.name}.</p>
        </div>

        {serverError && <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</p>}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recommendation</h2>
                <p className="text-sm text-muted-foreground">Server-calculated from weight and age.</p>
              </div>
              <select className={inputClass + ' w-36'} value={activity} onChange={(e) => setActivity(e.target.value)}>
                <option value="low">Low activity</option>
                <option value="moderate">Moderate activity</option>
                <option value="high">High activity</option>
              </select>
            </div>

            {loading ? (
              <div className="rounded-xl border border-border bg-secondary/30 p-6 text-sm text-muted-foreground">Loading recommendation…</div>
            ) : recommendation ? (
              <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="kcal/day" value={recommendation.kcal_per_day} />
                  <Stat label="grams/day" value={recommendation.grams_per_day} />
                  <Stat label="meals/day" value={recommendation.meals_per_day} />
                  <Stat label="grams/meal" value={recommendation.grams_per_meal} />
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{recommendation.notes}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No recommendation available yet.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Log a meal</h2>
            <form onSubmit={mealForm.handleSubmit(onMealSubmit)} className="space-y-4">
              <div>
                <label className={labelClass}>Meal time</label>
                <select className={inputClass} {...mealForm.register('meal_time')}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Food type</label>
                <input className={inputClass} placeholder="e.g. Chicken kibble" {...mealForm.register('food_type', { required: true })} />
              </div>
              <div>
                <label className={labelClass}>Quantity (grams)</label>
                <input type="number" step="0.1" className={inputClass} {...mealForm.register('quantity_grams', { required: true })} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea rows={3} className={inputClass + ' h-auto resize-none py-2.5'} {...mealForm.register('notes')} />
              </div>
              <button type="submit" className="btn-primary inline-flex items-center gap-2">
                <Plus size={15} /> Save meal
              </button>
            </form>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Recent meals</h2>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading meals…</div>
            ) : feedingLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">No meal logs yet.</div>
            ) : (
              <div className="space-y-3">
                {feedingLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.food_type}</p>
                        <p className="text-xs text-muted-foreground">{log.meal_time} · {fmtDate(log.logged_at)}</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{log.quantity_grams} g</span>
                    </div>
                    {log.notes && <p className="mt-2 text-sm text-foreground/70">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground"><Scale size={18} /> Weight logs</h2>
            <form onSubmit={weightForm.handleSubmit(onWeightSubmit)} className="mb-5 space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
              <div>
                <label className={labelClass}>Weight (kg)</label>
                <input type="number" step="0.1" className={inputClass} {...weightForm.register('weight_kg', { required: true })} />
              </div>
              <button type="submit" className="btn-primary inline-flex items-center gap-2">
                <Plus size={15} /> Save weight
              </button>
            </form>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading weights…</div>
            ) : weightLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">No weight logs yet.</div>
            ) : (
              <div className="space-y-3">
                {weightLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <p className="text-sm text-foreground/80">{fmtDate(log.logged_at)}</p>
                    <p className="text-sm font-medium text-foreground">{log.weight_kg} kg</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
