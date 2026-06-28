import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PawPrint } from 'lucide-react'
import api from '../lib/api' // adjust if your axios path differs
import { supabase } from '../lib/supabase'
import { uploadDogPhoto } from '../lib/uploadDogPhoto'
import { dogSchema } from '../lib/dogSchema'

// One source of truth for input styling — clear border, comfortable height, teal focus
const inputClass =
  'w-full h-11 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 ' +
  'shadow-sm transition-colors placeholder:text-gray-400 ' +
  'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

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
    errors[name] ? <p className="text-sm text-red-500 mt-1.5">{errors[name].message}</p> : null

  return (
    <div className="min-h-full bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
            <PawPrint size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Add a dog</h1>
            <p className="text-sm text-gray-500">Create a profile to start tracking health and care.</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Section: Basics */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Basic details</h2>

                <div className="space-y-5">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  </div>

                  <div>
                    <label htmlFor="sex" className={labelClass}>Sex</label>
                    <select id="sex" className={inputClass} {...register('sex')}>
                      <option value="">Select…</option>
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
                        <div>
                          <span className="text-sm font-medium text-gray-800">{fixedLabel}</span>
                          <p className="text-xs text-gray-500 mt-0.5">Has this dog been fixed?</p>
                        </div>
                        <button type="button" role="switch" aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            field.value ? 'bg-teal-600' : 'bg-gray-300'
                          }`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            field.value ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Section: Photo */}
              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Photo</h2>
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    {preview
                      ? <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      : <PawPrint size={26} className="text-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="photo"
                      className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-teal-700 transition-colors">
                      {preview ? 'Change photo' : 'Upload photo'}
                    </label>
                    <input id="photo" type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                    <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP. Square works best.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
              {serverError
                ? <p className="text-sm text-red-500">{serverError}</p>
                : <span className="text-xs text-gray-400">All set? Save to create the profile.</span>}
              <button type="submit" disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 transition-colors shrink-0">
                {isSubmitting ? 'Saving…' : 'Save dog'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
