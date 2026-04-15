import React, { useRef, useState } from "react";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

/**
 * Zona de upload com:
 *  - Toque para abrir galeria (mobile) ou seletor de arquivo (desktop)
 *  - `capture="environment"`: abre câmera traseira diretamente no celular
 *  - Drag-and-drop para desktop
 *  - Estado desabilitado durante análise
 */
export default function UploadImage({ onSelect, disabled }) {
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef(null);

  const processarArquivo = (file) => {
    if (file && !disabled) onSelect(file);
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
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Selecionar imagem para análise"
      className={[
        styles.uploadArea,
        arrastando  ? styles.uploadArea_arrastando  : "",
        disabled    ? styles.uploadArea_desabilitado : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={() => setArrastando(false)}
      onDrop={handleDrop}
    >
      <span className={styles.uploadIcone} aria-hidden="true">
        {disabled ? "⏳" : "📷"}
      </span>
      <span className={styles.uploadTexto}>
        {disabled ? "Processando imagem..." : "Toque para selecionar imagem"}
      </span>
      <span className={styles.uploadDica}>
        JPG, PNG · Da câmera ou galeria
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.uploadInputOculto}
        disabled={disabled}
        onChange={(e) => processarArquivo(e.target.files[0])}
      />
    </div>
  );
}