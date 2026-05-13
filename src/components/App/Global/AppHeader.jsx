// components/AppHeader.jsx

import { useState, useEffect } from "react"
import "../../../styles/Global/AppHeader.css"

export default function AppHeader({
  userName,
  hasFarm,
  farmName,
  onRegister,
  showNotification = true,
}) {

  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    )

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
    }

  }, [])

  const handleInstallClick = async () => {

    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  return (
    <header className="app-header">

      {/* TOPO */}
      <div className="header-top">

        {showNotification && (
          <button className="notification-btn">

            <span className="material-symbols-outlined">
              notifications
            </span>

          </button>
        )}

        <button
          className="install-btn"
          onClick={handleInstallClick}
        >
          Planos
        </button>

      </div>

      {/* CONTEÚDO */}
      <div className="header-content">

        {/* TÍTULO */}
        <h2 className="header-label">
          Agricultura de Precisão
        </h2>

        {/* NOME DO USUÁRIO */}
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

    </header>
  )
}