import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Plus, Syringe, Loader2, X } from 'lucide-react'
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

const STATUS = {
  up_to_date: { label: 'Up to date', cls: 'bg-primary/10 text-primary' },
  due_soon: { label: 'Due soon', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  overdue: { label: 'Overdue', cls: 'bg-destructive/10 text-destructive' },
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.up_to_date
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  )
}

export default function VaccinesPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const [vaccines, setVaccines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { vaccine_name: '', given_date: '', next_due_date: '' },
  })

  useEffect(() => {
    if (!activeDog) return
    setLoading(true)
    api.get(`/api/vaccines/${activeDog.id}`)
      .then((res) => setVaccines(res.data))
      .catch(() => setVaccines([]))
      .finally(() => setLoading(false))
  }, [activeDog])

  async function onSubmit(values) {
    setServerError('')
    try {
      const payload = { dog_id: activeDog.id, ...values }
      const { data } = await api.post('/api/vaccines', payload)
      setVaccines((prev) => [data, ...prev])
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
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }
  if (!activeDog) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Syringe size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to start tracking vaccines.</p>
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
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Immunity record</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                Vaccines
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {activeDog.name}&apos;s vaccination record.
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
                {showForm ? 'Close' : 'Add vaccine'}
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
                <div>
                  <label htmlFor="vaccine_name" className={labelClass}>Vaccine name</label>
                  <input id="vaccine_name" className={inputClass} placeholder="e.g. Rabies"
                    {...register('vaccine_name', { required: 'Vaccine name is required' })} />
                  {fieldError('vaccine_name')}
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="given_date" className={labelClass}>Date given</label>
                    <input id="given_date" type="date" className={inputClass}
                      {...register('given_date', { required: 'Date given is required' })} />
                    {fieldError('given_date')}
                  </div>
                  <div>
                    <label htmlFor="next_due_date" className={labelClass}>Next due date</label>
                    <input id="next_due_date" type="date" className={inputClass}
                      {...register('next_due_date', { required: 'Next due date is required' })} />
                    {fieldError('next_due_date')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/50 px-6 py-4">
                {serverError
                  ? <p role="alert" className="text-sm text-destructive">{serverError}</p>
                  : <span className="text-xs text-muted-foreground">Status is calculated from the next due date.</span>}
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0" data-cursor="hover">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save vaccine'
                  )}
                </button>
              </div>
            </form>
          </Reveal>
        )}

        {/* Vaccines list */}
        <div className="mt-8">
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          ) : vaccines.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <Syringe size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No vaccines recorded yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Add one to start tracking due dates.</p>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      <th className="px-5 py-3.5 font-medium">Vaccine</th>
                      <th className="px-5 py-3.5 font-medium">Given</th>
                      <th className="px-5 py-3.5 font-medium">Next due</th>
                      <th className="px-5 py-3.5 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccines.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                      >
                        <td className="px-5 py-3.5 font-medium text-foreground">{v.vaccine_name}</td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{fmtDate(v.given_date)}</td>
                        <td className="px-5 py-3.5 tabular-nums text-muted-foreground">{fmtDate(v.next_due_date)}</td>
                        <td className="px-5 py-3.5 text-right"><StatusBadge status={v.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
