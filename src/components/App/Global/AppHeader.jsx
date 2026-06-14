// components/AppHeader.jsx

import { useNavigate } from "react-router-dom"
import "../../../styles/Global/AppHeader.css"

export default function AppHeader({
  userName,
  hasFarm,
  farmName,
  onRegister,
  showNotification = true,
  showHomeContent = false,
}) {

  const navigate = useNavigate()

  return (
    <header
      className={`app-header ${
        !showHomeContent ? "compact" : ""
      }`}
    >

      {/* TOPO */}
      <div className="header-top">
        <button className="header-brand" onClick={() => navigate("/home")}>
          Zenith
        </button>

        <div className="header-actions">
          {showNotification && (
            <button className="notification-btn" aria-label="Notificações">

              <span className="material-symbols-outlined">
                notifications
              </span>

            </button>
          )}

          <button
            className="profile-avatar-btn"
            onClick={() => navigate("/profile")}
            aria-label="Abrir perfil"
          >
            <span>🌽</span>
          </button>
        </div>

      </div>

      {/* MOSTRAR SOMENTE NA HOME */}
      {showHomeContent && (
        <div className="header-content">

          {/* TÍTULO */}
          <h2 className="header-label">
            Agricultura de Precisão
          </h2>

          {/* NOME */}
          <div className="balance-row">

            <h1 className="header-balance">
              Olá, {userName || "Agricultor"}
            </h1>

            <span className="material-symbols-outlined arrow-icon">
              chevron_right
            </span>

          </div>

          {/* STATUS */}
          <button
            className="coverage-btn"
            onClick={!hasFarm ? onRegister : undefined}
          >

            {hasFarm
              ? `Sistema online • ${farmName}`
              : "Comece cadastrando sua fazenda"
            }

            <span className="material-symbols-outlined small-arrow">
              chevron_right
            </span>

          </button>

        </div>
      )}

    </header>
  )
}
