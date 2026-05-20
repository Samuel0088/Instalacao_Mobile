/**
 * Lógica de interpretação agronômica — cores atualizadas para tema escuro.
 *
 * Paleta neon: #00ffaa (ok), #ffaa00 (aviso), #ff4d4d (perigo)
 * Thresholds ajustáveis por cultura em versões futuras.
 */

const THRESHOLDS = {
  coverage:    { critico: 0.25, moderado: 0.50 },
  failure:     { alto: 0.25, medio: 0.10 },
  uniformity:  { baixa: 0.50, media: 0.75 },
  periodicity: { fraco: 0.25, forte: 0.65 },
  paths:       { alto: 0.08 }, // > 8% da imagem com caminhos → informa o usuário
};

// ---------------------------------------------------------------------------
// Interpretação por métrica
// ---------------------------------------------------------------------------

function interpretarCobertura(coverage) {
  const pct = Math.round(coverage * 100);
  if (coverage < THRESHOLDS.coverage.critico) {
    return {
      tipo: "perigo",
      texto: `Cobertura de ${pct}% — muito abaixo do esperado. Possível falha de germinação ou estande comprometido.`,
    };
  }
  if (coverage < THRESHOLDS.coverage.moderado) {
    return {
      tipo: "aviso",
      texto: `Cobertura de ${pct}% — abaixo do ideal. Acompanhe o desenvolvimento nos próximos dias.`,
    };
  }
  return {
    tipo: "ok",
    texto: `Cobertura de ${pct}% dentro do esperado para a fase de crescimento.`,
  };
}

function interpretarFalhas(failureScore, failureLevel) {
  const pct = Math.round(failureScore * 100);
  if (failureLevel === "ALTO") {
    return {
      tipo: "perigo",
      texto: `${pct}% da área com falhas críticas — avaliação urgente e possível replantio recomendados.`,
    };
  }
  if (failureLevel === "MÉDIO") {
    return {
      tipo: "aviso",
      texto: `${pct}% da área com falhas moderadas — agende visita técnica para avaliação presencial.`,
    };
  }
  return {
    tipo: "ok",
    texto: "Distribuição do plantio em boas condições. Nenhuma falha significativa detectada.",
  };
}

function interpretarUniformidade(uniformity) {
  const pct = Math.round(uniformity * 100);
  if (uniformity < THRESHOLDS.uniformity.baixa) {
    return {
      tipo: "aviso",
      texto: `Uniformidade de ${pct}% — distribuição irregular entre regiões do talhão.`,
    };
  }
  if (uniformity >= THRESHOLDS.uniformity.media) {
    return {
      tipo: "ok",
      texto: `Uniformidade de ${pct}% — boa homogeneidade na distribuição do plantio.`,
    };
  }
  return null;
}

function interpretarFileiras(rows) {
  if (!rows) return null;
  if (!rows.detected) {
    if (rows.periodicity_snr < THRESHOLDS.periodicity.fraco) {
      return {
        tipo: "info",
        texto: "Estrutura de fileiras não identificada. Pode indicar dossel fechado ou imagem inclinada.",
      };
    }
    return null;
  }
  const partes = ["Fileiras detectadas com regularidade."];
  if (rows.row_count)        partes.push(`Estimativa: ${rows.row_count} fileiras.`);
  if (rows.orientation_deg != null) partes.push(`Ângulo: ${rows.orientation_deg}°.`);
  return { tipo: "info", texto: partes.join(" ") };
}

function interpretarIluminacao(quality, shadowCoverage) {
  if (quality === "poor") {
    return {
      tipo: "aviso",
      texto: "Qualidade de iluminação ruim — resultados podem ser menos precisos. Prefira imagens com boa luz natural.",
    };
  }
  if (shadowCoverage > 0.2) {
    return {
      tipo: "info",
      texto: `${Math.round(shadowCoverage * 100)}% da imagem com sombras — essas áreas foram excluídas da análise.`,
    };
  }
  return null;
}

function interpretarCaminhos(pathCoverage) {
  if (!pathCoverage || pathCoverage < THRESHOLDS.paths.alto) return null;
  return {
    tipo: "info",
    texto: `${Math.round(pathCoverage * 100)}% da imagem identificado como caminhos de maquinário — excluídos automaticamente da contagem de falhas.`,
  };
}

// ---------------------------------------------------------------------------
// Exportação principal
// ---------------------------------------------------------------------------

/**
 * Gera interpretação completa dos dados normalizados da API.
 * @param {object} result - Dados normalizados
 * @returns {{ alertaPrincipal: object, insights: object[] }}
 */
export function interpretar(result) {
  const {
    coverage          = 0,
    failure_score     = 0,
    failure_level     = "BAIXO",
    uniformity        = 0,
    rows,
    illumination_quality = "good",
    shadow_coverage   = 0,
    path_coverage     = 0,
  } = result;

  const candidatos = [
    interpretarCobertura(coverage),
    interpretarFalhas(failure_score, failure_level),
    interpretarUniformidade(uniformity),
    interpretarFileiras(rows),
    interpretarIluminacao(illumination_quality, shadow_coverage),
    interpretarCaminhos(path_coverage),
  ].filter(Boolean);

  const perigos = candidatos.filter((i) => i.tipo === "perigo");
  const avisos  = candidatos.filter((i) => i.tipo === "aviso");

  let alertaPrincipal;
  if (perigos.length > 0) {
    alertaPrincipal = { nivel: "perigo", texto: perigos[0].texto };
  } else if (avisos.length > 0) {
    alertaPrincipal = { nivel: "aviso", texto: avisos[0].texto };
  } else {
    alertaPrincipal = {
      nivel: "ok",
      texto: "Plantio em boas condições. Nenhuma intervenção urgente necessária.",
    };
  }

  return { alertaPrincipal, insights: candidatos };
}

// ---------------------------------------------------------------------------
// Utilitários de cor — paleta neon para tema escuro
// ---------------------------------------------------------------------------

/**
 * Cores do badge de nível de falha (tema escuro).
 */
export function coresNivelFalha(level) {
  switch (level) {
    case "ALTO":
      return {
        fundo:  "rgba(255, 77, 77, 0.12)",
        texto:  "#ff4d4d",
        borda:  "rgba(255, 77, 77, 0.35)",
      };
    case "MÉDIO":
      return {
        fundo:  "rgba(255, 170, 0, 0.12)",
        texto:  "#ffaa00",
        borda:  "rgba(255, 170, 0, 0.35)",
      };
    default:
      return {
        fundo:  "rgba(0, 255, 170, 0.08)",
        texto:  "#00ffaa",
        borda:  "rgba(0, 255, 170, 0.25)",
      };
  }
}

/**
 * Cor neon baseada em valor vs thresholds (tema escuro).
 */
export function corPorValor(value, { bom, aviso }) {
  if (value >= bom)   return "#00ffaa"; // neon green
  if (value >= aviso) return "#ffaa00"; // âmbar
  return "#ff4d4d";                     // vermelho
}