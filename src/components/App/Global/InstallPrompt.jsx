import { motion } from "framer-motion"
import { useState } from "react"
import { FaDownload, FaTimes, FaAndroid, FaApple } from 'react-icons/fa'
import '../../../styles/Global/InstallPrompt.css'

const InstallPrompt = ({ onInstall, onClose, isIOS, isAndroid, isChromeAndroid, hasPrompt }) => {
  const [showInstructions, setShowInstructions] = useState(false)
  const canInstallDirectly = hasPrompt && !isIOS
  const shouldOpenChrome = isAndroid && !isChromeAndroid && !hasPrompt

  const handleFallbackInstall = () => {
    if (shouldOpenChrome) {
      const currentPath = `${window.location.host}${window.location.pathname}${window.location.search}`
      window.location.href = `intent://${currentPath}#Intent;scheme=https;package=com.android.chrome;end`
      return
    }

    setShowInstructions(true)
  }

  return (
    <motion.div 
      className="install-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="install-box"
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="icon">
          <FaDownload />
        </div>

        <h2>Instalar App</h2>
        <p className="subtitle">
          Acesse mais rápido e sem navegador.
        </p>

        <button
          className="install-main-btn"
          onClick={canInstallDirectly ? onInstall : handleFallbackInstall}
        >
          <FaDownload /> {
            canInstallDirectly
              ? "Instalar agora"
              : shouldOpenChrome
                ? "Abrir no Chrome"
                : "Ver como instalar"
          }
        </button>

        {!hasPrompt && (
          <div className={`hint${showInstructions ? " hint--expanded" : ""}`}>
            {showInstructions && isIOS ? (
              <ol className="install-steps">
                <li>Toque no botão <b>Compartilhar</b> do navegador.</li>
                <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
                <li>Confirme tocando em <b>Adicionar</b>.</li>
              </ol>
            ) : showInstructions ? (
              <ol className="install-steps">
                <li>Abra o menu <b>⋮</b> do navegador.</li>
                <li>Toque em <b>Instalar app</b>.</li>
                <li>Confirme a instalação.</li>
              </ol>
            ) : isIOS ? (
              <>
                <FaApple /> Toque em <b>Compartilhar</b> → <b>Tela de Início</b>
              </>
            ) : (
              <>
                <FaAndroid /> Menu ⋮ → <b>Instalar app</b>
              </>
            )}
          </div>
        )}

        {/* BENEFÍCIOS SIMPLES */}
        <div className="benefits">
          <span>⚡ Rápido</span>
          <span>📱 Como app</span>
          <span>🔒 Seguro</span>
        </div>

        <button className="later-btn" onClick={onClose}>
          Agora não
        </button>
      </motion.div>
    </motion.div>
  )
}

export default InstallPrompt
