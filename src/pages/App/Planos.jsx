import { useNavigate } from "react-router-dom"
import MenuBar from "../../components/App/Global/MenuBar"
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
    icon: "nest_eco",
    highlighted: false
  },
  {
    id: "pro",
    name: "Pro",
    tier: "Produtor",
    price: "R$ 59,90",
    period: "/mês",
    description: "Para quem quer diagnóstico, plantio e estimativas financeiras.",
    features: ["Diagnóstico + plantio", "Estimativa de lucro", "Cotação dinâmica da soja"],
    icon: "monitoring",
    highlighted: true
  },
  {
    id: "safra",
    name: "Safra",
    tier: "Operação",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para produtores que precisam gerenciar a operação completa.",
    features: ["Tudo do Pro", "Atividades e estoque", "Suporte prioritário"],
    icon: "hub",
    highlighted: false
  }
]

export default function Planos() {
  const navigate = useNavigate()

  return (
    <div className="plans-page">
      <header className="plans-hero">
        <div className="plans-topbar">
          <button className="plans-back-btn" onClick={() => navigate("/home")}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="plans-kicker">Assinatura</span>
        </div>

        <div className="plans-hero-content">
          <div className="plans-hero-eyebrow">
            <span className="material-symbols-outlined">eco</span>
            <span>Safra inteligente</span>
          </div>

          <h1>Planos</h1>
          <p>Ferramentas para monitorar a lavoura, prever riscos e acompanhar a safra com mais precisão.</p>

          <div className="plans-toggle-row">
            <div className="plans-toggle" aria-label="Ciclo de cobrança">
              <button className="active">Mensal</button>
              <button>Anual</button>
            </div>
            <span className="plans-savings-badge">
              <span className="material-symbols-outlined">local_offer</span>
              Economize no anual
            </span>
          </div>
        </div>

        <div className="plans-hero-field" aria-hidden="true">
          <span className="material-symbols-outlined">psychiatry</span>
        </div>
      </header>

      <main className="plans-list">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`plan-card${plan.highlighted ? " highlighted" : ""}`}
          >
            {plan.highlighted && <span className="plan-badge">Mais escolhido</span>}

            <div className="plan-card-header">
              <div className="plan-title-row">
                <span className="plan-icon">
                  <span className="material-symbols-outlined">{plan.icon}</span>
                </span>
                <div className="plan-name-group">
                  <h2>{plan.name}</h2>
                  <span className="plan-tier">{plan.tier}</span>
                </div>
              </div>
              <div className="plan-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
            </div>

            <div className="plan-divider"></div>

            <p>{plan.description}</p>

            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="plan-feat-icon">
                    <span className="material-symbols-outlined">check</span>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="plan-action-btn">
              Escolher plano
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </article>
        ))}
      </main>

      <MenuBar />
    </div>
  )
}
