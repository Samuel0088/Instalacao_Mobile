import { useNavigate, useLocation } from "react-router-dom"
import "../../../styles/Global/MenuBar.css"

export default function MenuBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const items = [
    { path: "/home",    icon: "home"      },
    { path: "/explore", icon: "grid_view" },
    { path: "/profile", icon: "person"    },
  ]

  return (
    <nav className="nav">
      <ul className="nav__items">
        {items.map(({ path, icon }) => {
          const active = isActive(path)
          return (
            <li key={path}
              className={`nav__item ${active
                ? "nav__item--active" : ""}`}>

              {active &&
                <div className="nav__notch-left" />}
              {active &&
                <div className="nav__notch-right" />}

              <button
                className="nav__item-btn"
                data-active={active}
                onClick={() => navigate(path)}>
                <span className=
                  "material-symbols-outlined">
                  {icon}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
} 