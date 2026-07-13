import { Construction } from 'lucide-react'
import { Reveal } from './motion/Reveal'

export default function ComingSoon({ title, day }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <Reveal>
        <div className="inline-flex items-center justify-center size-14 bg-accent/10 rounded-2xl mb-4">
          <Construction size={24} className="text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1 text-balance">{title}</h2>
        <p className="text-sm text-muted-foreground text-pretty">Coming on Day {day} of the build plan.</p>
      </Reveal>
    </div>
  )
}
