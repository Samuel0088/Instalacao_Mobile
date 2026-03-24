import { useState, useRef, useEffect } from "react"
import CameraView from "./CameraView"
import ImagePreview from "./ImagePreview"
import AnalysisLoader from "./AnalysisLoader"
import DiagnosisResult from "./DiagnosisResult"
import AllHistory from "./AllHistory"
import "../../../../styles/App/Diagnostico.css"

const API_URL = "https://octaviorezendesilva-api-doencas-soja.hf.space/predict"

export default function DiagnosticoTab() {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  const [step, setStep] = useState("start")
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [showAllHistory, setShowAllHistory] = useState(false)

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
    // Extrair o nome da doença e confiança
    let diseaseName = "Desconhecido"
    let confidence = 0
    
    console.log("=== SALVANDO NO HISTÓRICO ===")
    console.log("Dados recebidos:", data)
    
    // Verificar diferentes formatos de resposta da API
    if (data) {
      // Formato 1: { doenca: "Nome", confianca: 95 }
      if (data.doenca) {
        diseaseName = data.doenca
        confidence = data.confianca
        console.log("Formato 1 detectado - doenca:", diseaseName, "confianca:", confidence)
      }
      // Formato 2: { disease: "Nome", confidence: 95 }
      else if (data.disease) {
        diseaseName = data.disease
        confidence = data.confidence
        console.log("Formato 2 detectado - disease:", diseaseName, "confidence:", confidence)
      }
      // Formato 3: { classe: "Nome", probabilidade: 0.95 }
      else if (data.classe) {
        diseaseName = data.classe
        confidence = data.probabilidade * 100
        console.log("Formato 3 detectado - classe:", diseaseName, "probabilidade:", data.probabilidade)
      }
      // Formato 4: { label: "Nome", score: 0.95 }
      else if (data.label) {
        diseaseName = data.label
        confidence = data.score * 100
        console.log("Formato 4 detectado - label:", diseaseName, "score:", data.score)
      }
      // Formato 5: { prediction: "Nome", probability: 0.95 }
      else if (data.prediction) {
        diseaseName = data.prediction
        confidence = data.probability * 100
        console.log("Formato 5 detectado - prediction:", diseaseName, "probability:", data.probability)
      }
      // Formato 6: { resultado: "Nome", confianca: 95 }
      else if (data.resultado) {
        diseaseName = data.resultado
        confidence = data.confianca
        console.log("Formato 6 detectado - resultado:", diseaseName, "confianca:", data.confianca)
      }
      // Formato 7: Array de predições
      else if (Array.isArray(data) && data.length > 0) {
        const topPrediction = data[0]
        diseaseName = topPrediction.nome || topPrediction.classe || topPrediction.label || "Desconhecido"
        confidence = (topPrediction.confianca || topPrediction.probabilidade || topPrediction.score || 0) * 100
        console.log("Formato 7 detectado - Array, top:", diseaseName, "confidence:", confidence)
      }
      // Formato 8: { predictions: [...] }
      else if (data.predictions && data.predictions.length > 0) {
        const topPrediction = data.predictions[0]
        diseaseName = topPrediction.nome || topPrediction.classe || "Desconhecido"
        confidence = (topPrediction.confianca || topPrediction.probabilidade || 0) * 100
        console.log("Formato 8 detectado - predictions, top:", diseaseName, "confidence:", confidence)
      }
      // Formato 9: { nome: "Nome", confianca: 95 } (direto)
      else if (data.nome) {
        diseaseName = data.nome
        confidence = data.confianca
        console.log("Formato 9 detectado - nome:", diseaseName, "confianca:", confidence)
      }
      // Se não encontrou nenhum formato conhecido, mostra o objeto completo
      else {
        console.warn("Formato não reconhecido! Objeto completo:", data)
        diseaseName = "Formato não reconhecido"
        confidence = 0
      }
    }
    
    // Garantir que a confiança seja um número entre 0-100
    if (confidence > 1 && confidence <= 100) {
      confidence = Math.round(confidence)
    } else if (confidence <= 1) {
      confidence = Math.round(confidence * 100)
    } else {
      confidence = Math.min(100, Math.max(0, Math.round(confidence)))
    }
    
    const newItem = {
      id: Date.now(),
      disease: diseaseName,
      confidence: confidence,
      date: new Date().toLocaleString("pt-BR")
    }
    
    console.log("Item salvo no histórico:", newItem)
    console.log("===============================")

    const updated = [newItem, ...history].slice(0, 10)
    setHistory(updated)
    localStorage.setItem("diagnosticHistory", JSON.stringify(updated))
  }

  // ==============================
  // VER TODOS OS HISTÓRICOS
  // ==============================
  const viewAllHistory = () => {
    setShowAllHistory(true)
  }

  // ==============================
  // VOLTAR DO HISTÓRICO
  // ==============================
  const backFromHistory = () => {
    setShowAllHistory(false)
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err)
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
  // ANALISAR IMAGEM
  // ==============================
  const analyzeImage = async () => {
    setStep("analysis")

    try {
      console.log("=== INICIANDO ANÁLISE ===")
      console.log("Imagem base64 (primeiros 100 caracteres):", image.substring(0, 100))
      
      // Converter base64 para blob
      const blob = await fetch(image).then(res => res.blob())
      console.log("Blob criado, tamanho:", blob.size, "bytes")
      
      const formData = new FormData()
      formData.append("file", blob, "image.jpg")
      
      console.log("Enviando requisição para API:", API_URL)
      
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      })
      
      console.log("Status da resposta:", response.status)
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }
      
      const data = await response.json()
      
      // LOG DETALHADO DA RESPOSTA DA API
      console.log("=== RESPOSTA DA API ===")
      console.log("Dados completos:", JSON.stringify(data, null, 2))
      console.log("Tipo do dado:", typeof data)
      console.log("É array?", Array.isArray(data))
      console.log("Chaves do objeto:", data ? Object.keys(data) : "dados vazios")
      
      // Verificar campos comuns
      if (data) {
        console.log("Campo 'doenca':", data.doenca)
        console.log("Campo 'confianca':", data.confianca)
        console.log("Campo 'disease':", data.disease)
        console.log("Campo 'confidence':", data.confidence)
        console.log("Campo 'probabilidades':", data.probabilidades)
        console.log("Campo 'predictions':", data.predictions)
      }
      console.log("=======================")
      
      setResult(data)
      saveToHistory(data)
      
      setStep("result")
    } catch (err) {
      console.error("=== ERRO NA ANÁLISE ===")
      console.error("Erro:", err)
      console.error("Mensagem:", err.message)
      console.error("Stack:", err.stack)
      console.error("======================")

      const errorResult = {
        doenca: "Erro ao analisar imagem",
        confianca: 0,
        error: err.message
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
                      style={{ width: `${Math.min(100, item.confidence)}%` }}
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