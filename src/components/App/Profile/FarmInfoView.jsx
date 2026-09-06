// components/App/Profile/FarmInfoView.jsx
import { motion } from "framer-motion"

const FarmInfoView = ({ farmData, onAddFarm, onEditFarm, formatPhone }) => {
  if (!farmData) {
    return (
      <motion.div 
        className="empty-state-tech"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="empty-icon-container">
          <span className="material-symbols-outlined empty-icon">agriculture</span>
          <div className="empty-ring"></div>
          <div className="empty-ring-2"></div>
        </div>
        
        <h4>Nenhuma fazenda cadastrada</h4>
        <p>Cadastre sua primeira fazenda para começar a monitorar suas safras</p>
        
        <button className="empty-action-btn" onClick={onAddFarm}>
          <span className="material-symbols-outlined">add</span>
          Cadastrar Fazenda
        </button>
      </motion.div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Não informado"
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const formatArea = (area) => {
    if (!area) return "Não informado"
    return `${parseFloat(area).toFixed(1).replace('.', ',')} ha`
  }

  const farmInitial = (farmData.name || "F").trim().charAt(0).toLocaleUpperCase("pt-BR") || "F"
  const location = [farmData.municipio, farmData.uf].filter(Boolean).join(" - ") || "Não informado"
  const farmRows = [
    {
      icon: "agriculture",
      label: "Nome",
      value: farmData.name || "Não informado",
    },
    {
      icon: "square_foot",
      label: "Área total",
      value: formatArea(farmData.area_total),
    },
    {
      icon: "grass",
      label: "Cultura",
      value: farmData.plantacao || "Não informado",
    },
    {
      icon: "location_on",
      label: "Localização",
      value: location,
    },
    {
      icon: "map",
      label: "Bairro/Distrito",
      value: farmData.bairro || "Não informado",
    },
    {
      icon: "mail",
      label: "CEP",
      value: farmData.cep || "Não informado",
    },
    {
      icon: "call",
      label: "Telefone",
      value: farmData.telefone ? formatPhone(farmData.telefone) : "Não informado",
    },
    {
      icon: "calendar_month",
      label: "Aquisição",
      value: farmData.data_aquisicao ? formatDate(farmData.data_aquisicao) : "Não informado",
    },
    {
      icon: "badge",
      label: "Vínculo",
      value: farmData.tipo_proprietario || "Não informado",
    },
  ]

  return (
    <motion.div 
      className="profile-card farm-details"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="card-corner"></div>

      <div className="farm-account-summary">
        <span className="farm-account-avatar">{farmInitial}</span>
        <div className="farm-account-copy">
          <strong>{farmData.name || "Fazenda"}</strong>
          <span>{location}</span>
        </div>
      </div>

      <div className="farm-data-list">
        {farmRows.map((row) => (
          <button type="button" className="personal-data-row farm-data-row" onClick={onEditFarm} key={row.label}>
            <span className="personal-data-icon material-symbols-outlined" aria-hidden="true">{row.icon}</span>
            <span className="personal-data-copy">
              <small>{row.label}</small>
              <strong>{row.value}</strong>
            </span>
            <span className="personal-data-action material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

export default FarmInfoView
