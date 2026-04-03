export default function DiagnosisResult({ result, onRestart }) {

  const disease = result?.doenca || "Não identificado"
  const confidence = result?.confianca || 0

  // Se o valor já estiver entre 0-100, não multiplica
  // Se o valor for maior que 1, provavelmente já é porcentagem
  const percent = confidence > 1 ? confidence.toFixed(2) : (confidence * 100).toFixed(2)

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
                // Ajustar o valor da porcentagem
                const percentValue = value > 1 ? value : value * 100
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
                      <span className="probability-value">{percentValue.toFixed(1)}%</span>
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