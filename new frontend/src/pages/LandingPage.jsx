import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLenis } from 'lenis/react'
import {
  PawPrint,
  ArrowRight,
  ArrowDown,
  HeartPulse,
  Syringe,
  Stethoscope,
  Bone,
  LineChart,
  Users,
} from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import SmoothScroll from '../components/motion/SmoothScroll'
import AuroraScene from '../components/motion/AuroraScene'
import Magnetic from '../components/motion/Magnetic'
import ThemeToggle from '../components/ThemeToggle'

/* ------------------------------------------------------------------ */
/* Morphing word (text-effects skill pattern: blur crossfade)          */
/* ------------------------------------------------------------------ */
const MORPH_WORDS = ['healthier.', 'happier.', 'longer.', 'together.']

function MorphWord() {
  const aRef = useRef(null)
  const bRef = useRef(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el1 = aRef.current
    const el2 = bRef.current
    if (!el1 || !el2) return

    el1.textContent = MORPH_WORDS[index]
    el2.textContent = MORPH_WORDS[(index + 1) % MORPH_WORDS.length]

    // Reset both layers at the start of every cycle: current word fully
    // visible, next word hidden. (Without this, opacity from the previous
    // timeline leaks into the next cycle and both layers end up invisible.)
    gsap.set(el1, { opacity: 1, filter: 'blur(0px)', y: 0 })
    gsap.set(el2, { opacity: 0 })

    if (reduced) {
      const t = setTimeout(() => setIndex((index + 1) % MORPH_WORDS.length), 2600)
      return () => clearTimeout(t)
    }

    const tl = gsap.timeline({
      delay: 2.2,
      onComplete: () => setIndex((index + 1) % MORPH_WORDS.length),
    })
    tl.to(el1, { opacity: 0, filter: 'blur(8px)', y: -14, duration: 0.55, ease: 'power2.in' })
      .fromTo(
        el2,
        { opacity: 0, filter: 'blur(8px)', y: 14 },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.65, ease: 'power2.out' },
        '-=0.25'
      )
    return () => tl.kill()
  }, [index])

  const longest = MORPH_WORDS.reduce((a, b) => (a.length > b.length ? a : b))

  return (
    <span className="relative inline-block text-primary">
      <span ref={aRef} className="text-halo absolute inset-0" />
      <span ref={bRef} className="text-halo absolute inset-0 opacity-0" />
      <span className="invisible">{longest}</span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Hero: pinned parallax + per-char kinetic reveal                     */
/* ------------------------------------------------------------------ */
function Hero() {
  const containerRef = useRef(null)

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const chars = gsap.utils.toArray('.hero-char')

      if (reduced) {
        gsap.set(chars, { yPercent: 0, opacity: 1, rotateX: 0 })
        gsap.set(['.hero-sub', '.hero-cta', '.hero-scroll-hint'], { opacity: 1, y: 0 })
        return
      }

      // Entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.fromTo(
        chars,
        { yPercent: 120, opacity: 0, rotateX: -80 },
        { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.028 },
        0.15
      )
        .fromTo('.hero-sub', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.6')
        .fromTo('.hero-cta', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.55')
        .fromTo('.hero-scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3')

      // Scroll-out parallax (parallax hero skill pattern)
      gsap.to('.hero-inner', {
        yPercent: 24,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      gsap.to('.hero-scene', {
        yPercent: -14,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    },
    { scope: containerRef }
  )

  const line1 = 'Every dog deserves'
  const renderChars = (text) =>
    text.split('').map((char, i) => (
      <span key={i} className="hero-char inline-block will-change-transform" style={{ transformStyle: 'preserve-3d' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))

  return (
    <section ref={containerRef} className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="hero-scene pointer-events-none absolute inset-0 opacity-70">
        <AuroraScene className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="hero-inner relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center px-6 pt-24 sm:px-10">
        <p className="hero-sub mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground backdrop-blur">
          <PawPrint size={13} className="text-primary" aria-hidden="true" />
          Dog wellness, reimagined
        </p>

        <h1
          className="text-balance font-sans text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-7xl lg:text-8xl"
          style={{ perspective: '900px' }}
        >
          <span className="block overflow-hidden pb-1">{renderChars(line1)}</span>
          <span className="block overflow-hidden pb-2">
            <span className="hero-char inline-block">to&nbsp;live&nbsp;</span>
            <MorphWord />
          </span>
        </h1>

        <p className="hero-sub mt-8 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          PawCare brings health records, vaccine schedules, vet visits, and daily wellness
          tracking into one calm, beautiful place &mdash; so you can focus on the walks, the
          fetch, and the naps.
        </p>

        <div className="hero-cta mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            <Link
              to="/signup"
              data-cursor="hover"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start free
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </Magnetic>
          <Magnetic strength={0.2}>
            <Link
              to="/login"
              data-cursor="hover"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-secondary"
            >
              Sign in
            </Link>
          </Magnetic>
        </div>
      </div>

      <div className="hero-scroll-hint relative z-10 flex justify-center pb-8">
        <span className="flex flex-col items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Scroll
          <ArrowDown size={14} className="animate-bounce" aria-hidden="true" />
        </span>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Marquee with scroll-velocity skew (lenis skill pattern)             */
/* ------------------------------------------------------------------ */
const MARQUEE_ITEMS = ['Health records', 'Vaccine tracker', 'Vet visits', 'Weight & growth', 'Feeding plans', 'Breeder tools']

function Marquee() {
  const trackRef = useRef(null)
  const skewRef = useRef(null)

  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !trackRef.current) return
    gsap.to(trackRef.current, {
      xPercent: -50,
      duration: 28,
      ease: 'none',
      repeat: -1,
    })
  })

  useLenis(({ velocity }) => {
    if (!skewRef.current) return
    gsap.to(skewRef.current, {
      skewX: gsap.utils.clamp(-6, 6, velocity * 0.4),
      duration: 0.4,
      ease: 'power2.out',
    })
  })

  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div ref={skewRef} className="relative overflow-hidden border-y border-border bg-card py-5" aria-hidden="true">
      <div ref={trackRef} className="flex w-max items-center gap-10 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-sm uppercase tracking-widest text-muted-foreground">
            {item}
            <PawPrint size={13} className="text-primary" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Features: scroll-staggered cards                                    */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: HeartPulse,
    title: 'Health at a glance',
    body: 'One profile per dog with breed, weight, and every record that matters — always up to date.',
  },
  {
    icon: Syringe,
    title: 'Never miss a vaccine',
    body: 'Track every dose with due-date reminders, overdue flags, and a complete vaccination history.',
  },
  {
    icon: Stethoscope,
    title: 'Vet visits, organized',
    body: 'Log appointments, diagnoses, and notes. Your whole care history travels with you to every clinic.',
  },
  {
    icon: Bone,
    title: 'Smarter nutrition',
    body: 'Feeding plans and a toxic-foods database keep every meal safe and portioned for your dog.',
  },
  {
    icon: LineChart,
    title: 'Growth tracking',
    body: 'Weight, mood, and activity charts reveal trends before they become problems.',
  },
  {
    icon: Users,
    title: 'Built for breeders',
    body: 'Litter management, puppy profiles, and reproductive cycle tracking in a dedicated workspace.',
  },
]

function Features() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const cards = gsap.utils.toArray('.feature-card')
      const heading = ref.current?.querySelector('.features-heading')

      if (reduced) {
        gsap.set([heading, ...cards], { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' })
        return
      }

      gsap.fromTo(
        heading,
        { clipPath: 'inset(0% 0% 100% 0%)', y: 40 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          duration: 1.1,
          ease: 'power4.inOut',
          scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
        }
      )

      gsap.fromTo(
        cards,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%', once: true },
        }
      )
    },
    { scope: ref }
  )

  return (
    <section ref={ref} className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
      <h2 className="features-heading text-balance font-sans text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
        Everything your dog needs.
        <br />
        <span className="text-muted-foreground">Nothing you don&apos;t.</span>
      </h2>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            data-cursor="hover"
            className="feature-card group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <f.icon size={19} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stats: scroll-triggered count-up                                    */
/* ------------------------------------------------------------------ */
const STATS = [
  { value: 12, suffix: '+', label: 'Care modules' },
  { value: 100, suffix: '%', label: 'Vaccine coverage tracking' },
  { value: 3, suffix: 's', label: 'To log a vet visit' },
  { value: 1, suffix: '', label: 'Calm place for it all' },
]

function Stats() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const nums = gsap.utils.toArray('.stat-num')

      nums.forEach((el) => {
        const target = Number(el.dataset.value)
        if (reduced) {
          el.textContent = String(target)
          return
        }
        const counter = { v: 0 }
        gsap.to(counter, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.v))
          },
        })
      })

      if (!reduced) {
        gsap.fromTo(
          '.stat-item',
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power4.out',
            scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
          }
        )
      }
    },
    { scope: ref }
  )

  return (
    <section ref={ref} className="border-y border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-y-10 px-6 py-16 sm:px-10 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="stat-item flex flex-col items-start gap-1.5">
            <span className="font-sans text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
              <span className="stat-num" data-value={s.value}>
                0
              </span>
              <span className="text-primary">{s.suffix}</span>
            </span>
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* CTA                                                                 */
/* ------------------------------------------------------------------ */
function CTA() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const words = gsap.utils.toArray('.cta-word')
      if (reduced) {
        gsap.set(words, { yPercent: 0, opacity: 1 })
        return
      }
      gsap.fromTo(
        words,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.06,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 75%', once: true },
        }
      )
    },
    { scope: ref }
  )

  const words = 'Give them the care they give you.'.split(' ')

  return (
    <section ref={ref} className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-28 text-center sm:px-10 sm:py-36">
      <h2 className="text-balance font-sans text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
            <span className="cta-word inline-block will-change-transform">{w}&nbsp;</span>
          </span>
        ))}
      </h2>
      <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
        Free to start. Set up your first dog profile in under a minute.
      </p>
      <div className="mt-10">
        <Magnetic>
          <Link
            to="/signup"
            data-cursor="hover"
            className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-9 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create your pack
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </Magnetic>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Nav + Footer                                                        */
/* ------------------------------------------------------------------ */
function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PawCare home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary">
            <PawPrint size={17} className="text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">PawCare</span>
        </Link>
        <nav className="flex items-center gap-3" aria-label="Primary">
          <ThemeToggle />
          <Link
            to="/login"
            data-cursor="hover"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Magnetic strength={0.2}>
            <Link
              to="/signup"
              data-cursor="hover"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start free
            </Link>
          </Magnetic>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row sm:px-10">
        <div className="flex items-center gap-2">
          <PawPrint size={15} className="text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">PawCare</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Made for dogs and the people who love them.
        </p>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link to="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link to="/signup" className="transition-colors hover:text-foreground">
            Create account
          </Link>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  useEffect(() => {
    return () => {
      // Kill landing-page scroll triggers when navigating into the app.
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [])

  return (
    <SmoothScroll>
      <main className="bg-background text-foreground">
        <Nav />
        <Hero />
        <Marquee />
        <Features />
        <Stats />
        <CTA />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
