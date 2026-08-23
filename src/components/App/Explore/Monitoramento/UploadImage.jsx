import React, { useRef, useState } from "react";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

/**
 * Zona de upload com:
 *  - Selecao de imagem aerea pela galeria
 *  - Drag-and-drop para desktop
 *  - Estado desabilitado durante análise
 */
export default function UploadImage({ onSelect, disabled }) {
  const [arrastando, setArrastando] = useState(false);
  const galleryInputRef = useRef(null);

  const processarArquivo = (file) => {
    if (file && !disabled) onSelect(file);
  };

  const handleFileChange = (e) => {
    processarArquivo(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastando(false);
    processarArquivo(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setArrastando(true);
  };

  return (
    <div
      className={[
        styles.uploadArea,
        arrastando  ? styles.uploadArea_arrastando  : "",
        disabled    ? styles.uploadArea_desabilitado : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={handleDragOver}
      onDragLeave={() => setArrastando(false)}
      onDrop={handleDrop}
    >
      <div className={styles.uploadVisual} aria-hidden="true">
        {disabled ? (
          <span className="material-symbols-outlined">progress_activity</span>
        ) : (
          <img src="/assets/image/drone-alinhamento-aereo-2026.png" alt="" />
        )}
      </div>
      <span className={styles.uploadTexto}>
        {disabled ? "Analisando as fileiras..." : "Enviar imagem aérea das fileiras"}
      </span>
      <span className={styles.uploadDica}>
        JPG ou PNG · Selecione uma foto do drone com as linhas do plantio visíveis
      </span>

      <div className={styles.uploadAcoes}>
        <button
          type="button"
          className={styles.uploadAcao}
          onClick={() => !disabled && galleryInputRef.current?.click()}
          disabled={disabled}
        >
          <span className="material-symbols-outlined" aria-hidden="true">upload</span>
          Enviar foto aérea
        </button>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className={styles.uploadInputOculto}
        disabled={disabled}
        onChange={handleFileChange}
      />
    </div>
  );
}
