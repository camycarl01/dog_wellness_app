import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { HeartPulse, Thermometer, Plus, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'
import { Reveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'

const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

const SYMPTOMS = [
  { key: 'lethargy', label: 'Lethargy' },
  { key: 'vomiting', label: 'Vomiting' },
  { key: 'diarrhea', label: 'Diarrhea' },
  { key: 'loss_of_appetite', label: 'Loss of appetite' },
  { key: 'coughing', label: 'Coughing' },
  { key: 'sneezing', label: 'Sneezing' },
  { key: 'limping', label: 'Limping' },
  { key: 'scratching', label: 'Scratching' },
  { key: 'eye_discharge', label: 'Eye discharge' },
  { key: 'nasal_discharge', label: 'Nasal discharge' },
  { key: 'swelling', label: 'Swelling' },
  { key: 'seizure', label: 'Seizure' },
]

export default function HealthPage() {
  const { activeDog, loading: dogLoading } = useDogs()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      ...Object.fromEntries(SYMPTOMS.map((s) => [s.key, false])),
      duration_days: 1,
      temperature: '',
    },
  })

  const selectedCount = SYMPTOMS.filter((s) => watch(s.key)).length

  async function onSubmit(values) {
    setServerError('')
    const symptoms = Object.fromEntries(SYMPTOMS.map((s) => [s.key, !!values[s.key]]))

    try {
      const { data } = await api.post('/api/predict/illness', {
        dog_id: activeDog.id,
        symptoms,
        duration_days: Number(values.duration_days) || 1,
        temperature: values.temperature ? Number(values.temperature) : null,
      })
      navigate('/health/result', { state: { result: data } })
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Something went wrong.')
    }
  }

  if (dogLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 flex flex-col gap-3">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  if (!activeDog) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <HeartPulse size={28} className="text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Add a dog to use the symptom checker.</p>
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
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Health log</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Symptom checker
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Checking for {activeDog.name}.
          </p>
        </Reveal>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-foreground mb-4">
                Select any symptoms your dog is showing
                {selectedCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-primary">({selectedCount} selected)</span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SYMPTOMS.map((s) => (
                  <label
                    key={s.key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:border-primary/40 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                  >
                    <input type="checkbox" className="accent-primary" {...register(s.key)} />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>How many days has this been going on?</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    {...register('duration_days', { required: true, min: 1 })}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <Thermometer size={14} /> Temperature °C (optional)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 39.2"
                    className={inputClass}
                    {...register('temperature')}
                  />
                </div>
              </div>
            </div>
          </Reveal>

          {serverError && (
            <p role="alert" className="mt-4 text-sm text-destructive">{serverError}</p>
          )}

          <Magnetic className="mt-6 block w-full">
            <button
              type="submit"
              disabled={isSubmitting || selectedCount === 0}
              className="btn-primary w-full justify-center disabled:opacity-50"
              data-cursor="hover"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Checking...
                </>
              ) : (
                'Check symptoms'
              )}
            </button>
          </Magnetic>
          {selectedCount === 0 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Select at least one symptom to continue.
            </p>
          )}
        </form>
      </div>
    </PageTransition>
  )
}
