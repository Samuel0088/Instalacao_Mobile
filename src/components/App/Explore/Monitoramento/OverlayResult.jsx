import React, { useState, useMemo } from "react";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

const LEGENDA = [
  { cor: "#22c55e", rotulo: "Vegetação saudável" },
  { cor: "#f59e0b", rotulo: "Alerta moderado" },
  { cor: "#ef4444", rotulo: "Falha crítica" },
  { cor: "#3b82f6", rotulo: "Caminho (ignorado)" },
];

export default function OverlayResult({ originalSrc, result }) {
  const [abaAtiva, setAbaAtiva] = useState("analise");

  if (!result) return null;

  // 🔥 CORREÇÃO CRÍTICA: cria data URI corretamente
  const overlaySrc = useMemo(() => {
    if (!result.overlay_image) return null;
    return `data:image/jpeg;base64,${result.overlay_image}`;
  }, [result.overlay_image]);

  return (
    <div className={styles.imagemCard}>
      {/* Tabs */}
      <div className={styles.abas} role="tablist">
        {[
          { id: "original", rotulo: "Original" },
          { id: "analise",  rotulo: "Análise" },
        ].map(({ id, rotulo }) => (
          <button
            key={id}
            role="tab"
            aria-selected={abaAtiva === id}
            className={`${styles.aba} ${abaAtiva === id ? styles.aba_ativa : ""}`}
            onClick={() => setAbaAtiva(id)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {/* Imagem */}
      <div className={styles.imagemWrapper}>
        <img
          src={abaAtiva === "original" ? originalSrc : overlaySrc}
          alt={abaAtiva === "original"
            ? "Imagem original"
            : "Mapa de densidade da plantação"}
          className={styles.imagemDisplay}
          loading="lazy"
        />
      </div>

      {/* Legenda */}
      {abaAtiva === "analise" && (
        <div className={styles.legenda}>
          {LEGENDA.map(({ cor, rotulo }) => (
            <span key={rotulo} className={styles.legendaItem}>
              <span
                className={styles.legendaPonto}
                style={{ background: cor }}
              />
              {rotulo}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}