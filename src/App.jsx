// App.jsx do PWA
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { AnimatePresence } from "framer-motion"

import Intro from "./pages/App/Intro"
import Login from "./pages/App/Login"
import CadastroCompleto from "./pages/App/CadastroCompleto"
import CadastrarFazenda from "./pages/App/CadastroFazenda"
import Home from "./pages/App/Home"
import Profile from "./pages/App/Profile"
import ForgotPassword from "./pages/App/ForgotPassword"
import Explore from "./pages/App/Explore"
import Planos from "./pages/App/Planos"

// Componentes
import SplashScreen from "./components/App/Global/SplashScreen"
import InstallPrompt from "./components/App/Global/InstallPrompt"
import InstallSuccess from "./components/App/Global/InstallSuccess"
import AccessibilityTextControls from "./components/App/Global/AccessibilityTextControls"
import ProfileLoadingScreen from "./components/App/Profile/ProfileLoadScreen"

// Estilos
import "./App.css"

function AccessibilityGate() {
  const location = useLocation()
  const hiddenRoutes = ["/", "/login", "/register", "/cadastrar-fazenda"]

  if (hiddenRoutes.includes(location.pathname)) return null

  return <AccessibilityTextControls />
}

function RouteChangeLoader() {
  const location = useLocation()
  const firstRenderRef = useRef(true)
  const previousPathRef = useRef(location.pathname)
  const [showRouteLoading, setShowRouteLoading] = useState(false)
  const internalRoutes = ["/home", "/profile", "/explore", "/plans"]

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      previousPathRef.current = location.pathname
      sessionStorage.removeItem("zenithShowWhiteLoaderOnce")
      sessionStorage.removeItem("zenithSkipWhiteLoaderOnce")
      return
    }

    const previousPath = previousPathRef.current
    previousPathRef.current = location.pathname
    const requestedWhiteLoader =
      sessionStorage.getItem("zenithShowWhiteLoaderOnce") === "true"
    const blockWhiteLoaderUntil = Number(
      sessionStorage.getItem("zenithBlockWhiteLoaderUntil") || 0
    )
    const isWhiteLoaderBlocked = Date.now() < blockWhiteLoaderUntil

    sessionStorage.removeItem("zenithShowWhiteLoaderOnce")

    const shouldShowLoader =
      requestedWhiteLoader &&
      !isWhiteLoaderBlocked &&
      internalRoutes.includes(previousPath) &&
      internalRoutes.includes(location.pathname)

    if (!shouldShowLoader) {
      if (!isWhiteLoaderBlocked && blockWhiteLoaderUntil > 0) {
        sessionStorage.removeItem("zenithBlockWhiteLoaderUntil")
      }
      setShowRouteLoading(false)
      return
    }

    setShowRouteLoading(true)
    const timer = setTimeout(() => setShowRouteLoading(false), 650)

    return () => clearTimeout(timer)
  }, [location.pathname])

  if (!showRouteLoading) return null

  return <ProfileLoadingScreen message="Carregando..." />
}

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
      setShowInstallPrompt(true)
    }

    

    // Quando o app for instalado
    const handleAppInstalled = (e) => {
      console.log('🎉 App instalado com sucesso!', e)
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setShowInstallSuccess(true)
      setDeferredPrompt(null)
      
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])


const handleInstall = async () => {
  if (!deferredPrompt) {
    console.log('❌ Prompt não disponível')
    return
  }

  setShowInstallPrompt(false)
  await deferredPrompt.prompt()

  const choiceResult = await deferredPrompt.userChoice

  if (choiceResult.outcome === 'accepted') {
    console.log('✅ Usuário aceitou instalar')
  } else {
    console.log('❌ Usuário recusou')
  }

  setDeferredPrompt(null)
}

const finishInitialSplash = () => {
  setLoading(false)
}

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {loading ? (
          <SplashScreen key="splash" onComplete={finishInitialSplash} />
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
              <Route path="/register" element={<CadastroCompleto setAppLoading={setLoading} />} />
              <Route path="/cadastrar-fazenda" element={<CadastrarFazenda setAppLoading={setLoading} />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/plans" element={<Planos />} />
            </Routes>
            <RouteChangeLoader />
            <AccessibilityGate />
          </>
        )}
      </AnimatePresence>
    </BrowserRouter>
  )
}

export default App
