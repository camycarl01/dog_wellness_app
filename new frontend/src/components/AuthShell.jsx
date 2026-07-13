import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import AuroraScene from './motion/AuroraScene'
import { TextReveal, Reveal } from './motion/Reveal'
import ThemeToggle from './ThemeToggle'

// Shared split-screen shell for login / signup.
// Left: form content. Right (lg+): 3D scene with kinetic headline.
export default function AuthShell({ children, tagline }) {
  return (
    <div className="relative flex min-h-dvh bg-background">
      {/* Form column */}
      <div className="relative z-10 flex w-full flex-col lg:w-[46%]">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link to="/login" className="flex items-center gap-2.5" aria-label="PawCare home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <PawPrint size={17} className="text-primary-foreground" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">PawCare</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-14 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>

      {/* Visual column */}
      <div className="relative hidden flex-1 overflow-hidden border-l border-border lg:block" aria-hidden="true">
        <AuroraScene className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-12">
          <Reveal stagger={0.12}>
            <p data-reveal className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Dog wellness, elevated
            </p>
            <TextReveal
              as="p"
              text={tagline}
              className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance"
              delay={0.15}
            />
          </Reveal>
        </div>
      </div>
    </div>
  )
}
