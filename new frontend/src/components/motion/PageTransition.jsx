import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, useGSAP } from '../../lib/gsap'

// Fades + lifts route content in on every navigation.
export default function PageTransition({ children, className = '' }) {
  const ref = useRef(null)
  const { pathname } = useLocation()

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform' }
      )
    },
    { dependencies: [pathname], scope: ref }
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
