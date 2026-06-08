const officialLinks = [
  {
    label: "Cadastrar drone na ANAC",
    href: "https://www.gov.br/pt-br/servicos/cadastrar-drone-basico",
    icon: "app_registration"
  },
  {
    label: "Portal Drone UAS / DECEA",
    href: "https://www.decea.mil.br/drone/",
    icon: "flight_takeoff"
  },
  {
    label: "Acessar SARPAS",
    href: "https://servicos.decea.mil.br/sarpas/",
    icon: "map"
  },
  {
    label: "Homologação Anatel",
    href: "https://www.gov.br/anatel/pt-br/assuntos/noticias/saiba-como-funciona-o-processo-de-homologacao",
    icon: "settings_input_antenna"
  }
]

const checklist = [
  {
    title: "Drone regularizado",
    text: "Equipamentos com mais de 250 g devem ser cadastrados na ANAC. O número de cadastro precisa identificar a aeronave.",
    icon: "badge"
  },
  {
    title: "Rádio homologado",
    text: "Drone e controle usam radiofrequência. Antes de operar, confirme se o equipamento é homologado pela Anatel.",
    icon: "verified"
  },
  {
    title: "Voo autorizado",
    text: "O acesso ao espaço aéreo deve ser verificado no SARPAS/DECEA, principalmente perto de aeródromos, áreas restritas e infraestruturas sensíveis.",
    icon: "approval"
  },
  {
    title: "Operação segura",
    text: "Planeje altitude, local de decolagem, linha visual, pessoas próximas e interrupção imediata caso haja aeronave tripulada na área.",
    icon: "health_and_safety"
  }
]

const agencies = [
  {
    name: "ANAC",
    role: "Cadastro, classes da aeronave e regras civis do RPAS.",
    icon: "assignment"
  },
  {
    name: "DECEA",
    role: "Solicitação e autorização de acesso ao espaço aéreo pelo SARPAS.",
    icon: "public"
  },
  {
    name: "Anatel",
    role: "Homologação de equipamentos que emitem radiofrequência.",
    icon: "cell_tower"
  }
]

export default function LegislacaoDronesTab() {
  return (
    <section className="drone-law-container">
      <div className="drone-law-hero">
        <span className="drone-law-kicker">Uso responsável de drones</span>
        <h2>Legislação para voar sem risco</h2>
        <p>
          A maioria dos problemas começa antes da decolagem: equipamento sem homologação,
          falta de cadastro ou voo solicitado de forma incorreta. Use este guia como
          checklist rápido antes de operar na fazenda.
        </p>
        <div className="drone-law-alert">
          <span className="material-symbols-outlined">warning</span>
          <strong>Estimativa do evento ESALQ:</strong>
          cerca de 75% dos usuários citados não seguem corretamente a legislação.
        </div>
      </div>

      <div className="drone-law-grid">
        {checklist.map((item) => (
          <article className="drone-law-card" key={item.title}>
            <span className="drone-law-card-icon material-symbols-outlined">{item.icon}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="drone-law-section">
        <div className="drone-law-section-title">
          <span className="material-symbols-outlined">account_balance</span>
          <h3>Quem regula o quê</h3>
        </div>

        <div className="drone-law-agencies">
          {agencies.map((agency) => (
            <article className="drone-law-agency" key={agency.name}>
              <span className="material-symbols-outlined">{agency.icon}</span>
              <strong>{agency.name}</strong>
              <p>{agency.role}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="drone-law-section">
        <div className="drone-law-section-title">
          <span className="material-symbols-outlined">link</span>
          <h3>Links oficiais</h3>
        </div>

        <div className="drone-law-links">
          {officialLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
              <span className="material-symbols-outlined">open_in_new</span>
            </a>
          ))}
        </div>
      </div>

      <p className="drone-law-note">
        Este material é informativo. Antes de voar, confirme as regras vigentes nos canais oficiais,
        porque normas do espaço aéreo e procedimentos do SARPAS podem mudar.
      </p>
    </section>
  )
}
