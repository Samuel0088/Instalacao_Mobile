// pages/App/Explore.jsx
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import AppHeader from "../../components/App/Global/AppHeader"
import MenuBar from "../../components/App/Global/MenuBar"
import DiagnosticoTab from "../../components/App/Explore/Diagnostico/DiagnosticoTab"
import ClimaTab from "../../components/App/Explore/ClimaTab"
import DiarioTab from "../../components/App/Explore/DiarioTab"
import MapaTab from "../../components/App/Explore/MapaTab"
import EstoqueTab from "../../components/App/Explore/EstoqueTab"
import AtividadesTab from "../../components/App/Explore/AtividadesTab"
import ParticleBackground from "../../components/App/Home/ParticleBackground"
import "../../styles/App/Explore.css"

const tabs = [
  { id: "diagnostico", label: "Diagnóstico", icon: "eco" },
  { id: "clima", label: "Clima", icon: "cloud" },
  { id: "diario", label: "Diário", icon: "menu_book" },
  { id: "mapa", label: "Mapa", icon: "map" },
  { id: "estoque", label: "Estoque", icon: "inventory" },
  { id: "atividades", label: "Atividades", icon: "assignment" }
]

export default function Explore() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => {
    // Tentar recuperar do localStorage
    const savedTab = localStorage.getItem("activeExploreTab")
    console.log("Tab salva no localStorage:", savedTab)
    return savedTab || "diagnostico"
  })

  // Verificar se veio uma tab específica do estado de navegação
  useEffect(() => {
    console.log("=== EXPLORE: useEffect executando ===")
    console.log("location.state completo:", location.state)
    console.log("location.state?.activeTab:", location.state?.activeTab)
    
    // Prioridade: 1. state, 2. localStorage, 3. padrão
    if (location.state?.activeTab) {
      console.log("✅ Mudando para tab via state:", location.state.activeTab)
      setActiveTab(location.state.activeTab)
      localStorage.setItem("activeExploreTab", location.state.activeTab)
    } else {
      // Verificar se tem uma tab salva
      const savedTab = localStorage.getItem("activeExploreTab")
      if (savedTab && savedTab !== activeTab) {
        console.log("✅ Mudando para tab via localStorage:", savedTab)
        setActiveTab(savedTab)
      }
    }
  }, [location])

  // Salvar tab quando mudar manualmente
  useEffect(() => {
    console.log("Tab alterada para:", activeTab)
    localStorage.setItem("activeExploreTab", activeTab)
  }, [activeTab])

  const renderTab = () => {
    console.log("Renderizando tab:", activeTab)
    switch(activeTab) {
      case "diagnostico": 
        return <DiagnosticoTab active={activeTab === "diagnostico"} />
      case "clima": 
        return <ClimaTab />
      case "diario": 
        return <DiarioTab />
      case "mapa": 
        return <MapaTab />
      case "estoque": 
        return <EstoqueTab />
      case "atividades": 
        return <AtividadesTab />
      default: 
        return <DiagnosticoTab />
    }
  }

  return (
    <div className="explore-container">
      <ParticleBackground />
      <AppHeader title="Explorar" showNotification={true} />

      <div className="explore-tabs-modern">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`explore-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="explore-tab-icon material-symbols-outlined">
              {tab.icon}
            </span>
            <span className="explore-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="tab-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      <MenuBar />
    </div>
  )
}