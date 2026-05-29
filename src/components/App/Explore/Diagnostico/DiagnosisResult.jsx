export default function DiagnosisResult({ result, onRestart }) {

  // 🔍 Descobrir doença automaticamente se não vier da API
  const getMainDisease = () => {
    if (result?.doenca) return result.doenca

    if (result?.probabilidades) {
      const sorted = Object.entries(result.probabilidades)
        .sort((a, b) => b[1] - a[1])

      return sorted[0]?.[0] || "Não identificado"
    }

    return "Não identificado"
  }

  const disease = getMainDisease()

  // 🔢 Confiança principal
  const getConfidence = () => {
    if (result?.confianca !== undefined) return result.confianca

    if (result?.probabilidades && disease !== "Não identificado") {
      return result.probabilidades[disease] || 0
    }

    return 0
  }

  const confidence = getConfidence()

  // 📊 Percentual tratado corretamente (sempre número)
  const percent =
    confidence > 1
      ? Number(confidence.toFixed(2))
      : Number((confidence * 100).toFixed(2))

  return (
    <div className="result-container">
      <div className="result-card">
        <h2>Resultado do Diagnóstico</h2>

        <div className="result-disease">
          <span className="material-symbols-outlined">eco</span>
          {disease.replaceAll("_", " ")}
        </div>

        <div className="result-confidence">
          <div className="confidence-circle">
            <span className="confidence-percent">{percent}%</span>
            <span className="confidence-label">Confiança</span>
          </div>

          <div className="confidence-bar-large">
            <div
              className="confidence-fill-large"
              style={{ width: `${Math.min(100, percent)}%` }}
            ></div>
          </div>
        </div>

        {result?.probabilidades && (
          <div className="probabilities">
            <h3>Probabilidades</h3>

            {Object.entries(result.probabilidades)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => {
                const percentValue =
                  value > 1
                    ? Number(value.toFixed(1))
                    : Number((value * 100).toFixed(1))

                return (
                  <div key={name} className="probability-item">
                    <div className="probability-name">
                      <span className="material-symbols-outlined">grass</span>
                      <span>{name.replaceAll("_", " ")}</span>
                    </div>

                    <div className="probability-bar-container">
                      <div className="probability-bar">
                        <div
                          className="probability-fill"
                          style={{ width: `${Math.min(100, percentValue)}%` }}
                        ></div>
                      </div>

                      <span className="probability-value">
                        {percentValue}%
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        <button className="restart-btn" onClick={onRestart}>
          <span className="material-symbols-outlined">refresh</span>
          Novo Diagnóstico
        </button>
      </div>
    </div>
  )
}