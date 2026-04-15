import { useState, useEffect } from "react";
import ExploreTabs from "./ExploreTabs";
import DiagnosticoTab from "./DiagnosticoTab";
import ClimaTab from "./ClimaTab";
import DiarioTab from "./DiarioTab";
import MapaTab from "./MapaTab";
import EstoqueTab from "./EstoqueTab";
import MonitoramentoView from "./Monitoramento/MonitoramentoView";

import { useFarmData } from "../../hooks/useFarmData";
import { useCamera } from "../../hooks/useCamera";
import { useDiagnostico } from "../../hooks/useDiagnostico";
import { useGallery } from "../../hooks/useGallery";

import "../../../styles/App/Explore.css";

// ================= MOCKS =================

const MOCK_CAMERA = {
  videoRef: { current: null },
  isCameraActive: false,
  capturedImage: null,
  facingMode: "environment",
  startCamera: () => {},
  stopCamera: () => {},
  switchCamera: () => {},
  capturePhoto: () => "data:image/jpeg;base64,mock",
  resetCapture: () => {}
};

const MOCK_DIAGNOSTICO = {
  diagnosisResult: null,
  isAnalyzing: false,
  history: [],
  analyzeImage: async () => {},
  resetDiagnosis: () => {}
};

const MOCK_GALLERY = {
  selectedImage: null,
  error: null,
  pickFromGallery: async () => "data:image/jpeg;base64,mock",
  resetSelection: () => {}
};

// ================= COMPONENT =================

export default function ExploreView() {
  const [activeTab, setActiveTab] = useState("clima");
  const [hooks, setHooks] = useState({
    camera: null,
    diagnostico: null,
    gallery: null,
    farmData: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const farmHook = useFarmData();
      const cameraHook = useCamera();
      const diagnosticoHook = useDiagnostico();
      const galleryHook = useGallery();

      setHooks({
        farmData: farmHook,
        camera: cameraHook,
        diagnostico: diagnosticoHook,
        gallery: galleryHook
      });
    } catch (error) {
      console.error("Erro nos hooks:", error);

      setHooks({
        farmData: { farmData: null },
        camera: MOCK_CAMERA,
        diagnostico: MOCK_DIAGNOSTICO,
        gallery: MOCK_GALLERY
      });
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="explore-container">
        <p>Inicializando...</p>
      </div>
    );
  }

  return (
    <div className="explore-container">
      <ExploreTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="tab-content">
        {activeTab === "clima" && (
          <ClimaTab farmData={hooks.farmData?.farmData || null} />
        )}

        {activeTab === "diagnostico" && (
          <DiagnosticoTab
            camera={hooks.camera}
            diagnostico={hooks.diagnostico}
            gallery={hooks.gallery}
          />
        )}

        {activeTab === "monitoramento" && (
          <MonitoramentoView />
        )}

        {activeTab === "diario" && <DiarioTab />}
        {activeTab === "mapa" && <MapaTab />}
        {activeTab === "estoque" && <EstoqueTab />}
      </div>
    </div>
  );
}