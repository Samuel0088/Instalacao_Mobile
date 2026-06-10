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
    title: "Cadastro e identificação",
    text: "No Brasil, drones usados como RPAS/VANT precisam seguir as regras da ANAC. Em geral, aeronaves acima de 250 g devem ser cadastradas e identificadas com o número de registro visível no equipamento. O cadastro ajuda a vincular a aeronave ao operador responsável.",
    icon: "badge"
  },
  {
    title: "Homologação Anatel",
    text: "O drone, o rádio controle e módulos de transmissão usam radiofrequência. Por isso, o equipamento deve ser homologado pela Anatel antes do uso, evitando interferências e problemas legais na operação.",
    icon: "verified"
  },
  {
    title: "Autorização de voo",
    text: "Antes de decolar, o operador deve verificar o espaço aéreo pelo SARPAS/DECEA. Isso é essencial perto de aeroportos, helipontos, áreas militares, cidades, linhas de transmissão e locais com restrições temporárias.",
    icon: "approval"
  },
  {
    title: "Segurança operacional",
    text: "Mesmo em área rural, planeje altitude, rota, vento, bateria, linha visual, distância de pessoas e animais, obstáculos e ponto de pouso. Se aparecer aeronave tripulada, a prioridade é sempre dela.",
    icon: "health_and_safety"
  }
]

const agencies = [
  {
    name: "ANAC",
    role: "Define regras civis para aeronaves não tripuladas, cadastro, classes operacionais, responsabilidades do piloto remoto e condições gerais para operar com segurança.",
    icon: "assignment"
  },
  {
    name: "DECEA",
    role: "Gerencia o acesso ao espaço aéreo. Pelo SARPAS, o operador informa local, horário, altura e finalidade do voo para obter autorização quando necessária.",
    icon: "public"
  },
  {
    name: "Anatel",
    role: "Cuida da homologação dos equipamentos de telecomunicação, como controle remoto, transmissão de vídeo, telemetria e módulos de comunicação.",
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
          Drones agrícolas também são veículos aéreos não tripulados. Na prática,
          operar corretamente envolve três frentes: aeronave regularizada, rádio
          homologado e acesso ao espaço aéreo autorizado quando aplicável.
        </p>
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
