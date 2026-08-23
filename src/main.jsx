import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.__zenithDeferredInstallPrompt = null

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  window.__zenithDeferredInstallPrompt = event
  window.dispatchEvent(new CustomEvent('zenith-install-prompt-ready', {
    detail: { prompt: event }
  }))
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

let refreshing = false
const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

// registrar service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado")
        registration.update().catch(() => {})

        if (isStandaloneMode() && registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(
            new CustomEvent("app-update-available", {
              detail: { registration, worker: registration.waiting }
            })
          )
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (
              isStandaloneMode() &&
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent("app-update-available", {
                  detail: { registration, worker: newWorker }
                })
              )
            }
          })
        })
      })
      .catch((err) => {
        console.log("Erro ao registrar SW:", err)
      })
  })

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
