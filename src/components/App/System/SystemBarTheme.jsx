import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

const DEFAULT_COLOR = "#3d8057"
const TRANSLUCENT_BAR_COLOR = "transparent"

const ROUTE_COLORS = {
  "/": "#07110b",
  "/login": "#091c13",
  "/register": "#f8fcf6",
  "/cadastrar-fazenda": "#091c13",
  "/home": "#163020",
  "/profile": "#f7f5f0",
  "/forgot-password": "#f7f5f0",
  "/explore": "#3f8a5d",
  "/plans": "#07140d",
}

function normalizeHex(color) {
  if (!color || typeof color !== "string") return DEFAULT_COLOR

  const trimmed = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()

  return DEFAULT_COLOR
}

function getCssColor(color) {
  if (!color || typeof color !== "string") return DEFAULT_COLOR

  const trimmed = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (trimmed === "transparent") return trimmed
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/.test(trimmed)) {
    return trimmed
  }

  return DEFAULT_COLOR
}

function getRelativeLuminance(hexColor) {
  const normalized = normalizeHex(hexColor).slice(1)
  const channels = [0, 2, 4].map((start) => {
    const value = parseInt(normalized.slice(start, start + 2), 16) / 255

    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  })

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2])
}

function getAppleStatusBarStyle(color) {
  return getRelativeLuminance(color) > 0.62 ? "default" : "black-translucent"
}

function getActiveMarkedColor(fallbackColor) {
  const markers = [...document.querySelectorAll("[data-system-bar-color]")]
  const sampleY = 1

  let activeColor = fallbackColor
  let closestTop = Number.NEGATIVE_INFINITY

  for (const marker of markers) {
    const rect = marker.getBoundingClientRect()
    const color = marker.dataset.systemBarColor

    if (!color || rect.height <= 0 || rect.bottom <= sampleY) continue

    if (rect.top <= sampleY && rect.top >= closestTop) {
      activeColor = color
      closestTop = rect.top
    }
  }

  return normalizeHex(activeColor)
}

export default function SystemBarTheme() {
  const location = useLocation()
  const frameRef = useRef(null)
  const lastColorRef = useRef("")

  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    const navButtonMeta = document.querySelector('meta[name="msapplication-navbutton-color"]')
    const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    const fallbackColor = ROUTE_COLORS[location.pathname] || DEFAULT_COLOR

    const applyColor = (barColor, pageColor) => {
      const normalizedColor = getCssColor(barColor)
      const normalizedPageColor = normalizeHex(pageColor)
      const luminanceColor = normalizedColor === "transparent"
        ? normalizedPageColor
        : normalizeHex(barColor)

      if (lastColorRef.current === normalizedColor) return

      lastColorRef.current = normalizedColor
      themeColorMeta?.setAttribute("content", normalizedColor)
      navButtonMeta?.setAttribute("content", normalizedColor)
      appleStatusMeta?.setAttribute("content", getAppleStatusBarStyle(luminanceColor))
      document.documentElement.style.backgroundColor = normalizedPageColor
      document.body.style.backgroundColor = normalizedPageColor
    }

    const updateColor = () => {
      frameRef.current = null
      const activeColor = getActiveMarkedColor(fallbackColor)
      applyColor(TRANSLUCENT_BAR_COLOR, activeColor)
    }

    const requestUpdate = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(updateColor)
    }

    lastColorRef.current = ""
    requestUpdate()

    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)
    window.addEventListener("orientationchange", requestUpdate)
    window.addEventListener("system-bar-color-change", requestUpdate)

    const observer = new MutationObserver(requestUpdate)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-system-bar-color"],
    })

    return () => {
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
      window.removeEventListener("orientationchange", requestUpdate)
      window.removeEventListener("system-bar-color-change", requestUpdate)
      observer.disconnect()

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [location.pathname])

  return <div className="system-bar-glass" aria-hidden="true" />
}
