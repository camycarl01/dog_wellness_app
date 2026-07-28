import { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Search } from 'lucide-react'
import api from '../lib/api'
import { useDogs } from '../context/DogContext'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function TipCard({ tip }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-primary/40">
      <button
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${DIFFICULTY_COLORS[tip.difficulty]}`}>
              {tip.difficulty}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
              {tip.age_group}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{tip.command}</p>
          {!expanded && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{tip.goal}</p>
          )}
        </div>
        <span className="shrink-0 text-muted-foreground mt-0.5">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border bg-secondary/30 px-5 py-4 space-y-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Goal</p>
            <p className="text-sm text-foreground">{tip.goal}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Steps</p>
            <ol className="space-y-1">
              {tip.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/80">
                  <span className="shrink-0 font-mono text-[11px] text-primary mt-0.5">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          {tip.tips && tip.tips.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Pro tips</p>
              <ul className="space-y-1">
                {tip.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/80">
                    <span className="shrink-0 text-primary mt-0.5">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tip.common_mistakes && tip.common_mistakes.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Common mistakes</p>
              <ul className="space-y-1">
                {tip.common_mistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground/80">
                    <span className="shrink-0 text-destructive mt-0.5">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TrainingPage() {
  const { activeDog } = useDogs()
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [serverError, setServerError] = useState('')

  // Compute age_months from the active dog's dob
  const ageMonths = activeDog?.dob
    ? Math.floor((Date.now() - new Date(activeDog.dob)) / (30.44 * 24 * 3600 * 1000))
    : undefined

  useEffect(() => {
    setLoading(true)
    setServerError('')
    const params = {}
    if (search) params.command = search
    if (difficulty) params.difficulty = difficulty
    if (ageMonths !== undefined) params.age_months = ageMonths

    api.get('/api/training-tips', { params })
      .then((res) => setTips(res.data?.tips || []))
      .catch(() => setServerError('Could not load training tips.'))
      .finally(() => setLoading(false))
  }, [search, difficulty, ageMonths])

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Tools</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Training tips
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {activeDog
              ? `Showing tips${ageMonths !== undefined ? ` matched to ${activeDog.name}'s age` : ''}.`
              : 'Browse training commands and techniques.'}
          </p>
        </Reveal>

        <Reveal className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              className={inputClass + ' pl-9'}
              placeholder="Search commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={inputClass + ' w-44'}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Reveal>

        <div className="mt-6">
          {serverError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">{serverError}</p>
          )}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : tips.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
                <BookOpen size={26} className="text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No tips match your filters.</p>
                <p className="mt-1 text-xs text-muted-foreground">Try adjusting the search or difficulty filter.</p>
              </div>
            </Reveal>
          ) : (
            <StaggerReveal className="flex flex-col gap-3">
              {tips.map((tip, i) => (
                <TipCard key={i} tip={tip} />
              ))}
            </StaggerReveal>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
