// Intro.jsx — Premium · AgroVoo
import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import "../../styles/App/Intro.css"
import Logo from "/public/assets/image/Logo.png"

/* ── Partículas flutuantes ── */
const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const s = ((i * 7919 + 1234) % 1000) / 1000
  const x = ((i * 6271 + 4567) % 1000) / 1000
  const y = ((i * 3491 + 8901) % 1000) / 1000
  const d = ((i * 2333 + 2345) % 1000) / 1000
  return {
    width:           `${s * 4 + 2}px`,
    height:          `${s * 4 + 2}px`,
    left:            `${x * 100}%`,
    top:             `${y * 100}%`,
    animationDuration:`${d * 18 + 12}s`,
    animationDelay:  `${s * 10}s`,
    opacity:         s * 0.35 + 0.12,
  }
})

/* ── Stats data ── */
const STATS = [
  { value: "98%",   label: "de precisão na detecção",    accent: false },
  { value: "24/7",  label: "de monitoramento contínuo",  accent: true  },
  { value: "−40%",  label: "de perdas evitadas",         accent: false },
]

export default function Intro() {
  const navigate  = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const rootRef   = useRef(null)

  /* stagger trigger */
  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /* parallax leve no hero */
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onMove = (e) => {
      const bx = (e.clientX / window.innerWidth  - 0.5) * 12
      const by = (e.clientY / window.innerHeight - 0.5) * 8
      el.style.setProperty("--px", `${bx}px`)
      el.style.setProperty("--py", `${by}px`)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <div className={`iv-root${loaded ? " iv-loaded" : ""}`} ref={rootRef}>

      {/* ── Camadas de fundo ── */}
      <div className="iv-bg" aria-hidden="true">
        <div className="iv-bg__noise" />
        <div className="iv-bg__vignette" />
        <div className="iv-bg__blob iv-bg__blob--a" />
        <div className="iv-bg__blob iv-bg__blob--b" />
        <div className="iv-bg__blob iv-bg__blob--c" />
        <div className="iv-bg__grid" />
      </div>

      {/* ── Partículas ── */}
      <div className="iv-particles" aria-hidden="true">
        {PARTICLES.map((s, i) => (
          <span key={i} className="iv-ptcl" style={s} />
        ))}
      </div>

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <nav className="iv-nav iv-anim iv-anim--0">
        <button className="iv-nav__btn iv-nav__btn--ghost"
          onClick={() => navigate("/login")}>
          LOGIN
        </button>
        <button className="iv-nav__btn iv-nav__btn--primary"
          onClick={() => navigate("/register")}>
          CADASTRO
        </button>
      </nav>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section className="iv-hero">
        {/* Blob orgânico canto direito */}
        <div className="iv-hero__blob" aria-hidden="true" />

        <div className="iv-hero__content iv-anim iv-anim--1">
          {/* Badge */}
          <div className="iv-badge">
            <span className="iv-badge__pulse" />
            <span className="iv-badge__text">TECNOLOGIA AGRO 4.0</span>
          </div>

          {/* Título */}
          <h1 className="iv-title">
            <span className="iv-title__a">MONITORAMENTO</span>
            <span className="iv-title__b">INTELIGENTE</span>
          </h1>

          {/* Subtítulo */}
          <p className="iv-hero__sub">
            Drones autônomos com IA para proteção inteligente das suas plantações.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════
          LOGO CARD
      ══════════════════════════════ */}
      <div className="iv-logo-card iv-anim iv-anim--2">
        {/* Brilho interno */}
        <div className="iv-logo-card__sheen" aria-hidden="true" />
        <div className="iv-logo-card__corner" aria-hidden="true" />

        <div className="iv-logo-card__body">
          <div className="iv-logo-card__frame">
            <img src={Logo} alt="Zenith" className="iv-logo-card__img" />
            <div className="iv-logo-card__ring" />
          </div>

          <div className="iv-logo-card__info">
            <p className="iv-logo-card__name">Zenith</p>
            <p className="iv-logo-card__tag">Parceiro certificado</p>
          </div>
        </div>

        {/* Decoração geométrica */}
        <div className="iv-logo-card__deco" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>

      {/* ══════════════════════════════
          STATS
      ══════════════════════════════ */}
      <section className="iv-stats iv-anim iv-anim--3">
        <div className="iv-stats__wrap">
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`iv-stat iv-stat--${i + 1}${s.accent ? " iv-stat--accent" : ""}`}
            >
              <span className="iv-stat__pill">
                <strong className={`iv-stat__val${s.accent ? " iv-stat__val--green" : ""}`}>
                  {s.value}
                </strong>
                <span className="iv-stat__lbl">{s.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          CTA
      ══════════════════════════════ */}
      <div className="iv-cta iv-anim iv-anim--4">
        <button className="iv-cta__btn iv-cta__btn--green"
          onClick={() => navigate("/login")}>
          <span>Acessar plataforma</span>
          <span className="iv-cta__arrow">→</span>
          <span className="iv-cta__shine" aria-hidden="true" />
        </button>
        <button className="iv-cta__btn iv-cta__btn--dark"
          onClick={() => navigate("/register")}>
          <span>Começar agora</span>
          <span className="iv-cta__arrow">🌿</span>
        </button>
      </div>

      {/* ── Rodapé link ── */}
      <footer className="iv-footer iv-anim iv-anim--5">
        <p>Já é produtor?{" "}
          <a href="/login" className="iv-footer__link">
            Entrar na plataforma <span>→</span>
          </a>
        </p>
      </footer>

    </div>
  )
}