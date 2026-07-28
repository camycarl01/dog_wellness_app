import { useState, useEffect } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import api from '../lib/api'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'

const SEVERITY_CONFIG = {
  severe: { label: 'Severe', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  moderate: { label: 'Moderate', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  mild: { label: 'Mild', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
}

function FoodCard({ food }) {
  const severity = SEVERITY_CONFIG[food.toxicity_level?.toLowerCase()] || SEVERITY_CONFIG.moderate

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-destructive/30">
      <div className="flex items-start gap-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle size={16} className="text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <p className="text-sm font-semibold text-foreground">{food.name}</p>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${severity.cls}`}>
              {severity.label}
            </span>
          </div>
          {food.reason && (
            <p className="text-sm text-muted-foreground leading-relaxed">{food.reason}</p>
          )}
          {food.symptoms && food.symptoms.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Symptoms</p>
              <div className="flex flex-wrap gap-1.5">
                {food.symptoms.map((s) => (
                  <span
                    key={s}
                    className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-foreground/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {food.what_to_do && (
            <div className="mt-3 rounded-lg border border-border bg-secondary/50 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">If ingested</p>
              <p className="text-sm text-foreground/80">{food.what_to_do}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ToxicFoodsPage() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    setLoading(true)
    setServerError('')
    const params = search ? { search } : {}
    api.get('/api/toxic-foods', { params })
      .then((res) => setFoods(res.data?.foods || []))
      .catch(() => setServerError('Could not load toxic foods database.'))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Safety</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Toxic foods
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Foods that are dangerous or potentially toxic to dogs.
          </p>
        </Reveal>

        <Reveal className="mt-6">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              className={inputClass + ' pl-9'}
              placeholder="Search foods, e.g. chocolate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Reveal>

        <div className="mt-6">
          {serverError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">{serverError}</p>
          )}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : foods.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <AlertTriangle size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No results found for &quot;{search}&quot;.</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {foods.map((food, i) => (
                <FoodCard key={food.name || i} food={food} />
              ))}
            </StaggerReveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
