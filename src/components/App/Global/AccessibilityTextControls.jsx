import { useEffect, useRef, useState } from "react"

const LEVELS = [
  { label: "Normal", value: 1 },
  { label: "Grande", value: 1.12 },
  { label: "Extra", value: 1.24 },
]

export default function AccessibilityTextControls() {
  const controlRef = useRef(null)
  const frameRef = useRef(null)
  const latestPositionRef = useRef(null)
  const draggedRef = useRef(false)

  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false)
  const [levelIndex, setLevelIndex] = useState(() => {
    const saved = Number(localStorage.getItem("accessibilityTextLevel"))
    return Number.isInteger(saved) && saved >= 0 && saved < LEVELS.length ? saved : 0
  })

  useEffect(() => {
    const level = LEVELS[levelIndex]
    document.documentElement.style.fontSize = `${16 * level.value}px`
    document.documentElement.dataset.textSize = String(levelIndex)
    localStorage.setItem("accessibilityTextLevel", String(levelIndex))
  }, [levelIndex])

  useEffect(() => {
    localStorage.removeItem("accessibilityTextPosition")
    setPosition({
      x: Math.max(8, window.innerWidth - 60),
      y: 76,
    })
  }, [])

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

  const clampPosition = (nextPosition) => {
    const rect = controlRef.current?.getBoundingClientRect()
    const width = rect?.width || 52
    const height = rect?.height || 52

    return {
      x: Math.min(Math.max(8, nextPosition.x), window.innerWidth - width - 8),
      y: Math.min(Math.max(8, nextPosition.y), window.innerHeight - height - 8),
    }
  }

  const applyPosition = (nextPosition) => {
    latestPositionRef.current = nextPosition

    if (frameRef.current) return

    frameRef.current = requestAnimationFrame(() => {
      if (controlRef.current && latestPositionRef.current) {
        controlRef.current.style.left = `${latestPositionRef.current.x}px`
        controlRef.current.style.top = `${latestPositionRef.current.y}px`
      }

      frameRef.current = null
    })
  }

  const startDrag = (event) => {
    if (!position) return

    const startX = event.clientX
    const startY = event.clientY
    const initialPosition = position

    draggedRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        draggedRef.current = true
      }

      applyPosition(clampPosition({
        x: initialPosition.x + deltaX,
        y: initialPosition.y + deltaY,
      }))
    }

    const handleUp = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      const finalPosition = latestPositionRef.current || position
      setPosition(finalPosition)
      latestPositionRef.current = null

      event.currentTarget.removeEventListener("pointermove", handleMove)
      event.currentTarget.removeEventListener("pointerup", handleUp)
      event.currentTarget.removeEventListener("pointercancel", handleUp)
    }

    event.currentTarget.addEventListener("pointermove", handleMove)
    event.currentTarget.addEventListener("pointerup", handleUp)
    event.currentTarget.addEventListener("pointercancel", handleUp)
  }

  const toggleOpen = () => {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }

    setOpen((current) => !current)
  }

  return (
    <div
      ref={controlRef}
      className={`accessibility-widget${open ? " open" : ""}${hiddenByOverlay ? " hidden" : ""}`}
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
    >
      <button
        type="button"
        className="accessibility-toggle"
        onPointerDown={startDrag}
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
