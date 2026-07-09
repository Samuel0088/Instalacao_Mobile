import { useNavigate } from "react-router-dom"
import "../../styles/App/Planos.css"

const plans = [
  {
    id: "essencial",
    name: "Essencial",
    tier: "Entrada",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para começar a acompanhar sua propriedade com dados simples.",
    features: ["Clima e mapa", "Diário da plantação", "Cadastro de uma fazenda"],
    icon: "eco",
    highlighted: false
  },
  {
    id: "pro",
    name: "Pro",
    tier: "Produtor",
    price: "R$ 59,90",
    period: "/mês",
    description: "Para quem quer diagnóstico, plantio e acompanhamento técnico da lavoura.",
    features: ["Diagnóstico + plantio", "Monitoramento de soja", "Cotação dinâmica da soja", "Suporte prioritário"],
    icon: "grass",
    highlighted: true
  },
  {
    id: "safra",
    name: "Safra",
    tier: "Operação",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para produtores que precisam gerenciar a operação completa.",
    features: ["Tudo do Pro", "Atividades e estoque", "Múltiplas fazendas", "API integrada"],
    icon: "agriculture",
    highlighted: false
  }
]

export default function Planos() {
  const navigate = useNavigate()
  const goHome = () => {
    sessionStorage.setItem("zenithShowWhiteLoaderOnce", "true")
    navigate("/home")
  }

  return (
    <div className="plans-page" data-system-bar-color="#07140d">
      <div className="plans-bg-pattern"></div>
      
      <header className="plans-hero">
        <div className="plans-topbar">
          <button className="plans-back-btn" onClick={goHome}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="plans-kicker">Planos e Assinatura</span>
        </div>

        <div className="plans-hero-content">
          <div className="plans-hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z" fill="currentColor"/>
            </svg>
            <span>Escolha o plano ideal</span>
          </div>

          <h1>
            Invista na<br />
            <span className="plans-gradient-text">sua lavoura</span>
          </h1>
          
          <p>Tecnologia de ponta para monitorar, prever e otimizar sua produção agrícola com inteligência de dados.</p>

          <div className="plans-toggle-container">
            <div className="plans-toggle">
              <button className="active">Mensal</button>
              <button>Anual <span className="plans-save-tag">-20%</span></button>
            </div>
            <div className="plans-guarantee">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </header>

      <main className="plans-list" data-system-bar-color="#f7f5f0">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.highlighted ? "highlighted" : ""}`}
          >
            {plan.highlighted && (
              <div className="plan-recommended">
                <span>⭐ Recomendado</span>
              </div>
            )}
            
            <div className="plan-card-content">
              <div className="plan-card-header">
                <div className="plan-icon-wrapper">
                  <span className="material-symbols-outlined">{plan.icon}</span>
                </div>
                <div className="plan-info">
                  <h3>{plan.name}</h3>
                  <span className="plan-tier">{plan.tier}</span>
                </div>
                <div className="plan-price">
                  <span className="plan-price-amount">{plan.price}</span>
                  <span className="plan-price-period">{plan.period}</span>
                </div>
              </div>

              <p className="plan-description">{plan.description}</p>

              <div className="plan-features">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="plan-feature">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button className="plan-select-btn">
                {plan.highlighted ? "Começar agora" : "Selecionar plano"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </main>

      <div className="plans-faq">
        <button className="plans-faq-btn" onClick={() => navigate("/contato")}>
          💬 Dúvidas? Fale com nosso time comercial
        </button>
      </div>
    </div>
  )
}
