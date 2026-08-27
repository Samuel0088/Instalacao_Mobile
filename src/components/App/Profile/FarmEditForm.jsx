// components/App/Profile/FarmEditForm.jsx
import { useState } from "react"
import { motion } from "framer-motion"

const FarmEditForm = ({ farmData, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    name: farmData?.name || "",
    area_total: farmData?.area_total || "",
    plantacao: farmData?.plantacao || "",
    municipio: farmData?.municipio || "",
    uf: farmData?.uf || "",
    bairro: farmData?.bairro || "",
    cep: farmData?.cep || "",
    data_aquisicao: farmData?.data_aquisicao || "",
    telefone: farmData?.telefone || "",
    tipo_proprietario: farmData?.tipo_proprietario || "Proprietário"
  })

  const [errors, setErrors] = useState({})
  const [cepLoading, setCepLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const buscarEnderecoPorCep = async (baseData = formData) => {
    const cepLimpo = baseData.cep.replace(/\D/g, "")

    if (cepLimpo.length !== 8) return baseData

    try {
      setCepLoading(true)
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        setErrors(prev => ({ ...prev, cep: "CEP não encontrado" }))
        return baseData
      }

      const updatedData = {
        ...baseData,
        bairro: data.bairro || baseData.bairro,
        municipio: data.localidade || baseData.municipio,
        uf: data.uf || baseData.uf
      }

      setFormData(updatedData)

      setErrors(prev => ({
        ...prev,
        cep: "",
        municipio: "",
        uf: ""
      }))

      return updatedData
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setErrors(prev => ({ ...prev, cep: "Não foi possível buscar o CEP" }))
      return baseData
    } finally {
      setCepLoading(false)
    }
  }

  const validateForm = (data = formData) => {
    const newErrors = {}

    if (!data.name.trim()) {
      newErrors.name = "Nome da fazenda é obrigatório"
    }

    if (!data.area_total) {
      newErrors.area_total = "Área total é obrigatória"
    } else if (isNaN(data.area_total) || parseFloat(data.area_total) <= 0) {
      newErrors.area_total = "Área deve ser um número positivo"
    }

    if (!data.municipio.trim()) {
      newErrors.municipio = "Município é obrigatório"
    }

    if (!data.uf.trim()) {
      newErrors.uf = "UF é obrigatória"
    } else if (data.uf.length > 2) {
      newErrors.uf = "Use apenas a sigla (ex: SP)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const updatedFormData = await buscarEnderecoPorCep(formData)
    setFormData(updatedFormData)

    if (validateForm(updatedFormData)) {
      onSave(updatedFormData)
    }
  }

  const ufList = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
    "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
    "RS","RO","RR","SC","SP","SE","TO"
  ]

  const culturaList = [
    "Soja","Milho","Café","Cana-de-açúcar","Algodão",
    "Trigo","Arroz","Feijão","Pastagem","Eucalipto",
    "Laranja","Outros"
  ]

  return (
    <motion.div 
      className="profile-card farm-edit-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >

      <div className="card-header">
        <h3 className="personal-info-title">Editar Fazenda</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-fields">

           <div className="edit-form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancelar
            </button>

            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {/* Nome */}
          <div className="input-group">
            <label className="input-label">Nome da Fazenda</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`tech-input ${errors.name ? 'error' : ''}`}
              disabled={saving}
            />
          </div>
          {errors.name && <span className="error-message">{errors.name}</span>}

          {/* Área + Cultura */}
          <div className="input-row-tech">
            <div className="input-group">
              <label className="input-label">Área total (ha)</label>
              <input
                type="number"
                name="area_total"
                value={formData.area_total}
                onChange={handleChange}
                className={`tech-input ${errors.area_total ? 'error' : ''}`}
                step="0.1"
                min="0"
                disabled={saving}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Cultura</label>
              <select
                name="plantacao"
                value={formData.plantacao}
                onChange={handleChange}
                className="tech-select"
                disabled={saving}
              >
                <option value="">Selecione</option>
                {culturaList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Localização */}
          <div className="input-row-tech">
            <div className="input-group">
              <label className="input-label">Município</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                className={`tech-input ${errors.municipio ? 'error' : ''}`}
                disabled={saving}
              />
            </div>

            <div className="input-group">
              <label className="input-label">UF</label>
              <select
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                className={`tech-select ${errors.uf ? 'error' : ''}`}
                disabled={saving}
              >
                <option value="">Selecione</option>
                {ufList.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bairro + CEP */}
          <div className="input-row-tech">
            <div className="input-group">
              <label className="input-label">Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className="tech-input"
                disabled={saving}
              />
            </div>

            <div className="input-group">
              <label className="input-label">CEP</label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                onBlur={buscarEnderecoPorCep}
                className="tech-input"
                disabled={saving || cepLoading}
              />
              {cepLoading && <span className="error-message">Buscando CEP...</span>}
              {errors.cep && <span className="error-message">{errors.cep}</span>}
            </div>
          </div>

          {/* Telefone + Data */}
          <div className="input-row-tech">
            <div className="input-group">
              <label className="input-label">Telefone</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="tech-input"
                disabled={saving}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Data de aquisição</label>
              <input
                type="date"
                name="data_aquisicao"
                value={formData.data_aquisicao}
                onChange={handleChange}
                className="tech-input"
                disabled={saving}
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="input-group">
            <label className="input-label">Tipo de proprietário</label>
            <select
              name="tipo_proprietario"
              value={formData.tipo_proprietario}
              onChange={handleChange}
              className="tech-select"
              disabled={saving}
            >
              <option>Proprietário</option>
              <option>Arrendatário</option>
              <option>Parceiro</option>
              <option>Comodatário</option>
              <option>Outros</option>
            </select>
          </div>
         

        </div>
      </form>
    </motion.div>
  )
}

export default FarmEditForm
