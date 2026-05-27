import React, { useRef, useState } from "react";
import { useMonitoramento } from "../hooks/useMonitoramento";
import UploadImage   from "./UploadImage";
import OverlayResult from "./OverlayResult";
import MetricsPanel  from "./MetricsPanel";
import AlertBanner   from "./AlertBanner";
import CameraView    from "../Diagnostico/CameraView";
import { interpretar } from "../../utils/Interpretations";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

/**
 * View principal do módulo de Monitoramento.
 *
 * Responsabilidades:
 *  - Orquestra os estados do hook (loading, error, result, preview)
 *  - Delega renderização para subcomponentes especializados
 *  - NÃO contém lógica de negócio — apenas composição de UI
 *
 * Layout:
 *  [Cabeçalho]
 *  [Upload]
 *  [Loading | Error]
 *  [AlertBanner]  ← primeira coisa que o agricultor lê
 *  [Imagens | Métricas]  ← grid responsivo
 *  [Botão: Nova análise]
 */
export default function MonitoramentoView() {
  const { analisar, resetar, result, loading, error, preview } = useMonitoramento();
  const [cameraAberta, setCameraAberta] = useState(false);
  const videoRef = useRef(null);

  // Interpretação agronômica só calculada quando há resultado
  const interpretacao = result ? interpretar(result) : null;

  const mostrarResultados = result && !loading && !error;

  const fecharCamera = () => {
    setCameraAberta(false);
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "monitoramento-camera.jpg", {
        type: "image/jpeg",
      });

      fecharCamera();
      analisar(file);
    }, "image/jpeg", 0.92);
  };

  if (cameraAberta) {
    return (
      <CameraView
        videoRef={videoRef}
        onCapture={capturarFoto}
        onCancel={fecharCamera}
      />
    );
  }

  return (
    <div className={styles.container}>

      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.cabecalho}>
        <h2 className={styles.titulo}>Monitoramento de Plantação</h2>
        <p className={styles.subtitulo}>
          Análise automática via imagem de drone ou câmera
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Upload — sempre visível                                             */}
      {/* ------------------------------------------------------------------ */}
      <UploadImage
        onSelect={analisar}
        onCamera={() => setCameraAberta(true)}
        disabled={loading}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Loading                                                             */}
      {/* ------------------------------------------------------------------ */}
      {loading && (
        <div className={styles.loadingContainer} aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.loadingTexto}>Analisando imagem...</p>
          <p className={styles.loadingDica}>Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Erro                                                                */}
      {/* ------------------------------------------------------------------ */}
      {error && !loading && (
        <div className={styles.erroContainer} role="alert">
          <span className={styles.erroIcone} aria-hidden="true">⚠️</span>
          <div className={styles.erroTextos}>
            <p className={styles.erroTitulo}>Não foi possível analisar</p>
            <p className={styles.erroMensagem}>{error}</p>
          </div>
          <button
            className={styles.botaoTentar}
            onClick={resetar}
            aria-label="Limpar erro e tentar novamente"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Resultados                                                          */}
      {/* ------------------------------------------------------------------ */}
      {mostrarResultados && interpretacao && (
        <div className={styles.resultados}>

          {/* Alerta principal — primeira leitura */}
          <AlertBanner alerta={interpretacao.alertaPrincipal} />

          {/* Grid: imagens + métricas */}
          <div className={styles.resultadosGrid}>
            <div className={styles.colunaImagem}>
              <OverlayResult originalSrc={preview} result={result} />
            </div>
            <div className={styles.colunaMetricas}>
              <MetricsPanel result={result} insights={interpretacao.insights} />
            </div>
          </div>

          {/* Ação secundária */}
          <button
            className={styles.botaoNova}
            onClick={resetar}
          >
            Analisar nova imagem
          </button>
        </div>
      )}
    </div>
  );
}
