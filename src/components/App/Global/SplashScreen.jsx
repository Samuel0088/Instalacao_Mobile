import { useEffect, useMemo, useState } from "react"
import "../../../styles/Global/SplashScreen.css"

const messages = [
  { until: 25, text: "Identificando sinais na soja..." },
  { until: 50, text: "Drone iniciando varredura..." },
  { until: 75, text: "Detectando doenças com IA..." },
  { until: 99, text: "Aplicando correção inteligente..." },
  { until: 100, text: "Análise concluída" }
]

function getMessage(progress) {
  return messages.find((message) => progress <= message.until)?.text || messages.at(-1).text
}

function getStage(progress) {
  if (progress >= 100) return "complete"
  if (progress >= 75) return "healthy"
  if (progress >= 50) return "treating"
  if (progress >= 25) return "drone"
  return "sick"
}

export default function SplashScreen({ onComplete, duration = 6200, loop = false }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let startedAt = performance.now()
    let frameId
    let completeTimer

    const tick = (now) => {
      const elapsed = now - startedAt
      const nextProgress = Math.min((elapsed / duration) * 100, 100)

      setProgress(nextProgress)

      if (nextProgress < 100) {
        frameId = requestAnimationFrame(tick)
        return
      }

      if (loop) {
        completeTimer = setTimeout(() => {
          startedAt = performance.now()
          setProgress(0)
          frameId = requestAnimationFrame(tick)
        }, 700)
        return
      }

      completeTimer = setTimeout(() => onComplete?.(), 650)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(completeTimer)
    }
  }, [duration, loop, onComplete])

  const roundedProgress = Math.min(Math.round(progress), 100)
  const stage = getStage(roundedProgress)
  const message = useMemo(() => getMessage(roundedProgress), [roundedProgress])

  return (
    <main className={`splash splash-${stage}`} role="status" aria-live="polite">
      <div className="splash-tech-bg" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <section className="splash-stage-card">
        <div className="splash-brand">
          <span className="splash-brand-mark">IA</span>
          <div>
            <strong>Zenith Agro</strong>
            <small>Monitoramento inteligente de lavouras</small>
          </div>
        </div>

        <div className="splash-scene" aria-hidden="true">
          <svg viewBox="0 0 360 260" className="splash-illustration">
            <defs>
              <linearGradient id="leafSick" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#d9c86a" />
                <stop offset="100%" stopColor="#9f8d35" />
              </linearGradient>
              <linearGradient id="leafHealthy" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#8ecf6d" />
                <stop offset="100%" stopColor="#2f8f4f" />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="scan-grid">
              <path d="M42 218 H318" />
              <path d="M72 188 H288" />
              <path d="M102 158 H258" />
              <path d="M180 44 V226" />
              <path d="M98 76 L262 220" />
              <path d="M262 76 L98 220" />
            </g>

            <g className="drone">
              <line x1="122" y1="52" x2="82" y2="32" />
              <line x1="238" y1="52" x2="278" y2="32" />
              <line x1="122" y1="74" x2="82" y2="96" />
              <line x1="238" y1="74" x2="278" y2="96" />
              <rect x="122" y="42" width="116" height="42" rx="18" />
              <circle cx="180" cy="63" r="12" />
              <circle className="drone-eye" cx="180" cy="63" r="5" />
              <g className="propeller propeller-left-top"><ellipse cx="82" cy="32" rx="30" ry="8" /></g>
              <g className="propeller propeller-right-top"><ellipse cx="278" cy="32" rx="30" ry="8" /></g>
              <g className="propeller propeller-left-bottom"><ellipse cx="82" cy="96" rx="30" ry="8" /></g>
              <g className="propeller propeller-right-bottom"><ellipse cx="278" cy="96" rx="30" ry="8" /></g>
            </g>

            <g className="scan-beam" filter="url(#softGlow)">
              <path d="M180 84 L126 202 H234 Z" />
              <line x1="132" y1="168" x2="228" y2="168" />
              <line x1="144" y1="142" x2="216" y2="142" />
            </g>

            <g className="soy-plant">
              <path className="plant-stem" d="M180 220 C176 190 180 157 180 126" />
              <path className="plant-stem plant-branch-left" d="M178 166 C152 150 138 132 122 108" />
              <path className="plant-stem plant-branch-right" d="M182 166 C208 150 222 132 238 108" />
              <path className="plant-stem plant-branch-top-left" d="M179 140 C160 128 152 112 146 92" />
              <path className="plant-stem plant-branch-top-right" d="M181 140 C200 128 208 112 214 92" />

              <ellipse className="leaf leaf-left sick-leaf" cx="116" cy="104" rx="31" ry="18" transform="rotate(32 116 104)" />
              <ellipse className="leaf leaf-left healthy-leaf" cx="116" cy="104" rx="31" ry="18" transform="rotate(32 116 104)" />

              <ellipse className="leaf leaf-right sick-leaf" cx="244" cy="104" rx="31" ry="18" transform="rotate(-32 244 104)" />
              <ellipse className="leaf leaf-right healthy-leaf" cx="244" cy="104" rx="31" ry="18" transform="rotate(-32 244 104)" />

              <ellipse className="leaf leaf-mid-left sick-leaf" cx="140" cy="146" rx="28" ry="16" transform="rotate(20 140 146)" />
              <ellipse className="leaf leaf-mid-left healthy-leaf" cx="140" cy="146" rx="28" ry="16" transform="rotate(20 140 146)" />

              <ellipse className="leaf leaf-mid-right sick-leaf" cx="220" cy="146" rx="28" ry="16" transform="rotate(-20 220 146)" />
              <ellipse className="leaf leaf-mid-right healthy-leaf" cx="220" cy="146" rx="28" ry="16" transform="rotate(-20 220 146)" />

              <ellipse className="leaf leaf-top sick-leaf" cx="180" cy="92" rx="24" ry="15" />
              <ellipse className="leaf leaf-top healthy-leaf" cx="180" cy="92" rx="24" ry="15" />

              <g className="disease-spots">
                <circle cx="109" cy="101" r="4" />
                <circle cx="234" cy="101" r="5" />
                <circle cx="146" cy="148" r="4" />
                <circle cx="220" cy="142" r="3.5" />
                <circle cx="184" cy="91" r="3" />
              </g>
            </g>

            <g className="healing-particles">
              <circle cx="142" cy="120" r="3" />
              <circle cx="220" cy="116" r="2.8" />
              <circle cx="168" cy="156" r="2.5" />
              <circle cx="206" cy="160" r="2.5" />
              <circle cx="180" cy="112" r="3" />
            </g>
          </svg>
        </div>

        <div className="splash-status">
          <p>{message}</p>
          <div className="splash-progress">
            <div className="splash-progress-track">
              <div className="splash-progress-fill" style={{ width: `${roundedProgress}%` }} />
            </div>
            <span>{roundedProgress}%</span>
          </div>
        </div>
      </section>
    </main>
  )
}
