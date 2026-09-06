import React, { useEffect, useRef, useState } from "react";
import { useMonitoramento } from "../hooks/useMonitoramento";
import UploadImage   from "./UploadImage";
import OverlayResult from "./OverlayResult";
import MetricsPanel  from "./MetricsPanel";
import { interpretar } from "../../utils/Interpretations";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

const PLANTING_HISTORY_KEY = "plantingAnalysisHistory";

function readPlantingHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLANTING_HISTORY_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function toPercentage(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue * 100) : null;
}

function sanitizePdfText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(text, maxLength = 74) {
  const words = sanitizePdfText(text).split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines;
}

function buildHistoryPdf(lines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const lineHeight = 16;
  const pages = [];
  let currentPage = [];
  let y = pageHeight - margin;

  lines.forEach((line) => {
    const wrapped = wrapPdfText(line.text, line.maxLength);
    wrapped.forEach((wrappedLine, index) => {
      if (y < margin) {
        pages.push(currentPage);
        currentPage = [];
        y = pageHeight - margin;
      }

      currentPage.push({
        text: wrappedLine,
        x: margin + (line.indent || 0),
        y,
        size: line.size || 11,
        bold: line.bold || false,
      });
      y -= line.after && index === wrapped.length - 1 ? line.after : lineHeight;
    });
  });

  if (currentPage.length) pages.push(currentPage);

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };
  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageRefs = [];

  pages.forEach((page) => {
    const content = [
      "BT",
      ...page.map((item) => {
        const font = item.bold ? "F2" : "F1";
        return `/${font} ${item.size} Tf 1 0 0 1 ${item.x} ${item.y} Tm (${item.text}) Tj`;
      }),
      "ET",
    ].join("\n");
    const contentRef = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageRef = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentRef} 0 R >>`
    );
    pageRefs.push(pageRef);
  });

  const pagesRef = addObject(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  pageRefs.forEach((pageRef) => {
    objects[pageRef - 1] = objects[pageRef - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`);
  });
  const catalogRef = addObject(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

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
  const [history, setHistory] = useState(readPlantingHistory);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const savedResultRef = useRef(null);
  const feedbackRef = useRef(null);
  // Interpretação agronômica só calculada quando há resultado
  const interpretacao = result ? interpretar(result) : null;

  const mostrarResultados = result && !loading && !error;
  const latestAnalysis = history[0] || null;
  const currentRowsDetected = Boolean(result?.rows?.detected || result?.alignment?.aligned);
  const rowsDetected = result ? currentRowsDetected : Boolean(latestAnalysis?.rowsDetected);
  const currentAlignmentScore = Number.isFinite(Number(result?.alignment?.score))
    ? Math.round(Number(result.alignment.score) * 100)
    : null;
  const alignmentScore = result ? currentAlignmentScore : latestAnalysis?.alignment ?? null;
  const hasSavedAnalysis = Boolean(result || latestAnalysis);
  const alignmentLabel = loading
    ? "Detectando fileiras"
    : hasSavedAnalysis
      ? rowsDetected ? "Fileiras detectadas" : "Fileiras não identificadas"
      : "Aguardando imagem";
  const alignmentIcon = loading
    ? "progress_activity"
    : !hasSavedAnalysis
      ? "image_search"
      : !rowsDetected
        ? "search_off"
      : rowsDetected && alignmentScore >= 75 ? "check" : "priority_high";
  const alignmentHint = !hasSavedAnalysis
    ? "aguardando imagem"
    : alignmentScore == null
      ? "não calculado"
      : result ? "de alinhamento" : "última análise";

  useEffect(() => {
    if (!mostrarResultados || savedResultRef.current === result) return;

    savedResultRef.current = result;
    const historyItem = {
      id: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      coverage: toPercentage(result?.coverage ?? result?.density),
      uniformity: toPercentage(result?.uniformity),
      alignment: alignmentScore,
      failureLevel: result?.failure_level ?? result?.failures ?? "BAIXO",
      rowsDetected,
    };

    setHistory((currentHistory) => {
      const updatedHistory = [historyItem, ...currentHistory];
      try {
        localStorage.setItem(PLANTING_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch {
        // O histórico permanece disponível durante a sessão se o armazenamento falhar.
      }
      return updatedHistory;
    });
  }, [alignmentScore, mostrarResultados, result, rowsDetected]);

  useEffect(() => {
    if (!error && !mostrarResultados) return;

    const scrollTimer = window.setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [error, mostrarResultados]);

  const deleteHistoryItem = (id) => {
    setHistory((currentHistory) => {
      const updatedHistory = currentHistory.filter((item) => item.id !== id);
      try {
        localStorage.setItem(PLANTING_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch {
        // Mantém a remoção apenas no estado atual quando necessário.
      }
      return updatedHistory;
    });
  };

  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  const exportHistory = () => {
    const validAlignments = history
      .map((item) => Number(item.alignment))
      .filter(Number.isFinite);
    const averageAlignment = validAlignments.length > 0
      ? Math.round(validAlignments.reduce((total, value) => total + value, 0) / validAlignments.length)
      : null;
    const lines = [
      { text: "Historico de Alinhamento da Plantacao", size: 20, bold: true, after: 24 },
      { text: `Gerado em: ${new Date().toLocaleString("pt-BR")}`, size: 10, after: 22 },
      { text: "Resumo", size: 14, bold: true, after: 18 },
      { text: `Total de analises: ${history.length}`, after: 16 },
      { text: `Alinhamento medio: ${averageAlignment == null ? "Nao calculado" : `${averageAlignment}%`}`, after: 24 },
      { text: "Resultados", size: 14, bold: true, after: 18 },
    ];

    history.forEach((item, index) => {
      const status = getHistoryStatus(item).label;
      lines.push(
        { text: `${index + 1}. Analise do talhao`, bold: true, after: 16 },
        { text: `Data: ${item.date || "-"}`, indent: 16, after: 16 },
        { text: `Cobertura: ${item.coverage == null ? "Nao calculada" : `${item.coverage}%`}`, indent: 16, after: 16 },
        { text: `Uniformidade: ${item.uniformity == null ? "Nao calculada" : `${item.uniformity}%`}`, indent: 16, after: 16 },
        { text: `Alinhamento: ${item.alignment == null ? "Nao calculado" : `${item.alignment}%`}`, indent: 16, after: 16 },
        { text: `Fileiras: ${item.rowsDetected ? "Identificadas" : "Nao identificadas"}`, indent: 16, after: 16 },
        { text: `Situacao: ${status}`, indent: 16, after: 24 }
      );
    });

    const url = URL.createObjectURL(buildHistoryPdf(lines));
    const linkElement = document.createElement("a");
    linkElement.href = url;
    linkElement.download = `historico_alinhamento_${new Date().toISOString().slice(0, 10)}.pdf`;
    linkElement.click();
    URL.revokeObjectURL(url);
  };

  const getHistoryStatus = (item) => {
    if (item.failureLevel === "ALTO") return { label: "Crítico", className: styles.plantingHistoryStatusCritical };
    if (["MÉDIO", "MEDIO"].includes(item.failureLevel)) return { label: "Atenção", className: styles.plantingHistoryStatusWarning };
    return { label: "Saudável", className: styles.plantingHistoryStatusHealthy };
  };

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
              <strong>{loading ? "..." : alignmentScore == null ? "—" : `${alignmentScore}%`}</strong>
              <small>{loading ? "analisando imagem" : alignmentHint}</small>
            </div>
            {result && !rowsDetected && !loading ? (
              <button
                type="button"
                className={styles.alignmentRetry}
                onClick={resetar}
                aria-label="Enviar outra imagem"
              >
                <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
              </button>
            ) : (
              <span className="material-symbols-outlined" aria-hidden="true">{alignmentIcon}</span>
            )}
          </div>
        </section>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Upload — sempre visível                                             */}
      {/* ------------------------------------------------------------------ */}
      {!mostrarResultados && (
        <UploadImage
          onSelect={analisar}
          disabled={loading}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Loading                                                             */}
      {/* ------------------------------------------------------------------ */}
      {loading && (
        <div ref={feedbackRef} className={styles.loadingContainer} aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.loadingTexto}>Analisando imagem...</p>
          <p className={styles.loadingDica}>Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Erro                                                                */}
      {/* ------------------------------------------------------------------ */}
      {error && !loading && (
        <div ref={feedbackRef} className={styles.erroContainer} role="alert">
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
        <div ref={feedbackRef} className={styles.resultados}>

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

      {!mostrarResultados && (
        <aside className={styles.tipCard}>
          <span className="material-symbols-outlined" aria-hidden="true">lightbulb</span>
          <div>
            <strong>Dica</strong>
            <p>Use uma imagem do drone capturada de cima, com boa iluminação e toda a área das fileiras visível.</p>
          </div>
          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </aside>
      )}

      <section className={styles.plantingHistorySection} aria-labelledby="planting-history-title">
        <div className={styles.plantingHistoryHeader}>
          <div>
            <span className="material-symbols-outlined" aria-hidden="true">history</span>
            <h3 id="planting-history-title">Histórico de análises</h3>
          </div>
          <div className={styles.plantingHistorySummary}>
            <span>{history.length} {history.length === 1 ? "resultado" : "resultados"}</span>
            {history.length > 0 && (
              <button type="button" onClick={exportHistory} aria-label="Baixar histórico completo em PDF">
                <span className="material-symbols-outlined" aria-hidden="true">download</span>
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className={styles.plantingHistoryEmpty}>
            <span className="material-symbols-outlined" aria-hidden="true">image_search</span>
            <div>
              <strong>Nenhuma análise realizada</strong>
              <p>Os resultados das imagens enviadas aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div className={styles.plantingHistoryList}>
            {visibleHistory.map((item) => {
              const status = getHistoryStatus(item);
              return (
                <article className={styles.plantingHistoryCard} key={item.id}>
                  <div className={styles.plantingHistoryCardTop}>
                    <span className={`${styles.plantingHistoryIcon} material-symbols-outlined`} aria-hidden="true">
                      psychiatry
                    </span>
                    <div className={styles.plantingHistoryInfo}>
                      <div>
                        <strong>{item.rowsDetected ? "Fileiras analisadas" : "Talhão analisado"}</strong>
                        <span className={`${styles.plantingHistoryStatus} ${status.className}`}>{status.label}</span>
                      </div>
                      <small>
                        <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
                        {item.date}
                      </small>
                    </div>
                    <button
                      type="button"
                      className={styles.plantingHistoryDelete}
                      onClick={() => deleteHistoryItem(item.id)}
                      aria-label="Excluir análise"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>

                  <div className={styles.plantingHistoryMetrics}>
                    <span><small>Cobertura</small><strong>{item.coverage == null ? "—" : `${item.coverage}%`}</strong></span>
                    <span><small>Uniformidade</small><strong>{item.uniformity == null ? "—" : `${item.uniformity}%`}</strong></span>
                    <span><small>Alinhamento</small><strong>{item.alignment == null ? "—" : `${item.alignment}%`}</strong></span>
                  </div>
                </article>
              );
            })}

            {history.length > 5 && (
              <button
                type="button"
                className={styles.plantingHistoryMore}
                onClick={() => setShowAllHistory((current) => !current)}
              >
                {showAllHistory ? "Mostrar menos" : "Ver todos"}
                <span className="material-symbols-outlined" aria-hidden="true">
                  {showAllHistory ? "expand_less" : "expand_more"}
                </span>
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
