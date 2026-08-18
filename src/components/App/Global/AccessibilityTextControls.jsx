import { useEffect, useRef, useState } from "react"

const LEVELS = [
  { label: "Normal", value: 1 },
  { label: "Grande", value: 1.22 },
  { label: "Extra", value: 1.42 },
]

const BASE_FONT_SIZE = 17

export default function AccessibilityTextControls() {
  const controlRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false)
  const [levelIndex, setLevelIndex] = useState(() => {
    const saved = Number(localStorage.getItem("accessibilityTextLevel"))
    return Number.isInteger(saved) && saved >= 0 && saved < LEVELS.length ? saved : 0
  })

  useEffect(() => {
    const level = LEVELS[levelIndex]
    document.documentElement.style.fontSize = `${BASE_FONT_SIZE * level.value}px`
    document.documentElement.dataset.textSize = String(levelIndex)
    localStorage.setItem("accessibilityTextLevel", String(levelIndex))
  }, [levelIndex])

  useEffect(() => {
    const hiddenSelectors = ".profile-loading-screen, .loading-screen, .splash, .camera-view-container"

    const updateVisibility = () => {
      setHiddenByOverlay(Boolean(document.querySelector(hiddenSelectors)))
    }

    updateVisibility()

    const observer = new MutationObserver(updateVisibility)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  const toggleOpen = () => {
    setOpen((current) => !current)
  }

  return (
    <div
      ref={controlRef}
      className={`accessibility-widget${open ? " open" : ""}${hiddenByOverlay ? " hidden" : ""}`}
    >
      <button
        type="button"
        className="accessibility-toggle"
        onClick={toggleOpen}
        aria-label="Abrir acessibilidade"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">accessibility_new</span>
      </button>

      {open && (
        <div className="accessibility-panel" aria-label="Controle de tamanho do texto">
          <button
            type="button"
            onClick={() => setLevelIndex((current) => Math.max(0, current - 1))}
            disabled={levelIndex === 0}
            aria-label="Diminuir tamanho do texto"
          >
            A-
          </button>
          <span>{LEVELS[levelIndex].label}</span>
          <button
            type="button"
            onClick={() => setLevelIndex((current) => Math.min(LEVELS.length - 1, current + 1))}
            disabled={levelIndex === LEVELS.length - 1}
            aria-label="Aumentar tamanho do texto"
          >
            A+
          </button>
        </div>
      )}
    </div>
  )
}
