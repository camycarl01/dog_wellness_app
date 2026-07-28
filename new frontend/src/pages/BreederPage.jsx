import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Users, Plus, Loader2, ChevronDown, ChevronUp, Dog as DogIcon, ExternalLink } from 'lucide-react'
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

function PuppyRow({ puppy, litterId }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <DogIcon size={13} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{puppy.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{puppy.sex}{puppy.colour ? ` · ${puppy.colour}` : ''}{puppy.weight_kg ? ` · ${puppy.weight_kg} kg` : ''}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {puppy.is_sold && (
          <span className="inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
            Sold
          </span>
        )}
        <a
          href={`/api/puppies/${puppy.id}/certificate`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          title="Download certificate PDF"
        >
          <ExternalLink size={12} /> Certificate
        </a>
      </div>
    </div>
  )
}

function LitterCard({ litter, dogs }) {
  const [expanded, setExpanded] = useState(false)
  const [puppies, setPuppies] = useState([])
  const [loadingPuppies, setLoadingPuppies] = useState(false)
  const [showAddPuppy, setShowAddPuppy] = useState(false)
  const [serverError, setServerError] = useState('')

  const motherName = dogs.find((d) => d.id === litter.mother_dog_id)?.name || 'Unknown mother'

  const puppyForm = useForm({
    defaultValues: { name: '', sex: 'male', weight_kg: '', colour: '', buyer_name: '', buyer_contact: '', is_sold: false, notes: '' },
  })

  const loadPuppies = () => {
    if (!expanded) {
      setExpanded(true)
      setLoadingPuppies(true)
      api.get(`/api/puppies/${litter.id}`)
        .then((res) => setPuppies(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingPuppies(false))
    } else {
      setExpanded(false)
    }
  }

  async function onAddPuppy(values) {
    setServerError('')
    try {
      const { data } = await api.post('/api/puppies', {
        litter_id: litter.id,
        name: values.name,
        sex: values.sex,
        weight_kg: values.weight_kg ? Number(values.weight_kg) : null,
        colour: values.colour || null,
        buyer_name: values.buyer_name || null,
        buyer_contact: values.buyer_contact || null,
        is_sold: Boolean(values.is_sold),
        notes: values.notes || null,
      })
      setPuppies((prev) => [...prev, data])
      puppyForm.reset()
      setShowAddPuppy(false)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not add puppy.')
    }
  }

  const soldCount = puppies.filter((p) => p.is_sold).length

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={loadPuppies}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-secondary/30 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Litter · {fmtDate(litter.birth_date)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Mother: {motherName}
            {litter.sire_name ? ` · Sire: ${litter.sire_name}` : ''}
            {' · '}{litter.puppy_count} puppy{litter.puppy_count !== 1 ? 'ies' : ''}
          </p>
          {litter.notes && (
            <p className="mt-1.5 text-xs text-muted-foreground">{litter.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {puppies.length > 0 && (
            <span className="text-xs text-muted-foreground">{soldCount}/{puppies.length} sold</span>
          )}
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-secondary/20 p-5 space-y-3">
          {loadingPuppies ? (
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
          ) : puppies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No puppies added yet.</p>
          ) : (
            <div className="space-y-2">
              {puppies.map((p) => (
                <PuppyRow key={p.id} puppy={p} litterId={litter.id} />
              ))}
            </div>
          )}

          {showAddPuppy ? (
            <form onSubmit={puppyForm.handleSubmit(onAddPuppy)} noValidate className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-foreground">Add puppy</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Name</label>
                  <input className={inputClass} {...puppyForm.register('name', { required: true })} />
                </div>
                <div>
                  <label className={labelClass}>Sex</label>
                  <select className={inputClass} {...puppyForm.register('sex')}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input type="number" step="0.01" className={inputClass} {...puppyForm.register('weight_kg')} />
                </div>
                <div>
                  <label className={labelClass}>Colour</label>
                  <input className={inputClass} placeholder="e.g. Black" {...puppyForm.register('colour')} />
                </div>
                <div>
                  <label className={labelClass}>Buyer name</label>
                  <input className={inputClass} {...puppyForm.register('buyer_name')} />
                </div>
                <div>
                  <label className={labelClass}>Buyer contact</label>
                  <input className={inputClass} {...puppyForm.register('buyer_contact')} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id={`sold-${litter.id}`} className="accent-primary" {...puppyForm.register('is_sold')} />
                  <label htmlFor={`sold-${litter.id}`} className="text-sm text-foreground">Mark as sold</label>
                </div>
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={puppyForm.formState.isSubmitting}>
                  {puppyForm.formState.isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add puppy'}
                </button>
                <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowAddPuppy(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddPuppy(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <Plus size={13} /> Add puppy
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function BreederPage() {
  const { dogs, activeDog, loading: dogLoading } = useDogs()
  const [litters, setLitters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      mother_dog_id: '',
      sire_name: '',
      birth_date: '',
      puppy_count: 1,
      notes: '',
    },
  })

  useEffect(() => {
    setLoading(true)
    api.get('/api/litters')
      .then((res) => setLitters(res.data || []))
      .catch(() => setLitters([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeDog && !showForm) {
      reset((prev) => ({ ...prev, mother_dog_id: activeDog.id }))
    }
  }, [activeDog, showForm, reset])

  async function onSubmit(values) {
    setServerError('')
    try {
      const { data } = await api.post('/api/litters', {
        mother_dog_id: values.mother_dog_id,
        sire_name: values.sire_name || null,
        birth_date: values.birth_date,
        puppy_count: Number(values.puppy_count),
        notes: values.notes || null,
      })
      setLitters((prev) => [data, ...prev])
      reset()
      setShowForm(false)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not create litter.')
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Breeder</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                Litter management
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Track litters, puppies, and generate birth certificates.
              </p>
            </div>
            <Magnetic>
              <button
                onClick={() => setShowForm((s) => !s)}
                className="btn-primary"
                data-cursor="hover"
              >
                <Plus size={15} /> New litter
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
                    <label className={labelClass}>Mother dog</label>
                    <select className={inputClass} {...register('mother_dog_id', { required: 'Select a mother dog' })}>
                      <option value="">Select a dog...</option>
                      {dogs.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {errors.mother_dog_id && (
                      <p className="mt-1 text-sm text-destructive">{errors.mother_dog_id.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Sire name (optional)</label>
                    <input className={inputClass} placeholder="Father dog's name" {...register('sire_name')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Birth date</label>
                    <input type="date" className={inputClass} {...register('birth_date', { required: 'Birth date is required' })} />
                    {errors.birth_date && (
                      <p className="mt-1 text-sm text-destructive">{errors.birth_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Puppy count</label>
                    <input type="number" min={1} className={inputClass} {...register('puppy_count', { required: true, min: 1 })} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea rows={3} className={inputClass + ' h-auto resize-none py-2.5'} {...register('notes')} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/50 px-6 py-4">
                {serverError
                  ? <p role="alert" className="text-sm text-destructive">{serverError}</p>
                  : <span className="text-xs text-muted-foreground">Record a new litter.</span>}
                <button type="submit" disabled={isSubmitting} className="btn-primary shrink-0" data-cursor="hover">
                  {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Create litter'}
                </button>
              </div>
            </form>
          </Reveal>
        )}

        <div className="mt-8">
          {loading || dogLoading ? (
            <div className="flex flex-col gap-3">
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : litters.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <Users size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No litters recorded yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a litter to start tracking puppies.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {litters.map((litter) => (
                <LitterCard key={litter.id} litter={litter} dogs={dogs} />
              ))}
            </StaggerReveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
