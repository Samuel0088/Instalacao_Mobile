// components/AppHeader.jsx
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "../../../styles/Global/AppHeader.css"

export default function AppHeader({ title, showLogo = true, showNotification = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  // Detectar se está rodando como app instalado (PWA)
  useEffect(() => {
    // Verifica se está em modo standalone (instalado)
    const isInStandaloneMode = () => 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone || 
      document.referrer.includes('android-app://')

    setIsStandalone(isInStandaloneMode())

    // Capturar evento de instalação do PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Verificar se já foi instalado
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true)
      setShowInstallButton(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }
  }

  // Títulos dinâmicos baseados na rota
  const getTitle = () => {
    if (title) return title
    if (location.pathname === '/home') return 'Início'
    if (location.pathname === '/profile') return 'Perfil'
    return 'AgroVoo'
  }

  return (
    <nav className="app-header">
      <div className="header-left">
        {showLogo && (
          <img
            src="/assets/image/Logo.png"
            alt="AgroVoo"
            className="header-logo"
          />
        )}
        <h1 className="header-title">{getTitle()}</h1>
      </div>

      <div className="header-right">
        {/* Botão de download - só aparece no navegador e NÃO instalado */}
        {!isStandalone && showInstallButton && (
          <button 
            className="install-btn"
            onClick={handleInstallClick}
          >
            <span className="material-symbols-outlined">download</span>
            <span className="install-text">Baixar App</span>
          </button>
        )}

        {/* Notificação - só aparece se não estiver mostrando o botão de download */}
        {showNotification && !(!isStandalone && showInstallButton) && (
          <button className="notification-btn">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        )}
      </div>
    </nav>
  )
}