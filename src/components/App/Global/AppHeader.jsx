// components/AppHeader.jsx

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router-dom"
import "../../../styles/Global/AppHeader.css"

export default function AppHeader({
  userName,
  hasFarm,
  farmName,
  cityName,
  onRegister,
  showNotification = true,
  showHomeContent = false,
}) {

  const navigate = useNavigate()
  const location = useLocation()
  const notificationRef = useRef(null)
  const notificationPanelRef = useRef(null)
  const notificationButtonRef = useRef(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationPanelStyle, setNotificationPanelStyle] = useState({})
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  )

  const goToInternalPage = (path) => {
    if (location.pathname === path) return
    sessionStorage.setItem("zenithShowWhiteLoaderOnce", "true")
    navigate(path)
  }

  const notifications = useMemo(() => {
    if (!hasFarm) {
      return [
        {
          icon: "add_location_alt",
          title: "Cadastro da fazenda pendente",
          description: "Cadastre sua fazenda para liberar clima, área e monitoramento.",
          action: "Cadastrar agora",
          onClick: onRegister,
        },
        {
          icon: "tips_and_updates",
          title: "Primeiro passo",
          description: "Depois do cadastro, o painel passa a mostrar dados do campo em tempo real.",
        },
      ]
    }

    return [
      {
        icon: "check_circle",
        title: "Sistema online",
        description: farmName
          ? `Monitoramento ativo para ${farmName}.`
          : "Monitoramento ativo para sua fazenda.",
      },
      {
        icon: "assignment",
        title: "Atividades do campo",
        description: "Revise tarefas, diagnósticos e registros recentes.",
        action: "Ver atividades",
        onClick: () => {
          sessionStorage.setItem("zenithShowWhiteLoaderOnce", "true")
          navigate("/explore", { state: { activeTab: "atividades" } })
        },
      },
    ]
  }, [farmName, hasFarm, navigate, onRegister])

  useEffect(() => {
    if (!notificationsOpen) return

    const handlePointerDown = (event) => {
      const clickedButton = notificationRef.current?.contains(event.target)
      const clickedPanel = notificationPanelRef.current?.contains(event.target)

      if (!clickedButton && !clickedPanel) {
        setNotificationsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [notificationsOpen])

  useEffect(() => {
    if (!notificationsOpen) return

    const updatePanelPosition = () => {
      const buttonRect = notificationButtonRef.current?.getBoundingClientRect()
      if (!buttonRect) return

      const panelWidth = Math.min(318, window.innerWidth - 24)
      const preferredLeft = buttonRect.right - panelWidth
      const left = Math.max(12, Math.min(preferredLeft, window.innerWidth - panelWidth - 12))
      const top = Math.min(buttonRect.bottom + 12, window.innerHeight - 24)

      setNotificationPanelStyle({
        "--notification-panel-left": `${left}px`,
        "--notification-panel-top": `${top}px`,
        "--notification-panel-width": `${panelWidth}px`,
        "--notification-panel-arrow-left": `${buttonRect.left + buttonRect.width / 2 - left - 7}px`,
      })
    }

    updatePanelPosition()
    window.addEventListener("resize", updatePanelPosition)
    window.addEventListener("scroll", updatePanelPosition, true)

    return () => {
      window.removeEventListener("resize", updatePanelPosition)
      window.removeEventListener("scroll", updatePanelPosition, true)
    }
  }, [notificationsOpen])

  const handleEnableNotifications = async () => {
    if (typeof Notification === "undefined") return

    const permission = await Notification.requestPermission()
    const enabled = permission === "granted"
    setNotificationsEnabled(enabled)

    if (enabled) {
      new Notification("Zenith", {
        body: "Notificações ativadas com sucesso.",
        icon: "/assets/image/Logo-redonda.png",
      })
    }
  }

  const handleNotificationAction = (notification) => {
    notification.onClick?.()
    setNotificationsOpen(false)
  }

  const notificationPanel = notificationsOpen && typeof document !== "undefined"
    ? createPortal(
        <div
          className="notification-panel"
          role="dialog"
          aria-label="Central de notificações"
          ref={notificationPanelRef}
          style={notificationPanelStyle}
        >
          <div className="notification-panel-header">
            <div>
              <strong>Notificações</strong>
              <span>{notifications.length} atualizações</span>
            </div>
            <button
              className="notification-close"
              aria-label="Fechar notificações"
              onClick={() => setNotificationsOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="notification-list">
            {notifications.map((notification) => (
              <div className="notification-item" key={notification.title}>
                <div className="notification-item-icon">
                  <span className="material-symbols-outlined">{notification.icon}</span>
                </div>
                <div className="notification-item-content">
                  <strong>{notification.title}</strong>
                  <p>{notification.description}</p>
                  {notification.action && (
                    <button onClick={() => handleNotificationAction(notification)}>
                      {notification.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {typeof Notification !== "undefined" && !notificationsEnabled && (
            <button
              className="notification-enable"
              onClick={handleEnableNotifications}
            >
              <span className="material-symbols-outlined">notifications_active</span>
              Ativar alertas do navegador
            </button>
          )}
        </div>,
        document.body
      )
    : null

  return (
    <>
      {notificationPanel}

      <header
        data-system-bar-color={showHomeContent ? "#fff7e8" : "#163020"}
        className={`app-header ${
          !showHomeContent ? "compact" : ""
        } ${showHomeContent ? "home-app-header" : ""}`}
      >

      {/* TOPO */}
      <div className="header-top">
        {showHomeContent ? (
          <button className="home-user-heading" onClick={() => goToInternalPage("/home")}>
            <span>
              Olá, <strong>{userName || "Agricultor"}</strong>
              <span className="home-user-leaf material-symbols-outlined" aria-hidden="true">eco</span>
            </span>
            <small>
              <span className="material-symbols-outlined">location_on</span>
              {cityName || farmName || "Cadastre sua fazenda"}
            </small>
          </button>
        ) : (
          <button className="header-brand" onClick={() => goToInternalPage("/home")}>
            Zenith
          </button>
        )}

        <div className="header-actions">
          {showNotification && (
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                ref={notificationButtonRef}
                className={`notification-btn ${notificationsOpen ? "active" : ""}`}
                aria-label="Notificações"
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                onClick={() => setNotificationsOpen((isOpen) => !isOpen)}
              >
                <span className="material-symbols-outlined">
                  notifications
                </span>
                <span className="notification-dot" aria-hidden="true"></span>
              </button>
            </div>
          )}

          {!showHomeContent && (
            <button
              className="profile-avatar-btn"
              onClick={() => goToInternalPage("/profile")}
              aria-label="Abrir perfil"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          )}
        </div>

      </div>

      </header>
    </>
  )
}
