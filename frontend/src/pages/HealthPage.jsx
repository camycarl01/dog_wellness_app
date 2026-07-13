import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, Thermometer } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'

const inputClass =
  'w-full h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 ' +
  'shadow-sm transition-colors placeholder:text-gray-400 ' +
  'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

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

  if (dogLoading) return <div className="p-10 text-center text-gray-400">Loading…</div>
  if (!activeDog) return <div className="p-10 text-center text-gray-500">Add a dog to use the symptom checker.</div>

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
            <HeartPulse size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Symptom checker</h1>
            <p className="text-sm text-gray-500">Checking for {activeDog.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Select any symptoms your dog is showing
              {selectedCount > 0 && (
                <span className="ml-2 text-xs text-teal-600 font-normal">({selectedCount} selected)</span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SYMPTOMS.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-teal-50 has-[:checked]:border-teal-300 has-[:checked]:text-teal-800 transition-colors"
                >
                  <input type="checkbox" className="accent-teal-600" {...register(s.key)} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

          {serverError && <p className="text-sm text-red-500 mb-4">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting || selectedCount === 0}
            className="w-full inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Checking…' : 'Check symptoms'}
          </button>
          {selectedCount === 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">Select at least one symptom to continue.</p>
          )}
        </form>
      </div>
    </div>
  )
}