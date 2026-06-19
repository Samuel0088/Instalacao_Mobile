import { useEffect } from "react"
import "../../../styles/Global/SplashScreen.css"

export default function SplashScreen({ onComplete, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), duration)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <main className="splash" role="status" aria-live="polite">
      <h1 className="splash-brand">Zenith</h1>
    </main>
  )
}
