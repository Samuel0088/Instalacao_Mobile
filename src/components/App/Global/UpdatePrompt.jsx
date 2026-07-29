import { motion } from "framer-motion"
import { FaRedo, FaTimes } from "react-icons/fa"
import "../../../styles/Global/UpdatePrompt.css"

export default function UpdatePrompt({ onUpdate, onClose }) {
  return (
    <motion.div
      className="update-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="update-box"
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="update-close-btn" onClick={onClose} aria-label="Fechar aviso">
          <FaTimes />
        </button>

        <div className="update-icon">
          <FaRedo />
        </div>

        <h2>Nova atualização disponível</h2>
        <p className="update-subtitle">
          Atualize agora para usar a versão mais recente do app.
        </p>

        <button className="update-main-btn" onClick={onUpdate}>
          <FaRedo /> Atualizar agora
        </button>

        <button className="update-later-btn" onClick={onClose}>
          Depois
        </button>
      </motion.div>
    </motion.div>
  )
}
