import { useState, useRef, useEffect } from "react"
import CameraView from "./CameraView"
import ImagePreview from "./ImagePreview"
import AnalysisLoader from "./AnalysisLoader"
import DiagnosisResult from "./DiagnosisResult"
import AllHistory from "./AllHistory" // Importa o componente AllHistory
import "../../../../styles/App/Diagnostico.css"

const API_URL = "https://octaviorezendesilva-api-doencas-soja.hf.space/predict"

export default function DiagnosticoTab() {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  const [step, setStep] = useState("start")
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [showAllHistory, setShowAllHistory] = useState(false) // Estado para mostrar histórico completo

  // ==============================
  // CARREGAR HISTÓRICO
  // ==============================
  useEffect(() => {
    const saved = localStorage.getItem("diagnosticHistory")
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }, [])

  // ==============================
  // SALVAR HISTÓRICO
  // ==============================
  const saveToHistory = (data) => {
    const newItem = {
      id: Date.now(),
      disease: data?.doenca || data?.disease || "Desconhecido",
      confidence: Math.round(data?.confianca || data?.confidence || 0),
      date: new Date().toLocaleString("pt-BR")
    }

    const updated = [newItem, ...history].slice(0, 10)

    setHistory(updated)
    localStorage.setItem("diagnosticHistory", JSON.stringify(updated))
  }

  // ==============================
  // VER TODOS OS HISTÓRICOS
  // ==============================
  const viewAllHistory = () => {
    setShowAllHistory(true) // Mostra a página de histórico completo
  }

  // ==============================
  // VOLTAR DO HISTÓRICO
  // ==============================
  const backFromHistory = () => {
    setShowAllHistory(false) // Volta para a tela principal
    // Recarregar histórico atualizado
    const saved = localStorage.getItem("diagnosticHistory")
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }

  // ==============================
  // CAMERA
  // ==============================
  const startCamera = async () => {
    setStep("camera")

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (!stream) return
    stream.getTracks().forEach(track => track.stop())
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0)

    const data = canvas.toDataURL("image/jpeg")

    setImage(data)
    stopCamera()
    setStep("preview")
  }

  // ==============================
  // GALERIA
  // ==============================
  const openGallery = () => {
    fileInputRef.current.click()
  }

  const handleGalleryImage = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target.result)
      setStep("preview")
    }

    reader.readAsDataURL(file)
  }

  // ==============================
  // ANALISAR
  // ==============================
  const analyzeImage = async () => {
    setStep("analysis")

    try {
      const blob = await fetch(image).then(res => res.blob())

      const formData = new FormData()
      formData.append("file", blob, "image.jpg")

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      })

      if (!response.ok) throw new Error("Erro na API")

      const data = await response.json()

      setResult(data)
      saveToHistory(data)

      setStep("result")
    } catch (err) {
      console.error(err)

      const errorResult = {
        doenca: "Erro ao analisar imagem",
        confianca: 0
      }

      setResult(errorResult)
      saveToHistory(errorResult)

      setStep("result")
    }
  }

  // ==============================
  // RESET
  // ==============================
  const reset = () => {
    setImage(null)
    setResult(null)
    setStep("start")
  }

  // ==============================
  // TELAS
  // ==============================
  
  // Se estiver mostrando o histórico completo
  if (showAllHistory) {
    return <AllHistory onBack={backFromHistory} />
  }

  if (step === "camera") {
    return (
      <CameraView
        videoRef={videoRef}
        onCapture={capturePhoto}
        onCancel={reset}
      />
    )
  }

  if (step === "preview") {
    return (
      <ImagePreview
        image={image}
        onBack={reset}
        onAnalyze={analyzeImage}
      />
    )
  }

  if (step === "analysis") {
    return <AnalysisLoader />
  }

  if (step === "result") {
    return (
      <DiagnosisResult
        result={result}
        onRestart={reset}
      />
    )
  }

  // ==============================
  // TELA INICIAL
  // ==============================
  return (
    <div className="diagnostic-container">
      <div className="diagnostic-header">
        <div className="header-glow"></div>
        <h1 className="diagnostico-title">Diagnóstico</h1>
        <p>
          Identifique doenças em plantas com{" "}
          <span className="highlight">inteligência artificial</span>
        </p>
      </div>

      <div className="options-grid">
        <button className="option-card" onClick={startCamera}>
          <div className="card-glow"></div>
          <div className="option-icon-wrapper">
            <div className="option-icon">
              <span className="material-symbols-outlined">
                photo_camera
              </span>
            </div>
          </div>
          <h3>Tirar foto</h3>
          <p>Capture uma imagem agora</p>
          <div className="card-action">
            <span>Usar câmera</span>
            <span className="arrow">→</span>
          </div>
        </button>

        <button className="option-card" onClick={openGallery}>
          <div className="card-glow"></div>
          <div className="option-icon-wrapper">
            <div className="option-icon">
              <span className="material-symbols-outlined">
                photo_library
              </span>
            </div>
          </div>
          <h3>Galeria</h3>
          <p>Escolha uma imagem</p>
          <div className="card-action">
            <span>Selecionar</span>
            <span className="arrow">→</span>
          </div>
        </button>
      </div>

      {/* HISTÓRICO COM BOTÃO VER TODOS */}
      <div className="history-section">
        <div className="section-header">
          <div className="section-title">
            <span className="material-symbols-outlined">history</span>
            <h3>Histórico de Diagnósticos</h3>
          </div>
          <button className="section-link" onClick={viewAllHistory}>
            Ver todos
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">
                <span className="material-symbols-outlined">history</span>
              </div>
              <p className="empty-title">Nenhum diagnóstico ainda</p>
              <p className="empty-description">
                Realize seu primeiro diagnóstico tirando uma foto ou selecionando da galeria
              </p>
              <div className="empty-actions">
                <button className="empty-action" onClick={startCamera}>
                  <span className="material-symbols-outlined">photo_camera</span>
                  Tirar foto
                </button>
                <button className="empty-action secondary" onClick={openGallery}>
                  <span className="material-symbols-outlined">photo_library</span>
                  Galeria
                </button>
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-icon">
                  <span className="material-symbols-outlined">eco</span>
                </div>

                <div className="history-info">
                  <div className="history-name">{item.disease}</div>
                  <div className="history-date">{item.date}</div>
                </div>

                <div className="history-confidence">
                  <div className="confidence-value">
                    {item.confidence}%
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${item.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="tips-card">
        <div className="tips-header">
          <span className="material-symbols-outlined">
            tips_and_updates
          </span>
          <h4>Dica</h4>
        </div>
        <p>
          Fotografe a folha com boa iluminação e mantenha a câmera
          estável para melhor resultado
        </p>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden-input"
        onChange={handleGalleryImage}
      />
    </div>
  )
}