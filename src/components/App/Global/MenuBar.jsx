import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "../../../styles/Global/MenuBar.css"

const NAV_W    = 400  // nav width
const NAV_H    = 30
const NOTCH_R  = 28
const NOTCH_SW = 25  // distancia do arco até o centro do botão
const BTR      = 3   // border radius do nav

// Centro X de cada um dos 3 itens
const ITEM_CENTERS = [NAV_W / 6, NAV_W / 2, (NAV_W * 5) / 6]

const items = [
  { path: "/home",    icon: "home"      },
  { path: "/explore", icon: "grid_view" },
  { path: "/profile", icon: "person"    },
]

function buildNotchPath(activeIdx) {
  if (activeIdx < 0) {
    return [
      `M ${BTR},0`,
      `Q 0,0 0,${BTR}`,
      `L 0,${NAV_H} L ${NAV_W},${NAV_H}`,
      `L ${NAV_W},${BTR}`,
      `Q ${NAV_W},0 ${NAV_W - BTR},0`,
      "Z",
    ].join(" ")
  }

  const cx = ITEM_CENTERS[activeIdx]
  const x0 = cx - NOTCH_R - NOTCH_SW
  const x3 = cx + NOTCH_R + NOTCH_SW

  return [
    `M ${BTR},0`,
    `Q 0,0 0,${BTR}`,
    `L 0,${NAV_H} L ${NAV_W},${NAV_H}`,
    `L ${NAV_W},${BTR}`,
    `Q ${NAV_W},0 ${NAV_W - BTR},0`,
    `L ${x3},0`,
    `C ${x3 - NOTCH_SW * 0.3},0 ${cx + NOTCH_R},${NOTCH_R} ${cx},${NOTCH_R}`,
    `C ${cx - NOTCH_R},${NOTCH_R} ${x0 + NOTCH_SW * 0.3},0 ${x0},0`,
    "Z",
  ].join(" ")
}

export default function MenuBar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)
  const [isVisible, setIsVisible] = useState(true)
  const isActive  = (path) => location.pathname === path
  const activeIdx = items.findIndex(({ path }) => isActive(path))
  const goToInternalPage = (path) => {
    if (location.pathname === path) return
    sessionStorage.setItem("zenithShowWhiteLoaderOnce", "true")
    navigate(path)
  }

  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      if (tickingRef.current) return

      tickingRef.current = true
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const scrollDelta = currentScrollY - lastScrollYRef.current
        const isNearTop = currentScrollY < 12

        if (isNearTop) {
          setIsVisible(true)
        } else if (scrollDelta > 8) {
          setIsVisible(false)
        } else if (scrollDelta < -8) {
          setIsVisible(true)
        }

        lastScrollYRef.current = currentScrollY
        tickingRef.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <nav className={`nav ${isVisible ? "nav--visible" : "nav--hidden"}`}>
      <svg
        className="nav__notch-svg"
        viewBox={`0 0 ${NAV_W} ${NAV_H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d={buildNotchPath(activeIdx)} fill="#3d8057" />
      </svg>

      <ul className="nav__items">
        {items.map(({ path, icon }) => {
          const active = isActive(path)
          return (
            <li
              key={path}
              className={`nav__item${active ? " nav__item--active" : ""}`}
            >
              <button
                className={`nav__item-btn${active ? " nav__item-btn--active" : ""}`}
                onClick={() => goToInternalPage(path)}
                aria-current={active ? "page" : undefined}
              >
                <span className="material-symbols-outlined">{icon}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
