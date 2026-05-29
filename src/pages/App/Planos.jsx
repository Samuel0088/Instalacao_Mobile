import { useNavigate } from "react-router-dom"
import MenuBar from "../../components/App/Global/MenuBar"
import "../../styles/App/Planos.css"

const plans = [
  {
    id: "essencial",
    name: "Essencial",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para começar a acompanhar sua propriedade com dados simples.",
    features: ["Clima e mapa", "Diário da plantação", "Cadastro de uma fazenda"],
    highlighted: false
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 59,90",
    period: "/mês",
    description: "Para quem quer diagnóstico, plantio e estimativas financeiras.",
    features: ["Diagnóstico + plantio", "Estimativa de lucro", "Cotação dinâmica da soja"],
    highlighted: true
  },
  {
    id: "safra",
    name: "Safra",
    price: "R$ 99,90",
    period: "/mês",
    description: "Para produtores que precisam gerenciar a operação completa.",
    features: ["Tudo do Pro", "Atividades e estoque", "Suporte prioritário"],
    highlighted: false
  }
]

export default function Planos() {
  const navigate = useNavigate()

  return (
    <div className="plans-page">
      <header className="plans-header">
        <button className="plans-back-btn" onClick={() => navigate("/home")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <span className="plans-kicker">Assinatura</span>
          <h1>Planos</h1>
          <p>Escolha o pacote que combina com a sua rotina no campo.</p>
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
              <h2>{plan.name}</h2>
              <div className="plan-price">
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
            </div>

            <p>{plan.description}</p>

            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="material-symbols-outlined">check_circle</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="plan-action-btn">
              Escolher plano
            </button>
          </article>
        ))}
      </main>

      <MenuBar />
    </div>
  )
}
