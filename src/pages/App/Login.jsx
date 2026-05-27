import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../../services/firebase"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth"
import "../../styles/App/Login.css"

/* ─────────────────────────────────────────
   UTILS
───────────────────────────────────────── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value) {
  return EMAIL_REGEX.test(value.trim())
}

function devLog(...args) {
  if (process.env.NODE_ENV === "development") console.log(...args)
}

/* ─────────────────────────────────────────
   FIREBASE ERROR MESSAGES
───────────────────────────────────────── */
const FIREBASE_ERROR_MESSAGES = {
  "auth/invalid-credential":
    "Email ou senha incorretos. Verifique e tente novamente. 🔒",
  "auth/user-not-found":
    "Usuário não encontrado! Você ainda não plantou sua conta. 🌱",
  "auth/wrong-password":
    "Senha incorreta! Verifique e tente novamente. 🔒",
  "auth/invalid-email":
    "Email inválido! Digite um email válido. 📧",
  "auth/too-many-requests":
    "Muitas tentativas! Aguarde um momento antes de tentar novamente. ⏳",
  "auth/network-request-failed":
    "Erro de conexão! Verifique sua internet. 🌐",
}

const FIREBASE_ERROR_DEFAULT = "Erro ao fazer login. Tente novamente mais tarde."

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

function FormInput({
  id, label, type, placeholder,
  value, onChange, onKeyDown,
  disabled, autoComplete, children,
}) {
  return (
    <div className="login__field">
      <label className="login__label" htmlFor={id}>{label}</label>
      <div className="login__input-wrapper">
        <input
          id={id}
          className="login__input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          autoComplete={autoComplete ?? "off"}
        />
        {children}
      </div>
    </div>
  )
}

function PrimaryButton({ onClick, disabled, loading, children }) {
  return (
    <button
      className={`login__btn-primary${loading ? " login__btn-primary--loading" : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="login__spinner" aria-hidden="true" />
          <span className="login__btn-loading-text">Entrando...</span>
        </>
      ) : children}
    </button>
  )
}

function SocialButton({ icon, label, onClick }) {
  return (
    <button className="login__btn-social" onClick={onClick} type="button">
      <span className="login__btn-social-icon" aria-hidden="true">{icon}</span>
      <span className="login__btn-social-label">{label}</span>
    </button>
  )
}

function AlertMessage({ type, text }) {
  if (!text) return null
  return (
    <div
      className={`login__alert login__alert--${type}`}
      role="alert"
      aria-live="polite"
    >
      {text}
    </div>
  )
}

/* ─────────────────────────────────────────
   ICON COMPONENTS
───────────────────────────────────────── */

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
    <path d="M6.3 14.7l7 5.1C15.2 16.4 19.3 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" fill="#FF3D00"/>
    <path d="M24 46c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.7 36.8 26.9 38 24 38c-5.8 0-10.7-3.9-12.4-9.2l-7 5.4C7.9 42.1 15.4 46 24 46z" fill="#4CAF50"/>
    <path d="M44.5 20H24v8.5h11.8c-1 3-3.2 5.4-6.1 7l6.6 5.6C41.4 37.1 45 31 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
  </svg>
)

const MicrosoftIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
  </svg>
)

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

/* ─────────────────────────────────────────
   MAIN LOGIN COMPONENT
───────────────────────────────────────── */
export default function Login({ setAppLoading }) {
  const navigate = useNavigate()

  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [loading, setLoading]           = useState(false)
  const [rememberMe, setRememberMe]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [alert, setAlert]               = useState({ type: "", text: "" })

  const navTimerRef = useRef(null)

  /* ── useEffect: verificar sessão + email salvo ── */
  useEffect(() => {
    const user = auth.currentUser

    if (user) {
      devLog("Usuário já está logado:", user.email)
      setAppLoading(true)
      navTimerRef.current = setTimeout(() => navigate("/home"), 2000)
      return
    }

    const remembered = localStorage.getItem("rememberedEmail")
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }

    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [navigate, setAppLoading])

  /* ── Helpers de alerta ── */
  const showAlertMsg  = useCallback((type, text) => setAlert({ type, text }), [])
  const clearAlertMsg = useCallback(() => setAlert({ type: "", text: "" }), [])

  /* ── Handlers ── */
  const handleEmailChange     = useCallback((e) => setEmail(e.target.value), [])
  const handlePasswordChange  = useCallback((e) => setPassword(e.target.value), [])
  const handleRememberMeChange = useCallback((e) => setRememberMe(e.target.checked), [])
  const handleTogglePassword  = useCallback(() => setShowPassword((v) => !v), [])

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      showAlertMsg("error", "Preencha todos os campos para entrar na fazenda! 🌾")
      return
    }

    if (!isValidEmail(email)) {
      showAlertMsg("error", "Email inválido! Digite um email no formato correto. 📧")
      return
    }

    setLoading(true)
    clearAlertMsg()

    try {
      await signInWithEmailAndPassword(auth, email, password)

      rememberMe
        ? localStorage.setItem("rememberedEmail", email)
        : localStorage.removeItem("rememberedEmail")

      showAlertMsg("success", "Bem-vindo de volta, produtor! 🚁")
      setAppLoading(true)

      navTimerRef.current = setTimeout(() => navigate("/home"), 2000)
    } catch (error) {
      const message = FIREBASE_ERROR_MESSAGES[error.code] ?? FIREBASE_ERROR_DEFAULT
      showAlertMsg("error", message)
    } finally {
      setLoading(false)
    }
  }, [email, password, rememberMe, navigate, setAppLoading, showAlertMsg, clearAlertMsg])

  const handleKeyDown = useCallback(
    (e) => { if (e.key === "Enter") handleLogin() },
    [handleLogin]
  )

  const googleProvider = new GoogleAuthProvider()
  const outlookProvider = new OAuthProvider("microsoft.com")

  const handleGoogleLogin = async () => {
  try {
    setLoading(true)

    await signInWithPopup(auth, googleProvider)

    showAlertMsg("success", "Login com Google realizado com sucesso! 🚀")

    setAppLoading(true)

    navTimerRef.current = setTimeout(() => {
      navigate("/home")
    }, 1500)

  } catch (error) {
    console.error(error)
    showAlertMsg("error", "Erro ao entrar com Google.")
  } finally {
    setLoading(false)
  }
}

const handleOutlookLogin = async () => {
  try {
    setLoading(true)

    await signInWithPopup(auth, outlookProvider)

    showAlertMsg("success", "Login com Outlook realizado com sucesso! 📧")

    setAppLoading(true)

    navTimerRef.current = setTimeout(() => {
      navigate("/home")
    }, 1500)

  } catch (error) {
    console.error(error)
    showAlertMsg("error", "Erro ao entrar com Outlook.")
  } finally {
    setLoading(false)
  }
}

  /* ── RENDER ── */
  return (
    <div className="login-page">

      {/* ── HERO MOBILE ── */}
      <div className="login-hero" role="banner">
        <div className="login-hero__overlay" aria-hidden="true" />

        <div className="login-hero__content">
          <div className="login-logo" aria-label="Zenith">
            <img className="logo-img" src="assets/image/Logo-redonda.png" alt="" />
          </div>
          <p className="login-hero__subtitle">Acesse a sua propriedade rural</p>
          <h1 className="login-hero__title">Login</h1>
        </div>
      </div>

      {/* ── CARD — FORMULÁRIO ── */}
      <main className="login-card">

        <FormInput
          id="login-email"
          label="Email"
          type="email"
          placeholder="seuemail@gmail.com"
          value={email}
          onChange={handleEmailChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="email"
        />

        <FormInput
          id="login-password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          placeholder="Sua senha"
          value={password}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="current-password"
        >
          <button
            className="login__eye-btn"
            type="button"
            onClick={handleTogglePassword}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOpen /> : <EyeClosed />}
          </button>
        </FormInput>

        {/* Remember + Forgot */}
        <div className="login-extras">
          <label className="login-remember" htmlFor="login-remember-checkbox">
            <input
              id="login-remember-checkbox"
              type="checkbox"
              className="login-remember__input"
              checked={rememberMe}
              onChange={handleRememberMeChange}
            />
            <span className="login-remember__box" aria-hidden="true" />
            <span className="login-remember__text">Lembrar de mim</span>
          </label>

          <a href="/forgot-password" className="login-forgot">
            Esqueceu a senha?
          </a>
        </div>

        <AlertMessage type={alert.type} text={alert.text} />

        <PrimaryButton
          onClick={handleLogin}
          disabled={loading}
          loading={loading}
        >
          Entrar na conta
        </PrimaryButton>

        {/* Divider */}
        <div className="login-divider" aria-hidden="true">
          <span className="login-divider__line" />
          <span className="login-divider__text">Ou</span>
          <span className="login-divider__line" />
        </div>

        {/* Register */}
        <p className="login-register">
          Primeira vez aqui?{" "}
          <a href="/register" className="login-register__link">
            Criar conta
          </a>
        </p>

        {/* Social */}
        <div className="login-social">
          <SocialButton
            icon={<GoogleIcon />}
            label="Entre com Google"
            onClick={handleGoogleLogin}
          />
          <SocialButton
            icon={<MicrosoftIcon />}
            label="Entre com Outlook"
            onClick={handleOutlookLogin}
          />
        </div>

      </main>

      {/* Círculos decorativos */}
      <div className="login-deco-circle login-deco-circle--br" aria-hidden="true" />
      <div className="login-deco-circle login-deco-circle--bl" aria-hidden="true" />
    </div>
  )
}