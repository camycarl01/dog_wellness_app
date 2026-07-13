import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PawPrint, Pencil, ArrowLeft, Cake, Scale, Dog, Check, X, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { dogSchema } from '../lib/dogSchema'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

function ageFromDob(dob) {
  if (!dob) return '—'
  const birth = new Date(dob)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months--
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem} mo old`
  return rem === 0 ? `${years} yr old` : `${years} yr ${rem} mo old`
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon size={17} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export default function DogProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dog, setDog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(dogSchema) })

  const sex = watch('sex')
  const fixedLabel = sex === 'female' ? 'Spayed' : sex === 'male' ? 'Neutered' : 'Neutered / spayed'

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await api.get(`/api/dogs/${id}`)
        if (!active) return
        setDog(data)
        reset({
          name: data.name, breed: data.breed, dob: data.dob,
          sex: data.sex, weight_kg: data.weight_kg, is_neutered: data.is_neutered,
        })
      } catch (err) {
        if (active) setError(err.response?.data?.detail || 'Could not load this dog.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id, reset])

  async function onSave(values) {
    setError('')
    try {
      const { data } = await api.put(`/api/dogs/${id}`, { ...values, photo_url: dog.photo_url })
      setDog(data)
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save changes.')
    }
  }

  const fieldError = (name) =>
    errors[name] ? <p className="text-sm text-destructive mt-1.5">{errors[name].message}</p> : null

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }
  if (error && !dog) {
    return (
      <div className="mx-auto max-w-2xl">
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      </div>
    )
  }
  if (!dog) return null

  const sexLabel = dog.sex === 'female' ? 'Female' : 'Male'

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-cursor="hover"
          >
            <ArrowLeft size={15} /> Back
          </button>
        </Reveal>

        {/* Hero */}
        <Reveal delay={0.05}>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary sm:size-24">
                {dog.photo_url
                  ? <img src={dog.photo_url} alt={dog.name} className="size-full object-cover" />
                  : <PawPrint size={30} className="text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Profile</p>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {dog.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dog.breed} · {ageFromDob(dog.dob)}
                </p>
              </div>
              {!editing && (
                <Magnetic>
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                    data-cursor="hover"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </Magnetic>
              )}
            </div>
          </div>
        </Reveal>

        {/* Body */}
        {!editing ? (
          <StaggerReveal className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow icon={Cake} label="Date of birth" value={dog.dob || '—'} />
            <DetailRow icon={Scale} label="Weight" value={`${dog.weight_kg} kg`} />
            <DetailRow icon={Dog} label="Sex" value={sexLabel} />
            <DetailRow
              icon={Check}
              label={sexLabel === 'Female' ? 'Spayed' : 'Neutered'}
              value={dog.is_neutered ? 'Yes' : 'No'}
            />
          </StaggerReveal>
        ) : (
          <Reveal>
            <form
              onSubmit={handleSubmit(onSave)}
              noValidate
              className="mt-4 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div>
                <label htmlFor="name" className={labelClass}>Name</label>
                <input id="name" className={inputClass} {...register('name')} />
                {fieldError('name')}
              </div>
              <div>
                <label htmlFor="breed" className={labelClass}>Breed</label>
                <input id="breed" className={inputClass} {...register('breed')} />
                {fieldError('breed')}
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="dob" className={labelClass}>Date of birth</label>
                  <input id="dob" type="date" className={inputClass} {...register('dob')} />
                  {fieldError('dob')}
                </div>
                <div>
                  <label htmlFor="weight_kg" className={labelClass}>Weight (kg)</label>
                  <input id="weight_kg" type="number" step="0.1" inputMode="decimal" className={inputClass} {...register('weight_kg')} />
                  {fieldError('weight_kg')}
                </div>
              </div>
              <div>
                <label htmlFor="sex" className={labelClass}>Sex</label>
                <select id="sex" className={inputClass} {...register('sex')}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {fieldError('sex')}
              </div>
              <Controller
                name="is_neutered"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3.5">
                    <span className="text-sm font-medium text-foreground">{fixedLabel}</span>
                    <button type="button" role="switch" aria-checked={field.value}
                      aria-label={fixedLabel}
                      onClick={() => field.onChange(!field.value)}
                      data-cursor="hover"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        field.value ? 'bg-primary' : 'bg-muted'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                        field.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )}
              />
              {error && (
                <p role="alert" className="text-sm text-destructive">{error}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Magnetic>
                  <button type="submit" disabled={isSubmitting} className="btn-primary" data-cursor="hover">
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={15} /> Save changes
                      </>
                    )}
                  </button>
                </Magnetic>
                <button
                  type="button"
                  onClick={() => { reset(); setEditing(false) }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  data-cursor="hover"
                >
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          </Reveal>
        )}
      </div>
    </PageTransition>
  )
}
