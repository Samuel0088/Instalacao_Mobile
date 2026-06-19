import React from "react";
import { AlertTriangle, CheckCircle, Siren } from "lucide-react";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

const ICONE = {
  perigo: Siren,
  aviso: AlertTriangle,
  ok: CheckCircle,
};

/**
 * Banner de alerta principal — primeira coisa que o agricultor vê nos resultados.
 * Nível "perigo" = ação imediata necessária, "aviso" = atenção, "ok" = tudo bem.
 */
export default function AlertBanner({ alerta }) {
  if (!alerta) return null;

  const nivel = alerta.nivel || "ok";
  const Icon = ICONE[nivel] || ICONE.ok;

  return (
    <div className={`${styles.alertBanner} ${styles[`alertBanner_${nivel}`]}`}>
      <Icon
        className={styles.alertBannerIcon}
        size={20}
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <p className={styles.alertBannerText}>{alerta.texto}</p>
    </div>
  );
}
