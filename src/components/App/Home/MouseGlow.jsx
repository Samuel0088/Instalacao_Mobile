// components/Home/MouseGlow.jsx
import { useEffect, useRef } from 'react'

export default function MouseGlow() {
  const glowRef = useRef(null)

  useEffect(() => {
    const shouldDisable = window.matchMedia(
      '(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)'
    ).matches
    if (shouldDisable) return

    let frameId = null
    const handleMouseMove = (e) => {
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        glowRef.current?.style.setProperty(
          'transform',
          `translate3d(${e.clientX - 250}px, ${e.clientY - 250}px, 0)`
        )
        frameId = null
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  return <div ref={glowRef} className="mouse-glow" />
}
