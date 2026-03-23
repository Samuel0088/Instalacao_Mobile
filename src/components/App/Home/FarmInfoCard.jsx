// components/Home/FarmInfoCard.jsx
export default function FarmInfoCard({ farmData }) {
  if (!farmData) return null

  return (
    <div className="farm-info-card glass">
      <div className="farm-info-content">
        <div className="farm-icon">
          <span className="material-symbols-outlined">agriculture</span>
          <div className="icon-glow"></div>
        </div>
        <div className="farm-details">
          <h3 className="farm-name">{farmData.name}</h3>
          <div className="farm-location">
            <span className="material-symbols-outlined">location_on</span>
            <span>{farmData.municipio}, {farmData.uf}</span>
            <span className="farm-sector">{farmData.sector || "Setor A12"}</span>
          </div>
        </div>
      </div>
      <div className="farm-stats">
        <div className="stat-item">
          <span className="stat-label">Área Total</span>
          <span className="stat-value-teste">{farmData.area_total}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-label">Setores</span>
          <span className="stat-value-teste">4</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-label">Sensores</span>
          <span className="stat-value-teste">12</span>
        </div>
      </div>
    </div>
  )
}