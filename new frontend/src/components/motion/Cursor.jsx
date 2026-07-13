import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'

// Custom cursor follower: dot + trailing ring that scales up over interactive elements.
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    // Skip on touch devices / reduced motion
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPos = { x: pos.x, y: pos.y }
    let hovering = false
    let revealed = false

    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!revealed) {
        // Only reveal the cursor once the mouse actually moves,
        // so it never appears stuck at the viewport center.
        revealed = true
        ringPos.x = pos.x
        ringPos.y = pos.y
        dot.style.display = 'block'
        ring.style.display = 'block'
      }
      gsap.set(dot, { x: pos.x, y: pos.y })
    }

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.14
      ringPos.y += (pos.y - ringPos.y) * 0.14
      gsap.set(ring, { x: ringPos.x, y: ringPos.y })
    }

    const isInteractive = (el) =>
      el.closest('a, button, [role="button"], input, select, textarea, label, [data-cursor]')

    const onOver = (e) => {
      const hit = isInteractive(e.target)
      if (hit && !hovering) {
        hovering = true
        gsap.to(ring, { scale: 2.2, opacity: 0.35, duration: 0.35, ease: 'power3.out' })
        gsap.to(dot, { scale: 0.4, duration: 0.35, ease: 'power3.out' })
      } else if (!hit && hovering) {
        hovering = false
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' })
        gsap.to(dot, { scale: 1, duration: 0.35, ease: 'power3.out' })
      }
    }

    const onDown = () => gsap.to(ring, { scale: hovering ? 1.8 : 0.8, duration: 0.15, ease: 'power2.out' })
    const onUp = () => gsap.to(ring, { scale: hovering ? 2.2 : 1, duration: 0.3, ease: 'back.out(2)' })

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      gsap.ticker.remove(tick)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{ display: 'none' }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{ display: 'none' }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/60"
      />
    </>
  )
}
