import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FlaskConical, Plus, Syringe } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'

const inputClass =
  'w-full h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 ' +
  'shadow-sm transition-colors placeholder:text-gray-400 ' +
  'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS = {
  up_to_date: { label: 'Up to date', cls: 'bg-green-100 text-green-700' },
  due_soon: { label: 'Due soon', cls: 'bg-amber-100 text-amber-700' },
  overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-700' },
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
    errors[name] ? <p className="text-sm text-red-500 mt-1.5">{errors[name].message}</p> : null

  if (dogLoading) {
    return <div className="p-10 text-center text-gray-400">Loading…</div>
  }
  if (!activeDog) {
    return <div className="p-10 text-center text-gray-500">Add a dog to start tracking vaccines.</div>
  }

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
              <FlaskConical size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Vaccines</h1>
              <p className="text-sm text-gray-500">{activeDog.name}'s vaccination record.</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus size={16} />
            {showForm ? 'Close' : 'Add vaccine'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="p-6 space-y-5">
                <div>
                  <label htmlFor="vaccine_name" className={labelClass}>Vaccine name</label>
                  <input id="vaccine_name" className={inputClass} placeholder="e.g. Rabies"
                    {...register('vaccine_name', { required: 'Vaccine name is required' })} />
                  {fieldError('vaccine_name')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between gap-4">
                {serverError
                  ? <p className="text-sm text-red-500">{serverError}</p>
                  : <span className="text-xs text-gray-400">Status is calculated from the next due date.</span>}
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors shrink-0">
                  {isSubmitting ? 'Saving…' : 'Save vaccine'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vaccines list */}
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading vaccines…</div>
        ) : vaccines.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <Syringe size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No vaccines recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add one to start tracking due dates.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Vaccine</th>
                  <th className="px-5 py-3 font-medium">Given</th>
                  <th className="px-5 py-3 font-medium">Next due</th>
                  <th className="px-5 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{v.vaccine_name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{fmtDate(v.given_date)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{fmtDate(v.next_due_date)}</td>
                    <td className="px-5 py-3.5 text-right"><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
