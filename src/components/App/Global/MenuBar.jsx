import { useNavigate, useLocation } from "react-router-dom"
import "../../../styles/Global/MenuBar.css"

export default function MenuBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="nav">
      <ul className="nav__items">

        <li>
          <button
            className="nav__item-btn"
            data-active={isActive("/home")}
            onClick={() => navigate("/home")}
          >
            <span className="material-symbols-outlined">home</span>
          </button>
        </li>

        <li>
          <button
            className="nav__item-btn"
            data-active={isActive("/explore")}
            onClick={() => navigate("/explore")}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </li>

        <li>
          <button
            className="nav__item-btn"
            data-active={isActive("/profile")}
            onClick={() => navigate("/profile")}
          >
            <span className="material-symbols-outlined">person</span>
          </button>
        </li>

      </ul>
    </nav>
  )
}
