import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Stethoscope, Plus, Calendar } from 'lucide-react'
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
    errors[name] ? <p className="text-sm text-red-500 mt-1.5">{errors[name].message}</p> : null

  if (dogLoading) {
    return <div className="p-10 text-center text-gray-400">Loading…</div>
  }
  if (!activeDog) {
    return <div className="p-10 text-center text-gray-500">Add a dog to start tracking vet visits.</div>
  }

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
              <Stethoscope size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Vet visits</h1>
              <p className="text-sm text-gray-500">{activeDog.name}'s appointment history.</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Plus size={16} />
            {showForm ? 'Close' : 'Add visit'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    className={inputClass + ' h-auto py-2.5 resize-none'}
                    placeholder="Anything worth remembering…" {...register('notes')} />
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between gap-4">
                {serverError
                  ? <p className="text-sm text-red-500">{serverError}</p>
                  : <span className="text-xs text-gray-400">Log a completed or upcoming visit.</span>}
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors shrink-0">
                  {isSubmitting ? 'Saving…' : 'Save visit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Visits list */}
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading visits…</div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <Calendar size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No vet visits logged yet.</p>
            <p className="text-xs text-gray-400 mt-1">Add your first visit to start the history.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{v.reason}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(v.visit_date)}{v.vet_name ? ` · ${v.vet_name}` : ''}
                    </p>
                    {v.notes && <p className="text-sm text-gray-600 mt-2">{v.notes}</p>}
                  </div>
                  {v.next_due_date && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Next due</p>
                      <p className="text-sm font-medium text-teal-700">{fmtDate(v.next_due_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
