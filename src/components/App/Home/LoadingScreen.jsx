// components/Home/LoadingScreen.jsx
import { useRef } from 'react'

export default function LoadingScreen() {
    const canvasRef = useRef(null)  

  return (
    <div className="loading-screen">
      <canvas ref={canvasRef} className="background-canvas" />
      <div className="loading-content">
        <div className="loading-logo">
          <span className="material-symbols-outlined">agriculture</span>
        </div>
        <div className="loading-spinner"></div>
        <p>Inicializando sistema...</p>
      </div>
    </div>
  )
}