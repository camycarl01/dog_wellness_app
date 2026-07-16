import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ArrowLeft, History } from 'lucide-react'
import { useDogs } from '../context/DogContext'
import { Reveal } from '../components/motion/Reveal'
import Magnetic from '../components/motion/Magnetic'
import PageTransition from '../components/motion/PageTransition'

const SEVERITY_STYLES = {
  mild: { badge: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: CheckCircle2 },
  moderate: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  severe: { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: AlertTriangle },
  emergency: { badge: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: AlertTriangle },
}

export default function HealthResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeDog } = useDogs()
  const result = location.state?.result

  if (!result) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No result to show — run a symptom check first.</p>
          <Link to="/health" className="btn-primary mt-6" data-cursor="hover">
            Go to symptom checker
          </Link>
        </div>
      </PageTransition>
    )
  }

  const style = SEVERITY_STYLES[result.severity] || SEVERITY_STYLES.mild
  const Icon = style.icon
  const isUrgent = result.severity === 'severe' || result.severity === 'emergency'
  const confidencePct = Math.round((result.confidence || 0) * 100)

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl">
        <Reveal>
          <button
            onClick={() => navigate('/health')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-cursor="hover"
          >
            <ArrowLeft size={16} /> Check again
          </button>
        </Reveal>

        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-4 border-b border-border px-6 py-6 sm:px-8">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.badge}`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  {activeDog?.name ? `${activeDog.name}'s result` : 'Result'}
                </p>
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{result.prediction}</h1>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}>
                  {result.severity?.charAt(0).toUpperCase() + result.severity?.slice(1)}
                </span>
                <span className="text-xs text-muted-foreground">{confidencePct}% confidence</span>
              </div>

              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Recommendation</p>
                <p className="text-sm leading-relaxed text-foreground">{result.recommendation}</p>
              </div>

              {isUrgent && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <p className="text-sm font-medium text-destructive">
                    This may need urgent attention. Please contact your vet as soon as possible.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border bg-secondary/50 px-6 py-4 sm:px-8">
              <Magnetic>
                <Link to="/vet" className="btn-primary" data-cursor="hover">
                  Book a vet visit
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  to="/health/history"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
                  data-cursor="hover"
                >
                  <History size={15} /> View history
                </Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>

        <p className="mx-auto mt-4 max-w-sm text-center text-xs text-muted-foreground">
          This is an automated estimate, not a diagnosis. Always consult a vet for medical concerns.
        </p>
      </div>
    </PageTransition>
  )
}
