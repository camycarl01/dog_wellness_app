import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PawPrint, ArrowLeft, Upload, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { supabase } from '../lib/supabase'
import { uploadDogPhoto } from '../lib/uploadDogPhoto'
import { dogSchema } from '../lib/dogSchema'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'

const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export default function AddDog() {
  const navigate = useNavigate()
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [serverError, setServerError] = useState('')

  const {
    register, handleSubmit, control, watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(dogSchema),
    mode: 'onSubmit',
    defaultValues: { name: '', breed: '', dob: '', sex: '', weight_kg: '', is_neutered: false },
  })

  const sex = watch('sex')
  const fixedLabel =
    sex === 'female' ? 'Spayed' : sex === 'male' ? 'Neutered' : 'Neutered / spayed'

  function onPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function onSubmit(values) {
    setServerError('')
    try {
      let photo_url = null
      if (photoFile) {
        const { data: { user } } = await supabase.auth.getUser()
        photo_url = await uploadDogPhoto(photoFile, user.id)
      }
      const { data } = await api.post('/api/dogs', { ...values, photo_url })
      navigate(`/dogs/${data.id}`)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Something went wrong.')
    }
  }

  const fieldError = (name) =>
    errors[name] ? <p className="text-sm text-destructive mt-1.5">{errors[name].message}</p> : null

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-cursor="hover"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">New companion</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Add a dog to your pack
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            A few details help us tailor vet visits and vaccine schedules.
          </p>
        </Reveal>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10">
          <StaggerReveal className="flex flex-col gap-8">
            {/* Photo */}
            <div className="flex items-center gap-5">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-card">
                {preview
                  ? <img src={preview} alt="Preview" className="size-full object-cover" />
                  : <PawPrint size={26} className="text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile photo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG or WebP. Square works best.</p>
                <label
                  htmlFor="photo"
                  className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  data-cursor="hover"
                >
                  <Upload size={13} />
                  {preview ? 'Change photo' : 'Upload photo'}
                </label>
                <input id="photo" type="file" accept="image/*" onChange={onPhotoChange} className="sr-only" />
              </div>
            </div>

            {/* Name + breed */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>Name</label>
                <input id="name" className={inputClass} placeholder="e.g. Bingo" {...register('name')} />
                {fieldError('name')}
              </div>
              <div>
                <label htmlFor="breed" className={labelClass}>Breed</label>
                <input id="breed" className={inputClass} placeholder="e.g. Boerboel" {...register('breed')} />
                {fieldError('breed')}
              </div>
            </div>

            {/* dob / weight / sex */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="dob" className={labelClass}>Date of birth</label>
                <input id="dob" type="date" className={inputClass} {...register('dob')} />
                {fieldError('dob')}
              </div>
              <div>
                <label htmlFor="weight_kg" className={labelClass}>Weight (kg)</label>
                <input id="weight_kg" type="number" step="0.1" inputMode="decimal"
                  className={inputClass} placeholder="0.0" {...register('weight_kg')} />
                {fieldError('weight_kg')}
              </div>
              <div>
                <label htmlFor="sex" className={labelClass}>Sex</label>
                <select id="sex" className={inputClass} {...register('sex')}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {fieldError('sex')}
              </div>
            </div>

            {/* Neutered toggle */}
            <Controller
              name="is_neutered"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5">
                  <div>
                    <span className="text-sm font-medium text-foreground">{fixedLabel}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">Has this dog been fixed?</p>
                  </div>
                  <button type="button" role="switch" aria-checked={field.value}
                    aria-label={fixedLabel}
                    onClick={() => field.onChange(!field.value)}
                    data-cursor="hover"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      field.value ? 'bg-primary' : 'bg-muted'
                    }`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                      field.value ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              )}
            />

            {serverError && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <div className="flex items-center gap-4">
              <Magnetic>
                <button type="submit" disabled={isSubmitting} className="btn-primary" data-cursor="hover">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save dog'
                  )}
                </button>
              </Magnetic>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                data-cursor="hover"
              >
                Cancel
              </button>
            </div>
          </StaggerReveal>
        </form>
      </div>
    </PageTransition>
  )
}
