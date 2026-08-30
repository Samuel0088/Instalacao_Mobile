import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

const officialLinks = [
  {
    label: "Cadastrar drone na ANAC",
    agency: "ANAC",
    description: "Cadastro oficial da aeronave não tripulada",
    href: "https://www.gov.br/pt-br/servicos/cadastrar-drone-basico",
    icon: "app_registration"
  },
  {
    label: "Portal Drone UAS / DECEA",
    agency: "DECEA",
    description: "Orientações para acesso ao espaço aéreo",
    href: "https://www.decea.mil.br/drone/",
    icon: "flight_takeoff"
  },
  {
    label: "Acessar SARPAS",
    agency: "SARPAS",
    description: "Solicitação e acompanhamento de voos",
    href: "https://servicos.decea.mil.br/sarpas/",
    icon: "map"
  },
  {
    label: "Homologação Anatel",
    agency: "ANATEL",
    description: "Informações sobre homologação de equipamentos",
    href: "https://www.gov.br/anatel/pt-br/assuntos/noticias/saiba-como-funciona-o-processo-de-homologacao",
    icon: "settings_input_antenna"
  }
]

const checklist = [
  {
    title: "Cadastro ANAC",
    text: "No Brasil, drones usados como RPAS/VANT precisam seguir as regras da ANAC. Em geral, aeronaves acima de 250 g devem ser cadastradas e identificadas com o número de registro visível no equipamento. O cadastro ajuda a vincular a aeronave ao operador responsável.",
    icon: "badge"
  },
  {
    title: "Homologação",
    text: "O drone, o rádio controle e módulos de transmissão usam radiofrequência. Por isso, o equipamento deve ser homologado pela Anatel antes do uso, evitando interferências e problemas legais na operação.",
    icon: "verified"
  },
  {
    title: "Autorização",
    text: "Antes de decolar, o operador deve verificar o espaço aéreo pelo SARPAS/DECEA. Isso é essencial perto de aeroportos, helipontos, áreas militares, cidades, linhas de transmissão e locais com restrições temporárias.",
    icon: "approval"
  },
  {
    title: "Operação segura",
    text: "Mesmo em área rural, planeje altitude, rota, vento, bateria, linha visual, distância de pessoas e animais, obstáculos e ponto de pouso. Se aparecer aeronave tripulada, a prioridade é sempre dela.",
    icon: "health_and_safety"
  }
]

const quickTips = [
  { icon: "cloud", text: "Consulte o clima antes do voo" },
  { icon: "visibility", text: "Planeje a rota e o objetivo" },
  { icon: "groups", text: "Respeite a privacidade e propriedades" }
]

export default function LegislacaoDronesTab() {
  const [activeTopic, setActiveTopic] = useState(null)

  return (
    <section className="drone-law-container drone-law-dashboard">
      <div className="drone-law-hero">
        <div className="drone-law-hero-copy">
          <h1>Legislação</h1>
          <p>Regras e documentos para operar drones na agricultura</p>
        </div>
      </div>

      <a
        className="drone-law-featured"
        href={officialLinks[0].href}
        target="_blank"
        rel="noreferrer"
      >
        <span className="drone-law-featured-icon material-symbols-outlined" aria-hidden="true">verified_user</span>
        <span>
          <strong>Checklist antes do voo</strong>
          <small>Revise cadastro, homologação, autorização e segurança operacional.</small>
        </span>
        <span className="drone-law-featured-action">
          Abrir
          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </span>
      </a>

      <section className="drone-law-topics" aria-labelledby="drone-law-topics-title">
        <div className="drone-law-section-heading">
          <span className="material-symbols-outlined" aria-hidden="true">topic</span>
          <h2 id="drone-law-topics-title">Temas principais</h2>
        </div>

        <div className="drone-law-grid">
          {checklist.map((item, index) => (
            <button
              type="button"
              className={`drone-law-card ${activeTopic === index ? "active" : ""}`}
              key={item.title}
              aria-pressed={activeTopic === index}
              onClick={() => setActiveTopic(activeTopic === index ? null : index)}
            >
              <span className="drone-law-card-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {activeTopic !== null && (
            <motion.article
              className="drone-law-topic-detail"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{checklist[activeTopic].icon}</span>
              <div>
                <h3>{checklist[activeTopic].title}</h3>
                <p>{checklist[activeTopic].text}</p>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </section>

      <section className="drone-law-documents" aria-labelledby="drone-law-documents-title">
        <div className="drone-law-section-heading">
          <span className="material-symbols-outlined" aria-hidden="true">description</span>
          <h2 id="drone-law-documents-title">Documentos oficiais</h2>
          <a href={officialLinks[1].href} target="_blank" rel="noreferrer">
            Ver todos
            <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </a>
        </div>

        <div className="drone-law-links">
          {officialLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              <span className="drone-law-agency-label">{link.agency}</span>
              <span className="drone-law-link-copy">
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </a>
          ))}
        </div>
      </section>

      <section className="drone-law-agencies-section" aria-labelledby="drone-law-agencies-title">
        <div className="drone-law-section-heading">
          <span className="material-symbols-outlined" aria-hidden="true">lightbulb</span>
          <h2 id="drone-law-agencies-title">Dicas rápidas</h2>
        </div>

        <div className="drone-law-quick-tips">
          {quickTips.map((tip) => (
            <article key={tip.text}>
              <span className="material-symbols-outlined" aria-hidden="true">{tip.icon}</span>
              <p>{tip.text}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="drone-law-responsibility">
        <span className="material-symbols-outlined" aria-hidden="true">balance</span>
        <div>
          <strong>Dúvidas sobre legislação?</strong>
          <p>Consulte os órgãos responsáveis e confirme as regras vigentes.</p>
        </div>
        <a href={officialLinks[1].href} target="_blank" rel="noreferrer" aria-label="Abrir portal oficial do DECEA">
          Órgãos responsáveis
          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </a>
      </aside>

      <p className="drone-law-note">
        Este material é informativo. Antes de voar, confirme as regras vigentes nos canais oficiais,
        porque normas do espaço aéreo e procedimentos do SARPAS podem mudar.
      </p>
    </section>
  )
}
