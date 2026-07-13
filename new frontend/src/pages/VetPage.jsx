import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Loader2, X } from 'lucide-react'
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

export default function VetPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { visit_date: '', reason: '', notes: '', next_due_date: '', vet_name: '' },
  })

  useEffect(() => {
    if (!activeDog) return
    setLoading(true)
    api.get(`/api/vet-visits/${activeDog.id}`)
      .then((res) => setVisits(res.data))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false))
  }, [activeDog])

  async function onSubmit(values) {
    setServerError('')
    try {
      const payload = {
        dog_id: activeDog.id,
        ...values,
        notes: values.notes || null,
        next_due_date: values.next_due_date || null,
        vet_name: values.vet_name || null,
      }
      const { data } = await api.post('/api/vet-visits', payload)
      setVisits((prev) => [data, ...prev])
      reset()
      setShowForm(false)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Something went wrong.')
    }
  }

  const fieldError = (name) =>
    errors[name] ? <p className="text-sm text-destructive mt-1.5">{errors[name].message}</p> : null

  if (dogLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
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
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Calendar size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to start tracking vet visits.</p>
          <Link to="/dogs/new" className="btn-primary mt-6" data-cursor="hover">
            <Plus size={15} /> Add a dog
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Health log</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                Vet visits
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {activeDog.name}&apos;s appointment history.
              </p>
            </div>
            <Magnetic>
              <button
                onClick={() => setShowForm((s) => !s)}
                className={showForm
                  ? 'inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40'
                  : 'btn-primary'}
                data-cursor="hover"
              >
                {showForm ? <X size={15} /> : <Plus size={15} />}
                {showForm ? 'Close' : 'Add visit'}
              </button>
            </Magnetic>
          </div>
        </Reveal>

        {/* Add form */}
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
                    <label htmlFor="visit_date" className={labelClass}>Visit date</label>
                    <input id="visit_date" type="date" className={inputClass}
                      {...register('visit_date', { required: 'Visit date is required' })} />
                    {fieldError('visit_date')}
                  </div>
                  <div>
                    <label htmlFor="next_due_date" className={labelClass}>Next due date (optional)</label>
                    <input id="next_due_date" type="date" className={inputClass} {...register('next_due_date')} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className={labelClass}>Reason</label>
                  <input id="reason" className={inputClass} placeholder="e.g. Annual checkup"
                    {...register('reason', { required: 'Reason is required' })} />
                  {fieldError('reason')}
                </div>

                <div>
                  <label htmlFor="vet_name" className={labelClass}>Vet name (optional)</label>
                  <input id="vet_name" className={inputClass} placeholder="e.g. Dr. Mensah" {...register('vet_name')} />
                </div>

                <div>
                  <label htmlFor="notes" className={labelClass}>Notes (optional)</label>
                  <textarea id="notes" rows={3}
                    className={inputClass + ' h-auto resize-none py-2.5'}
                    placeholder="Anything worth remembering..." {...register('notes')} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/50 px-6 py-4">
                {serverError
                  ? <p role="alert" className="text-sm text-destructive">{serverError}</p>
                  : <span className="text-xs text-muted-foreground">Log a completed or upcoming visit.</span>}
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0" data-cursor="hover">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save visit'
                  )}
                </button>
              </div>
            </form>
          </Reveal>
        )}

        {/* Visits list */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : visits.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <Calendar size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No vet visits logged yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first visit to start the history.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {visits.map((v) => (
                <div
                  key={v.id}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{v.reason}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtDate(v.visit_date)}{v.vet_name ? ` · ${v.vet_name}` : ''}
                      </p>
                      {v.notes && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.notes}</p>}
                    </div>
                    {v.next_due_date && (
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Next due</p>
                        <p className="mt-0.5 text-sm font-medium text-primary">{fmtDate(v.next_due_date)}</p>
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
