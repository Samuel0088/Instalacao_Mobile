// components/Home/WelcomeSection.jsx
export default function WelcomeSection({ userName, hasFarm, farmName, onRegister }) {
  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <div className="welcome-badge">
          <span className="material-symbols-outlined">verified</span>
          <span>Agricultura de Precisão</span>
        </div>
        <h1 className="welcome-title">
          Olá, <span className="gradient-text">{userName || "Agricultor"}</span>
        </h1>
        <p className="welcome-subtitle">
          {hasFarm 
            ? `Sistema online • ${farmName}`
            : "Comece cadastrando sua fazenda para iniciar o monitoramento"}
        </p>
      </div>
      
      {!hasFarm && (
        <button className="register-farm-btn" onClick={onRegister}>
          <span className="material-symbols-outlined">add</span>
          <span>Cadastrar Fazenda</span>
          <div className="btn-glow"></div>
        </button>
      )}
    </section>
  )
}