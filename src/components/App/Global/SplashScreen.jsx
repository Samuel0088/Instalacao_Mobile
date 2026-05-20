// SplashScreen.jsx - Versão com foco na animação de crescimento das plantas
import { useEffect, useState, useRef, memo } from "react"
import "../../../styles/Global/SplashScreen.css"

// Componente de planta com animação de crescimento SUPER VISÍVEL
const Plant = memo(({ plant, stage }) => {
  const { id, left, height, delay, type } = plant
  
  return (
    <div
      className={`plant type-${type} ${stage >= 2 ? 'grow' : ''}`}
      style={{
        left: `${left}%`,
        '--plant-height': `${height}px`,
        '--plant-delay': `${delay}s`,
      }}
    >
      {/* Caule com animação de crescimento bem visível */}
      <div className="stem">
        <div className="stem-base"></div>
        <div className="stem-grow-line"></div>
        <div className="stem-glow"></div>
      </div>
      
      {/* Folhas - aparecem gradualmente */}
      <div className="leaves">
        <div className="leaf left"></div>
        <div className="leaf right"></div>
        <div className="leaf top"></div>
      </div>
      
      {/* Fruto - aparece no final */}
      <div className="fruit"></div>
      
      {/* Marcadores de crescimento (visíveis durante a animação) */}
      <div className="growth-marker" style={{ bottom: '25%' }}></div>
      <div className="growth-marker" style={{ bottom: '50%' }}></div>
      <div className="growth-marker" style={{ bottom: '75%' }}></div>
    </div>
  )
})

export default function SplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dronePos, setDronePos] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("INICIANDO SCAN...")
  const [isMobile, setIsMobile] = useState(false) // Começa como false para SSR
  
  const timeoutsRef = useRef([])
  
  // Detectar mobile apenas no cliente
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768)
  }, [])
  
  // Plantas - criar apenas no cliente também
  const [plantData, setPlantData] = useState([])
  
  useEffect(() => {
    // Só criar as plantas no cliente
    if (isMobile) {
      // Mobile: poucas plantas e mais baixas
      setPlantData(
        Array(12).fill(0).map((_, i) => ({  // Reduzido para 12
          id: i,
          left: (i * 8) + (Math.random() * 5), // Mais espaçadas
          height: 40 + Math.random() * 50, // Altura bem reduzida
          delay: 0.1 + (Math.random() * 1.5),
          type: Math.floor(Math.random() * 3),
        }))
      )
    } else {
      // Desktop: configuração normal
      setPlantData(
        Array(25).fill(0).map((_, i) => ({
          id: i,
          left: (i * 4) + (Math.random() * 3),
          height: 80 + Math.random() * 100,
          delay: 0.1 + (Math.random() * 1.5),
          type: Math.floor(Math.random() * 3),
        }))
      )
    }
  }, [isMobile])

  useEffect(() => {
    const timeouts = []
    
    const setSafeTimeout = (fn, delay) => {
      const id = setTimeout(fn, delay)
      timeouts.push(id)
      timeoutsRef.current.push(id)
      return id
    }

    // SEQUÊNCIA COM TEMPO PARA VER O CRESCIMENTO
   setSafeTimeout(() => setStage(1), 100)
setSafeTimeout(() => setStage(2), 600)
    
    setSafeTimeout(() => {
      setStage(3) // Drone começa a entrar
      
      let pos = 0
      // Velocidade do drone baseada no mobile
      const droneSpeed = isMobile ? 0.8 : 1.4
      const droneInterval = setInterval(() => {
        pos += droneSpeed
        if (pos <= 100) {
          setDronePos(pos)
        } else {
          clearInterval(droneInterval)
          setSafeTimeout(() => setStage(4), 500)
        }
      }, 25)
      
      timeouts.push({ cleanup: () => clearInterval(droneInterval) })
    }, 5500)
    
    setSafeTimeout(() => {
      let progressValue = 0
      // Progresso mais lento no mobile
      const progressSpeed = isMobile ? 2 : 3
      const progressInterval = setInterval(() => {
        progressValue += progressSpeed
        
        if (progressValue < 20) setLoadingMessage("INICIANDO SCAN...")
        else if (progressValue < 40) setLoadingMessage("MAPEANDO TERRENO...")
        else if (progressValue < 60) setLoadingMessage("DETECTANDO CULTIVOS...")
        else if (progressValue < 80) setLoadingMessage("PROCESSANDO DADOS...")
        else if (progressValue < 100) setLoadingMessage("GERANDO RELATÓRIO...")
        else setLoadingMessage("SCAN COMPLETO!")
        
        setProgress(progressValue)
        
        if (progressValue >= 100) {
          clearInterval(progressInterval)
          setSafeTimeout(() => setStage(5), 1500)
          setSafeTimeout(onComplete, 3000)
        }
      }, 50)
      
      timeouts.push({ cleanup: () => clearInterval(progressInterval) })
    }, 7500)

    return () => {
      timeouts.forEach(t => {
        if (t.cleanup) t.cleanup()
        else clearTimeout(t)
      })
    }
  }, [onComplete, isMobile])

  // Animação do drone (mantida igual)
  const getDroneStyle = () => {
    if (stage < 3) return { x: -45, y: 25, scale: 0.3, opacity: 0 }
    
    if (stage === 3) {
      const t = dronePos / 100
      const easeOut = 1 - Math.pow(1 - t, 1.8)
      
      return {
        x: -45 + (easeOut * 45),
        y: 25 - (easeOut * 28),
        scale: 0.3 + (easeOut * 0.7),
        opacity: 0.2 + (easeOut * 0.8),
      }
    }
    
    if (stage === 4) {
      return {
        x: 0,
        y: -2 + Math.sin(Date.now() * 0.003) * 1.2,
        scale: 1,
        opacity: 1,
      }
    }
    
    return { x: 50, y: -20, scale: 0.5, opacity: 0 }
  }

  const droneStyle = getDroneStyle()

  // Não renderizar nada até ter os dados das peesas
  if (plantData.length === 0) {
    return <div className="splash" style={{ background: '#0a2a0a' }}></div>
  }

  return (
    <div className="splash">
      {/* Fundo */}
      <div className="bg">
        <div className="bg-sky"></div>
        <div className="bg-horizon"></div>
        <div className="bg-vignette"></div>
      </div>

      {/* TERRA */}
      <div className={`ground ${stage >= 1 ? 'ground-visible' : ''}`}>
        <div className="soil">
          <div className="soil-base"></div>
          <div className="soil-texture"></div>
          <div className="soil-highlight"></div>
        </div>
      </div>

      {/* PLANTAÇÃO - COM CRESCIMENTO BEM VISÍVEL */}
      <div className="plantation">
        {plantData.map((plant) => (
          <Plant key={plant.id} plant={plant} stage={stage} />
        ))}
      </div>

      {/* DRONE */}
      {stage >= 3 && (
        <div 
          className="drone-wrapper"
          style={{
            transform: `translate(calc(-50% + ${droneStyle.x}vw), calc(-50% + ${droneStyle.y}vh)) scale(${droneStyle.scale})`,
            opacity: droneStyle.opacity,
          }}
        >
          <DronePremium hovering={stage === 4} />
        </div>
      )}

      {/* SCAN */}
      {stage === 4 && (
        <div className="loading-screen">
          <div className="scan-overlay">
            <div className="scan-grid"></div>
            <div className="scan-lines"></div>
          </div>
          
          <div className="loading-card">
            <div className="loading-header">
              <div className="loading-icon">⟡</div>
              <div className="loading-title">
                <span className="loading-main">SCAN</span>
                <span className="loading-sub">AGRÍCOLA</span>
              </div>
            </div>
            
            <div className="progress-main">
              <div className="progress-bar-container">
                <div className="progress-bar-bg"></div>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="progress-glow"></div>
                </div>
              </div>
              
              <div className="progress-stats">
                <span className="progress-percentage">{Math.floor(progress)}%</span>
                <span className="progress-message">{loadingMessage}</span>
              </div>
            </div>
            
            <div className="loading-metrics">
              <div className="metric">
                <span className="metric-label">ÁREA</span>
                <span className="metric-value">{(progress * 0.24).toFixed(1)} ha</span>
              </div>
              <div className="metric">
                <span className="metric-label">PLANTAS</span>
                <span className="metric-value">{Math.floor(progress * 0.9)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">QUALIDADE</span>
                <span className="metric-value">98%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETION */}
      {progress === 100 && stage === 4 && (
        <div className="completion-screen">
          <div className="completion-circle">
            <div className="completion-check">✓</div>
          </div>
          <div className="completion-text">
            <div className="completion-main">SCAN COMPLETO</div>
            <div className="completion-sub">Iniciando aplicativo...</div>
          </div>
        </div>
      )}

      {/* FADE OUT */}
      {stage === 5 && <div className="fade-out"></div>}
    </div>
  )
}

// DronePremium (igual ao anterior, mantido)
function DronePremium({ hovering }) {
  return (
    <div className={`drone-premium ${hovering ? 'drone-hover' : ''}`}>
      {/* CORPO CENTRAL */}
      <div className="drone-core">
        <div className="core-hex primary"></div>
        <div className="core-hex secondary"></div>
        <div className="core-hex inner"></div>
        <div className="core-logo">AGRO <br />TECH</div>
      </div>

      {/* BRAÇOS */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <div key={angle} className="drone-arm" style={{ transform: `rotate(${angle}deg)` }}>
          <div className="arm-bar"></div>
          <div className="motor-unit">
            <div className="motor-base"></div>
            <div className="propeller-assembly">
              <div className="blade-set">
                <div className="blade blade-1"></div>
                <div className="blade blade-2"></div>
                <div className="blade blade-3"></div>
              </div>
              <div className="propeller-hub"></div>
            </div>
          </div>
        </div>
      ))}

      {/* SENSORES */}
      <div className="sensor-package camera"></div>
      <div className="sensor-package lidar"></div>
    </div>
  )
}