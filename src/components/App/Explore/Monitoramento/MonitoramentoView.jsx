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
  const alignmentScore = Number.isFinite(result?.alignment?.score)
    ? Math.round(result.alignment.score * 100)
    : null;
  const rowsDetected = Boolean(result?.rows?.detected || result?.alignment?.aligned);
  const alignmentLabel = loading
    ? "Detectando fileiras"
    : result
      ? rowsDetected ? "Fileiras detectadas" : "Fileiras não identificadas"
      : "Aguardando imagem";
  const alignmentIcon = loading
    ? "progress_activity"
    : alignmentScore == null
      ? "image_search"
      : rowsDetected && alignmentScore >= 75 ? "check" : "priority_high";

  return (
    <div className={styles.container} data-page-gutter="planting">
      <section className={styles.hero}>
        <div className={styles.cabecalho}>
          <h2 className={styles.titulo}>Alinhamento da Plantação</h2>
          <p className={styles.subtitulo}>
            Analise o alinhamento e a uniformidade das fileiras
          </p>
        </div>

        <section
          className={`${styles.alignmentCard} ${loading ? styles.alignmentCard_loading : ""}`}
          aria-live="polite"
          aria-busy={loading}
        >
          <div className={styles.alignmentGuide} aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index}></span>
            ))}
            <i className="material-symbols-outlined">{rowsDetected ? "check" : "eco"}</i>
          </div>
          <div className={styles.alignmentState}>
            <span className="material-symbols-outlined" aria-hidden="true">psychiatry</span>
            {alignmentLabel}
          </div>
          <div className={styles.alignmentResult}>
            <div>
              <strong>{loading ? "..." : alignmentScore == null ? "--" : `${alignmentScore}%`}</strong>
              <small>{alignmentScore == null ? "após a análise" : "de alinhamento"}</small>
            </div>
            <span className="material-symbols-outlined" aria-hidden="true">{alignmentIcon}</span>
          </div>
        </section>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Upload — sempre visível                                             */}
      {/* ------------------------------------------------------------------ */}
      <UploadImage
        onSelect={analisar}
        disabled={loading}
      />

      <aside className={styles.tipCard}>
        <span className="material-symbols-outlined" aria-hidden="true">lightbulb</span>
        <div>
          <strong>Dica</strong>
          <p>Use uma imagem do drone capturada de cima, com boa iluminação e toda a área das fileiras visível.</p>
        </div>
        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </aside>

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
