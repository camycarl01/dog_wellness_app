import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PawPrint, Pencil, ArrowLeft, Cake, Scale, Dog, Check, X } from 'lucide-react'
import api from '../lib/api' // adjust if your axios path differs
import { dogSchema } from '../lib/dogSchema'

const inputClass =
  'w-full h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 ' +
  'shadow-sm transition-colors placeholder:text-gray-400 ' +
  'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

// function ageFromDob(dob) {
//   if (!dob) return '—'
//   const birth = new Date(dob)
//   const now = new Date()
//   let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
//   if (now.getDate() < birth.getDate()) months--
//   const years = Math.floor(months / 12)
//   const rem = months % 12
//   if (years === 0) return `${rem} mo old`
//   return rem === 0 ? `${years} yr old` : `${years} yr ${rem} mo old`
// }
import { ageFromDob } from '../lib/utils'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
        <Icon size={17} className="text-teal-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
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
    errors[name] ? <p className="text-sm text-red-500 mt-1.5">{errors[name].message}</p> : null

  if (loading) return <div className="p-10 text-gray-400">Loading…</div>
  if (error && !dog) return <div className="p-10 text-red-500">{error}</div>
  if (!dog) return null

  const sexLabel = dog.sex === 'female' ? 'Female' : 'Male'
  const SexIcon = Dog

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 sm:px-8 py-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
              {dog.photo_url
                ? <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                : <PawPrint size={30} className="text-white/70" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-white truncate">{dog.name}</h1>
              <p className="text-teal-100 text-sm">{dog.breed} · {ageFromDob(dog.dob)}</p>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium text-white transition-colors shrink-0">
                <Pencil size={15} /> Edit
              </button>
            )}
          </div>

          {/* Body */}
          {!editing ? (
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-gray-100">
                <DetailRow icon={Cake} label="Date of birth" value={dog.dob || '—'} />
                <DetailRow icon={Scale} label="Weight" value={`${dog.weight_kg} kg`} />
                <DetailRow icon={SexIcon} label="Sex" value={sexLabel} />
                <DetailRow icon={Check} label={sexLabel === 'Female' ? 'Spayed' : 'Neutered'}
                  value={dog.is_neutered ? 'Yes' : 'No'} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSave)} noValidate className="p-6 sm:p-8 space-y-5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">{fixedLabel}</span>
                    <button type="button" role="switch" aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        field.value ? 'bg-teal-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        field.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors">
                  <Check size={16} /> {isSubmitting ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={() => { reset(); setEditing(false) }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  <X size={16} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
