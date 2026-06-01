import React, { useRef, useState } from "react";
import styles from "../../../../styles/App/MonitoramentoView.module.css";

/**
 * Zona de upload com:
 *  - Botao de camera controlado pela tela principal
 *  - Botao de galeria sem capture
 *  - Drag-and-drop para desktop
 *  - Estado desabilitado durante análise
 */
export default function UploadImage({ onSelect, onCamera, disabled }) {
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
        <span className="material-symbols-outlined">
          {disabled ? "progress_activity" : "satellite_alt"}
        </span>
      </div>
      <span className={styles.uploadTexto}>
        {disabled ? "Processando imagem..." : "Enviar imagem da plantação"}
      </span>
      <span className={styles.uploadDica}>
        JPG ou PNG · Foto aérea, folha ou talhão
      </span>

      <div className={styles.uploadAcoes}>
        <button
          type="button"
          className={styles.uploadAcao}
          onClick={() => !disabled && onCamera?.()}
          disabled={disabled}
        >
          <span className="material-symbols-outlined" aria-hidden="true">center_focus_strong</span>
          Capturar imagem
        </button>
        <button
          type="button"
          className={`${styles.uploadAcao} ${styles.uploadAcaoSecundaria}`}
          onClick={() => !disabled && galleryInputRef.current?.click()}
          disabled={disabled}
        >
          <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
          Selecionar da galeria
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
