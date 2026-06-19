import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../../services/firebase"

import "../../styles/App/ForgotPassword.css"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIREBASE_ERROR_MESSAGES = {
  "auth/user-not-found":
    "Nenhuma conta encontrada com este email. 🌱",

  "auth/invalid-email":
    "Digite um email válido. 📧",

  "auth/too-many-requests":
    "Muitas tentativas. Aguarde alguns minutos. ⏳",

  "auth/network-request-failed":
    "Erro de conexão. Verifique sua internet. 🌐",
}

const DEFAULT_ERROR =
  "Não foi possível enviar o email de recuperação."

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({
    type: "",
    text: "",
  })

  const showAlert = useCallback((type, text) => {
    setAlert({ type, text })
  }, [])

  const validateEmail = () => {
    if (!email.trim()) {
      showAlert(
        "error",
        "Digite o email cadastrado para recuperar sua senha."
      )
      return false
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      showAlert(
        "error",
        "Digite um email válido."
      )
      return false
    }

    return true
  }

  const handleResetPassword = async () => {
    if (!validateEmail()) return

    setLoading(true)
    setAlert({ type: "", text: "" })

    try {
      await sendPasswordResetEmail(auth, email.trim())

      showAlert(
        "success",
        "Email enviado com sucesso! Verifique sua caixa de entrada. 📨"
      )

      setTimeout(() => {
        navigate("/login")
      }, 2500)

    } catch (error) {
      const message =
        FIREBASE_ERROR_MESSAGES[error.code] ?? DEFAULT_ERROR

      showAlert("error", message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleResetPassword()
    }
  }

  return (
    <div className="forgot-page">

      {/* HERO */}
      <div className="forgot-hero">
        <div className="forgot-hero__overlay" />

        <div className="forgot-hero__content">
          <div className="forgot-logo">
            <img
              src="assets/image/Logo-redonda.png"
              alt="Zenith Agro"
              className="forgot-logo__img"
            />
          </div>

          <p className="forgot-hero__subtitle">
            Recuperação de acesso
          </p>

          <h1 className="forgot-hero__title">
            Esqueceu a senha?
          </h1>
        </div>
      </div>

      {/* CARD */}
      <main className="forgot-card">

        <div className="forgot-header">
          <h2 className="forgot-header__title">
            Recuperar senha
          </h2>

          <p className="forgot-header__text">
            Informe o email da sua conta e enviaremos
            um link para redefinir sua senha.
          </p>
        </div>

        <div className="forgot__field">
          <label
            htmlFor="forgot-email"
            className="forgot__label"
          >
            Email
          </label>

          <input
            id="forgot-email"
            type="email"
            className="forgot__input"
            placeholder="seuemail@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        {alert.text && (
          <div
            className={`forgot__alert forgot__alert--${alert.type}`}
          >
            {alert.text}
          </div>
        )}

        <button
          className={`forgot__btn-primary ${
            loading ? "forgot__btn-primary--loading" : ""
          }`}
          onClick={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="forgot__spinner" />
              Enviando...
            </>
          ) : (
            "Enviar recuperação"
          )}
        </button>

        <button
          className="forgot__btn-secondary"
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Voltar para login
        </button>

      </main>

    </div>
  )
}