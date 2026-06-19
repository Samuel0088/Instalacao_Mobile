import React, { memo } from "react";
import styles from "../../../../styles/App/MonitoramentoView.module.css";
import { coresNivelFalha, corPorValor } from "../../utils/Interpretations";

// ---------------------------------------------------------------------------
// Anel de progresso SVG — cores neon para tema escuro
// ---------------------------------------------------------------------------

function AnelProgresso({ valor, tamanho = 76, espessura = 6, cor }) {
  const raio          = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const offset        = circunferencia * (1 - Math.min(Math.max(valor, 0), 1));

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      {/* Track escuro */}
      <circle
        cx={tamanho / 2}
        cy={tamanho / 2}
        r={raio}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={espessura}
      />
      {/* Progresso com glow */}
      <circle
        cx={tamanho / 2}
        cy={tamanho / 2}
        r={raio}
        fill="none"
        stroke={cor}
        strokeWidth={espessura}
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 0.75s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: `drop-shadow(0 0 4px ${cor}88)`,
        }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Cartão de detalhe
// ---------------------------------------------------------------------------

function CartaoMetrica({ icone, rotulo, children }) {
  return (
    <div className={styles.cartaoMetrica}>
      <div className={styles.cartaoMetricaLabel}>
        <span aria-hidden="true">{icone}</span>
        {rotulo}
      </div>
      <div className={styles.cartaoMetricaConteudo}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function MetricsPanel({ result, insights }) {
  if (!result) return null;

  const coverage     = result.coverage ?? result.density ?? 0;
  const uniformity   = result.uniformity ?? 0;
  const failureScore = result.failure_score ?? 0;
  const failureLevel = result.failure_level ?? result.failures ?? "BAIXO";
  const rows         = result.rows;
  const iluminacao   = result.illumination_quality ?? "good";
  const sombraPct    = Math.round((result.shadow_coverage ?? 0) * 100);
  const pathPct      = Math.round((result.path_coverage ?? 0) * 100);

  const coveragePct   = Math.round(coverage * 100);
  const uniformityPct = Math.round(uniformity * 100);
  const failurePct    = Math.round(failureScore * 100);
  const coresFalha    = coresNivelFalha(failureLevel);

  // Thresholds neon
  const corCobertura = corPorValor(coverage,   { bom: 0.60, aviso: 0.35 });
  const corUnif      = corPorValor(uniformity, { bom: 0.75, aviso: 0.50 });

  const ROTULOS_ILUMINACAO = {
    good:     { texto: "Boa",      classe: styles.iluminacao_boa      },
    moderate: { texto: "Moderada", classe: styles.iluminacao_moderada },
    poor:     { texto: "Ruim",     classe: styles.iluminacao_ruim     },
  };
  const iluminacaoInfo = ROTULOS_ILUMINACAO[iluminacao] || ROTULOS_ILUMINACAO.good;

  return (
    <div className={styles.painelMetricas}>
      <div className={styles.painelCabecalho}>
        <span aria-hidden="true">📊</span>
        <span>Análise do Talhão</span>
      </div>

      {/* Métricas principais */}
      <div className={styles.metriasPrincipais}>

        {/* Cobertura */}
        <div className={styles.metricaAnel}>
          <div className={styles.metricaAnelWrapper}>
            <AnelProgresso valor={coverage} cor={corCobertura} />
            <span className={styles.metricaAnelValor}>{coveragePct}%</span>
          </div>
          <span className={styles.metricaAnelRotulo}>Cobertura</span>
        </div>

        {/* Uniformidade */}
        <div className={styles.metricaAnel}>
          <div className={styles.metricaAnelWrapper}>
            <AnelProgresso valor={uniformity} cor={corUnif} />
            <span className={styles.metricaAnelValor}>{uniformityPct}%</span>
          </div>
          <span className={styles.metricaAnelRotulo}>Uniformidade</span>
        </div>

        {/* Badge de falhas */}
        <div className={styles.metricaAnel}>
          <div
            className={styles.badgeFalhas}
            style={{
              background:  coresFalha.fundo,
              color:       coresFalha.texto,
              borderColor: coresFalha.borda,
            }}
          >
            <span className={styles.badgeFalhasRotulo}>Falhas</span>
            <span className={styles.badgeFalhasNivel}>{failureLevel}</span>
            <span className={styles.badgeFalhasPct}>{failurePct}%</span>
          </div>
          <span className={styles.metricaAnelRotulo}>Plantio</span>
        </div>
      </div>

      {/* Grid de detalhes */}
      <div className={styles.gridDetalhes}>

        {/* Fileiras */}
        <CartaoMetrica icone="🌾" rotulo="Fileiras">
          {rows ? (
            rows.detected ? (
              <div className={styles.fileirasDetalhes}>
                <span className={`${styles.statusTag} ${styles.statusTag_ok}`}>
                  ✓ Detectadas
                </span>
                {rows.row_count && (
                  <span className={styles.fileirasDetalheItem}>~{rows.row_count} fileiras</span>
                )}
                {rows.orientation_deg != null && (
                  <span className={styles.fileirasDetalheItem}>{rows.orientation_deg}° de ângulo</span>
                )}
              </div>
            ) : (
              <span className={`${styles.statusTag} ${styles.statusTag_info}`}>
                Não identificadas
              </span>
            )
          ) : (
            /* Fallback v1 */
            <span className={`${styles.statusTag} ${result.alignment?.aligned ? styles.statusTag_ok : styles.statusTag_aviso}`}>
              {result.alignment?.aligned ? "✓ Alinhado" : "⚠ Desalinhado"}
            </span>
          )}
        </CartaoMetrica>

        {/* Iluminação */}
        <CartaoMetrica icone="☀️" rotulo="Iluminação">
          <span className={`${styles.statusTag} ${iluminacaoInfo.classe}`}>
            {iluminacaoInfo.texto}
          </span>
          {sombraPct > 5 && (
            <span className={styles.notaSombra}>{sombraPct}% em sombra</span>
          )}
          {pathPct > 2 && (
            <span className={styles.notaSombra}>{pathPct}% caminhos excluídos</span>
          )}
        </CartaoMetrica>
      </div>

      {/* Interpretação */}
      {insights && insights.length > 0 && (
        <div className={styles.secaoInterpretacao}>
          <p className={styles.interpretacaoTitulo}>Interpretação</p>
          <ul className={styles.listaInsights}>
            {insights.map((insight, i) => (
              <li
                key={i}
                className={`${styles.itemInsight} ${styles[`itemInsight_${insight.tipo}`]}`}
              >
                <span className={styles.itemInsightPonto} aria-hidden="true" />
                {insight.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(MetricsPanel);
