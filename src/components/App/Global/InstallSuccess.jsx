// components/App/Global/InstallSuccess.jsx
import { motion } from "framer-motion"
import { FaCheck, FaHome, FaLeaf, FaMobileAlt, FaTimes } from 'react-icons/fa'
import '../../../styles/Global/InstallSuccess.css'

const InstallSuccess = ({ onClose, isIOS, isAndroid }) => {
  return (
    <motion.div 
      className="install-success-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="install-success"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="install-success-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="success-icon">
          <FaCheck />
        </div>

        <span className="success-kicker">Zenith instalado</span>
        <h2>Pronto para usar</h2>

        <div className="success-message">
          <FaLeaf />
          <p>O app foi adicionado ao seu dispositivo para abrir mais rápido, sem depender da aba do navegador.</p>
        </div>

        <div className="next-steps">
          <h3>Próximos passos</h3>
          <div className="success-steps">
            {isAndroid && (
              <>
                <div><FaTimes /><span>Feche esta aba do navegador</span></div>
                <div><FaHome /><span>Procure o ícone do <strong>Zenith</strong> na tela inicial</span></div>
                <div><FaMobileAlt /><span>Toque no ícone para abrir como app</span></div>
              </>
            )}
            {isIOS && (
              <>
                <div><FaHome /><span>Volte para a tela inicial</span></div>
                <div><FaLeaf /><span>Procure o ícone do <strong>Zenith</strong></span></div>
                <div><FaMobileAlt /><span>Toque para abrir como app</span></div>
              </>
            )}
            {!isIOS && !isAndroid && (
              <>
                <div><FaTimes /><span>Feche esta aba do navegador</span></div>
                <div><FaHome /><span>Procure o atalho do <strong>Zenith</strong></span></div>
                <div><FaMobileAlt /><span>Abra pelo atalho instalado</span></div>
              </>
            )}
          </div>
        </div>

        <button className="success-button" onClick={onClose}>
          Entendi
        </button>
      </motion.div>
    </motion.div>
  )
}

export default InstallSuccess
