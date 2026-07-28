import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ImageUp, Loader2, Sparkles } from 'lucide-react'
import api from '../lib/api'
import PageTransition from '../components/motion/PageTransition'

export default function BreedIdPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [serverError, setServerError] = useState('')

  const { handleSubmit, formState: { isSubmitting } } = useForm()

  function onChange(e) {
    const nextFile = e.target.files?.[0]
    if (!nextFile) return
    setFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
    setResult(null)
  }

  async function onSubmit() {
    if (!file) {
      setServerError('Choose an image first.')
      return
    }
    setServerError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/api/predict/breed', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err) {
      setServerError(err.response?.data?.detail || err.message || 'Could not identify the breed.')
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">AI tool</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Breed identifier</h1>
          <p className="mt-2 text-sm text-muted-foreground">Upload a photo and the backend will return its top breed matches.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-secondary/40">
            <ImageUp size={28} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Upload a dog photo</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, or WebP</span>
            <input type="file" accept="image/*" className="sr-only" onChange={onChange} />
          </label>

          {preview && (
            <div className="overflow-hidden rounded-xl border border-border">
              <img src={preview} alt="Preview" className="h-64 w-full object-cover" />
            </div>
          )}

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Identifying…</> : <><Sparkles size={15} /> Identify breed</>}
          </button>
        </form>

        {result?.predictions?.length ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Top matches</h2>
            <div className="space-y-3">
              {result.predictions.map((item) => (
                <div key={item.breed} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{item.breed}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(item.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageTransition>
  )
}
