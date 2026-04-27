// pages/App/Explore.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import AppHeader from "../../components/App/Global/AppHeader";
// import MenuBar from "../../components/App/Global/MenuBar";

import DiagnosticoTab from "../../components/App/Explore/Diagnostico/DiagnosticoTab";
import MonitoramentoView from "../../components/App/Explore/Monitoramento/MonitoramentoView"; // ✅ NOVO
import ClimaTab from "../../components/App/Explore/ClimaTab";
import DiarioTab from "../../components/App/Explore/DiarioTab";
import MapaTab from "../../components/App/Explore/MapaTab";
import EstoqueTab from "../../components/App/Explore/EstoqueTab";
import AtividadesTab from "../../components/App/Explore/AtividadesTab";

import ParticleBackground from "../../components/App/Home/ParticleBackground";

import "../../styles/App/Explore.css";

// ================= TABS =================
const tabs = [
  { id: "diagnostico", label: "Diagnóstico", icon: "eco" },
  { id: "monitoramento", label: "Plantio", icon: "analytics" }, // 🔥 NOVO
  { id: "clima", label: "Clima", icon: "cloud" },
  { id: "diario", label: "Diário", icon: "menu_book" },
  { id: "mapa", label: "Mapa", icon: "map" },
  { id: "estoque", label: "Estoque", icon: "inventory" },
  { id: "atividades", label: "Atividades", icon: "assignment" }
];

export default function Explore() {
  const location = useLocation();

  // 🔒 valida tabs válidas
  const validTabs = tabs.map((t) => t.id);

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("activeExploreTab");
    return validTabs.includes(savedTab) ? savedTab : "diagnostico";
  });

  // ================= CONTROLADOR DE TAB =================
  useEffect(() => {
    if (location.state?.activeTab && validTabs.includes(location.state.activeTab)) {
      setActiveTab(location.state.activeTab);
      localStorage.setItem("activeExploreTab", location.state.activeTab);
    } else {
      const savedTab = localStorage.getItem("activeExploreTab");
      if (savedTab && validTabs.includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, [location]);

  useEffect(() => {
    localStorage.setItem("activeExploreTab", activeTab);
  }, [activeTab]);

  // ================= RENDER =================
  const renderTab = () => {
    switch (activeTab) {
      case "diagnostico":
        return <DiagnosticoTab active />;

      case "monitoramento":
        return <MonitoramentoView />; // 🔥 FUNCIONANDO

      case "clima":
        return <ClimaTab />;

      case "diario":
        return <DiarioTab />;

      case "mapa":
        return <MapaTab />;

      case "estoque":
        return <EstoqueTab />;

      case "atividades":
        return <AtividadesTab />;

      default:
        return <DiagnosticoTab />;
    }
  };

  return (
    <div className="explore-container">
      <ParticleBackground />

      <AppHeader title="Explorar" showNotification={true} />

      {/* ================= TABS UI ================= */}
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

      {/* ================= CONTEÚDO ================= */}
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

      {/* <MenuBar /> */}
    </div>
  );
}