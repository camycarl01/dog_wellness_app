import { useRef, useCallback } from 'react'
import { gsap } from '../../lib/gsap'

// Wraps any element and gives it a magnetic pull toward the cursor.
export default function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null)

  const onMove = useCallback(
    (e) => {
      const el = ref.current
      if (!el) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const { left, top, width, height } = el.getBoundingClientRect()
      const x = (e.clientX - left - width / 2) * strength
      const y = (e.clientY - top - height / 2) * strength
      gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' })
    },
    [strength]
  )

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' })
  }, [])

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`inline-block ${className}`}>
      {children}
    </div>
  )
}
