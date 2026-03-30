// App.jsx do PWA
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"

import Intro from "./pages/App/Intro"
import Login from "./pages/App/Login"
import CadastroCompleto from "./pages/App/CadastroCompleto"
import Home from "./pages/App/Home"
import Profile from "./pages/App/Profile"
import ForgotPassword from "./pages/App/ForgotPassword"
import Explore from "./pages/App/Explore"

// Componentes
import SplashScreen from "./components/App/Global/SplashScreen"
import InstallPrompt from "./components/App/Global/InstallPrompt"
import InstallSuccess from "./components/App/Global/InstallSuccess"

// Estilos
import "./App.css"

function App() {
  const [loading, setLoading] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showInstallSuccess, setShowInstallSuccess] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Detectar dispositivo
    const userAgent = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent))
    setIsAndroid(/Android/i.test(userAgent))

    // Verificar se já está instalado (modo standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true
    
    if (isStandalone) {
      setIsInstalled(true)
      console.log('✅ App rodando em modo standalone')
      return
    }

    // Verificar parâmetros da URL
    const params = new URLSearchParams(window.location.search)
    const shouldInstall = params.get('install') === 'true'
    const source = params.get('source')
    
    console.log('📱 Modo:', isStandalone ? 'standalone' : 'navegador')
    console.log('🔧 Parâmetros:', { shouldInstall, source })

    // Se veio para instalar, mostrar prompt após 1 segundo
    if (shouldInstall && !isStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 1000)
    }

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      console.log('📲 Evento beforeinstallprompt capturado')
      setDeferredPrompt(e)
      
      // Se veio com install=true, disparar automaticamente
      if (shouldInstall) {
        setTimeout(() => {
          handleInstall()
        }, 1500)
      }
    }

    // Quando o app for instalado
    const handleAppInstalled = (e) => {
      console.log('🎉 App instalado com sucesso!', e)
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setShowInstallSuccess(true)
      setDeferredPrompt(null)
      
      // Tentar fechar a janela após 2 segundos (se possível)
      setTimeout(() => {
        try {
          // Só tenta fechar se não estiver em modo standalone
          if (!window.matchMedia('(display-mode: standalone)').matches) {
            // No Android, tentar redirecionar para o app
            if (isAndroid) {
              const packageName = 'com.agrovoo.app' // Substitua pelo seu package name
              const intentUrl = `intent://${window.location.host}#Intent;scheme=https;package=${packageName};end;`
              window.location.href = intentUrl
            }
            
            // Não é possível fechar programaticamente por segurança,
            // mas podemos dar instruções
            console.log('✅ App instalado! Feche esta aba e abra o app da área de trabalho.')
          }
        } catch (error) {
          console.log('Erro ao tentar redirecionar:', error)
        }
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isAndroid])


  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {loading ? (
          <SplashScreen key="splash" onComplete={() => setLoading(false)} />
        ) : (
          <>
            {/* Prompt de instalação */}
            {showInstallPrompt && !isInstalled && (
              <InstallPrompt 
                onInstall={handleInstall}
                onClose={() => setShowInstallPrompt(false)}
                isIOS={isIOS}
                isAndroid={isAndroid}
                hasPrompt={!!deferredPrompt}
              />
            )}

            {/* Mensagem de sucesso após instalação */}
            {showInstallSuccess && (
              <InstallSuccess 
                onClose={() => setShowInstallSuccess(false)}
                isIOS={isIOS}
                isAndroid={isAndroid}
              />
            )}
            
            <Routes key="app">
              <Route path="/" element={<Intro />} />
              <Route path="/login" element={<Login setAppLoading={setLoading} />} />
              <Route path="/register" element={<CadastroCompleto />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/explore" element={<Explore />} />
            </Routes>
          </>
        )}
      </AnimatePresence>
    </BrowserRouter>
  )
}

export default App