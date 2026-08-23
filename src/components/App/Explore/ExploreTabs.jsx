const tabs = [
  { id: "diagnostico", icon: "eco", label: "Diagnóstico" },
  { id: "monitoramento", icon: "analytics", label: "Monitoramento" },
  { id: "clima", icon: "cloud", label: "Clima" },
  { id: "diario", icon: "menu_book", label: "Diário" },
  { id: "mapa", icon: "map", label: "Mapa" },
  { id: "estoque", icon: "inventory", label: "Estoque" }
];

export default function ExploreTabs({ activeTab, onTabChange }) {
  return (
    <div className="explore-tabs-header">
      <div className="explore-tabs-modern" role="tablist" aria-label="Módulos de exploração">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`explore-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="material-symbols-outlined explore-tab-icon">{tab.icon}</span>
            <span className="explore-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
