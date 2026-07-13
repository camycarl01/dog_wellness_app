import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

// Staggered entrance for direct children marked with [data-reveal].
// Falls back to animating the container itself if no marked children exist.
export function Reveal({
  children,
  className = '',
  stagger = 0.08,
  y = 28,
  delay = 0,
  scrollTrigger = false,
  as: Tag = 'div',
}) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const container = ref.current
      if (!container) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const targets = container.querySelectorAll('[data-reveal]')
      const els = targets.length ? targets : [container]

      if (reduced) {
        gsap.set(els, { opacity: 1, y: 0 })
        return
      }

      gsap.fromTo(
        els,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          stagger,
          ease: 'power4.out',
          ...(scrollTrigger
            ? { scrollTrigger: { trigger: container, start: 'top 85%', once: true } }
            : {}),
        }
      )
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}

// Staggers the entrance of all direct children of the container.
export function StaggerReveal({
  children,
  className = '',
  stagger = 0.07,
  y = 24,
  delay = 0,
  scrollTrigger = false,
  as: Tag = 'div',
}) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const container = ref.current
      if (!container) return
      const els = Array.from(container.children)
      if (!els.length) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) {
        gsap.set(els, { opacity: 1, y: 0 })
        return
      }

      gsap.fromTo(
        els,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          stagger,
          ease: 'power4.out',
          ...(scrollTrigger
            ? { scrollTrigger: { trigger: container, start: 'top 85%', once: true } }
            : {}),
        }
      )
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}

// Per-word kinetic text reveal with clip masking.
export function TextReveal({ text, className = '', as: Tag = 'span', delay = 0, stagger = 0.045 }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const container = ref.current
      if (!container) return
      const words = container.querySelectorAll('[data-word]')
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(words, { yPercent: 0, opacity: 1 })
        return
      }
      gsap.fromTo(
        words,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1, delay, stagger, ease: 'power4.out' }
      )
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <span data-word className="inline-block will-change-transform">
            {word}
            {'\u00A0'}
          </span>
        </span>
      ))}
    </Tag>
  )
}
