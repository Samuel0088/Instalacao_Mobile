import React from "react";
import { useMonitoramento } from "../hooks/useMonitoramento";
import UploadImage   from "./UploadImage";
import OverlayResult from "./OverlayResult";
import MetricsPanel  from "./MetricsPanel";
import AlertBanner   from "./AlertBanner";
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

  // Interpretação agronômica só calculada quando há resultado
  const interpretacao = result ? interpretar(result) : null;

  const mostrarResultados = result && !loading && !error;

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
      <UploadImage onSelect={analisar} disabled={loading} />

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
