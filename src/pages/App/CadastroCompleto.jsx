import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../services/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, addDoc, collection } from "firebase/firestore"
import "../../styles/App/CadastroCompleto.css"

export default function CadastroCompleto() {
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(1) // 1 = dados pessoais, 2 = dados da fazenda
  const [loading, setLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState({ type: "", text: "" })
  const [userId, setUserId] = useState(null)

 

  // Dados do usuário (Etapa 1)
  const [userData, setUserData] = useState({
    name: "",
    age: "",
    type: "",
    document: "",
    email: "",
    password: ""
  })

  // Dados da fazenda (Etapa 2)
  const [farmData, setFarmData] = useState({
    name: "",
    tipo_proprietario: "",
    data_aquisicao: "",
    cep: "",
    bairro: "",
    municipio: "",
    uf: "",
    area_total: "",
    telefone: "",
    plantacao: ""
  })

 const buscarCEP = async (cep) => {
  const cepLimpo = cep.replace(/\D/g, "")

  if (cepLimpo.length !== 8) return

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await response.json()

    if (!data.erro) {
      setFarmData((prev) => ({
        ...prev,
        bairro: data.bairro || "",
        municipio: data.localidade || "",
        uf: data.uf || ""
      }))
    }

  } catch (error) {
    console.error("Erro ao buscar CEP:", error)
  }
}
  // Handles
  const handleUserChange = (e) => {
    const { name, value } = e.target
    setUserData({ ...userData, [name]: value })
    setAlertMessage({ type: "", text: "" })
  }

  const handleFarmChange = (e) => {
    const { name, value } = e.target
    setFarmData({ ...farmData, [name]: value })
  }

  // Validação Etapa 1
  const validateUserData = () => {
    if (!userData.name || !userData.age || !userData.type || !userData.document || !userData.email || !userData.password) {
      setAlertMessage({ type: "error", text: "Preencha todos os campos do agricultor!" })
      return false
    }
    if (userData.password.length < 6) {
      setAlertMessage({ type: "error", text: "A senha deve ter pelo menos 6 caracteres" })
      return false
    }
    return true
  }

  // Validação Etapa 2
  const validateFarmData = () => {
    if (!farmData.name || !farmData.tipo_proprietario || !farmData.data_aquisicao || 
        !farmData.cep || !farmData.bairro || !farmData.municipio || !farmData.uf || 
        !farmData.area_total || !farmData.telefone || !farmData.plantacao) {
      setAlertMessage({ type: "error", text: "Preencha todos os dados da fazenda!" })
      return false
    }
    return true
  }

  // Criar usuário no Firebase
  const handleCreateUser = async () => {
    if (!validateUserData()) return

    setLoading(true)
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )

      // Salva dados do usuário
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: userData.name,
        age: parseInt(userData.age),
        type: userData.type,
        document: userData.document,
        email: userData.email,
        hectares: 0, // será atualizado com a fazenda
        createdAt: new Date().toISOString(),
        profileIcon: "👨‍🌾"
      })

      setUserId(userCred.user.uid)
      setAlertMessage({ type: "success", text: "Usuário criado! Agora cadastre sua fazenda 🌱" })
      
      // Vai para etapa 2
      setTimeout(() => {
        setEtapa(2)
        setAlertMessage({ type: "", text: "" })
      }, 1500)

    } catch (error) {
      let errorMessage = "Erro no cadastro. Tente novamente!"
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este email já está cadastrado!"
      }
      setAlertMessage({ type: "error", text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  // Salvar fazenda
  const handleSaveFarm = async () => {
    if (!validateFarmData()) return

    setLoading(true)
    try {
      // Salva fazenda
      await addDoc(collection(db, "farms"), {
        ...farmData,
        ownerId: userId,
        ownerName: userData.name,
        area_total: farmData.area_total,
        createdAt: new Date()
      })

      // Atualiza hectares do usuário
      await setDoc(doc(db, "users", userId), {
        hectares: parseFloat(farmData.area_total)
      }, { merge: true })

      setAlertMessage({ type: "success", text: "Fazenda cadastrada com sucesso! 🌾" })
      
      setTimeout(() => {
        navigate("/home")
      }, 2000)

    } catch (error) {
      console.error(error)
      setAlertMessage({ type: "error", text: "Erro ao cadastrar fazenda" })
    } finally {
      setLoading(false)
    }
  }

  // Render Etapa 1
  const renderEtapa1 = () => (
    <>
      <div className="cadastro-header">
        <div className="etapa-indicador">
          <span className="etapa ativa">1</span>
          <span className="etapa-linha"></span>
          <span className="etapa">2</span>
        </div>
        <h2>Dados do Agricultor</h2>
        <p className="cadastro-subtitle">Primeiro, conte-nos sobre você</p>
      </div>

      <div className="cadastro-form">
        <div className="input-group">
          <label>Nome Completo</label>
          <input
            type="text"
            name="name"
            value={userData.name}
            onChange={handleUserChange}
            placeholder="Nome completo"
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Idade</label>
            <input
              type="number"
              name="age"
              value={userData.age}
              onChange={handleUserChange}
              placeholder="Sua idade"
            />
          </div>

          <div className="input-group">
            <label>Tipo</label>
            <select name="type" value={userData.type} onChange={handleUserChange}>
              <option value="">Selecione</option>
              <option value="CPF">Pessoa Física (CPF)</option>
              <option value="PJ">Pessoa Jurídica (CNPJ)</option>
            </select>
          </div>
        </div>

        {userData.type && (
          <div className="input-group">
            <label>{userData.type === "CPF" ? "CPF" : "CNPJ"}</label>
            <input
              type="text"
              name="document"
              value={userData.document}
              onChange={(e) => {
                const max = userData.type === "CPF" ? 14 : 19
                const value = e.target.value.slice(0, max)

                handleUserChange({
                  target: {
                    name: "document",
                    value
                  }
                })
              }}
              placeholder={userData.type === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleUserChange}
            placeholder="seu@email.com"
          />
        </div>

        <div className="input-group">
          <label>Senha</label>
          <input
            type="password"
            name="password"
            value={userData.password}
            onChange={handleUserChange}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {alertMessage.text && etapa === 1 && (
          <div className={`alert-message ${alertMessage.type}`}>
            {alertMessage.text}
          </div>
        )}

        <button 
          className="btn-next"
          onClick={handleCreateUser}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Criando conta...
            </>
          ) : (
            "Próximo →"
          )}
        </button>
      </div>
    </>
  )
  

  // Render Etapa 2
  const renderEtapa2 = () => (
    <>
      <div className="cadastro-header">
        <div className="etapa-indicador">
          <span className="etapa completa" onClick={() => setEtapa(1)}>✓</span>
          <span className="etapa-linha"></span>
          <span className="etapa ativa">2</span>
        </div>
        <h2>Dados da Fazenda</h2>
        <p className="cadastro-subtitle">Agora, conte-nos sobre sua propriedade</p>
      </div>

      <div className="cadastro-form">
        <div className="input-group">
          <label>Nome da Fazenda</label>
          <input
            type="text"
            name="name"
            value={farmData.name}
            onChange={handleFarmChange}
            placeholder="Ex: Fazenda Esperança"
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Tipo Proprietário</label>
            <select name="tipo_proprietario" value={farmData.tipo_proprietario} onChange={handleFarmChange}>
              <option value="">Selecione</option>
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="input-group">
            <label>Aquisição</label>
            <input
              type="date"
              name="data_aquisicao"
              value={farmData.data_aquisicao}
              onChange={handleFarmChange}
            />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>CEP</label>
           <input
            type="text"
            name="cep"
            value={farmData.cep}
            onChange={(e) => {
              handleFarmChange(e)
              buscarCEP(e.target.value)
            }}
            />
          </div>

          <div className="input-group">
            <label>UF</label>
            <input
              type="text"
              name="uf"
              value={farmData.uf}
              onChange={handleFarmChange}
              maxLength="2"
              placeholder="SP"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Bairro</label>
          <input
            type="text"
            name="bairro"
            value={farmData.bairro}
            onChange={handleFarmChange}
            placeholder="Bairro/Distrito"
          />
        </div>

        <div className="input-group">
          <label>Município</label>
          <input
            type="text"
            name="municipio"
            value={farmData.municipio}
            onChange={handleFarmChange}
            placeholder="Cidade"
          />
        </div>

        <div className="input-row">
         
            <div className="input-group">
            <label>Área Total (ha)</label>
            <select
              name="area_total"
              value={farmData.area_total}
              onChange={handleFarmChange}
            >
              <option value="">Selecione</option>
              <option value="1-6">1 - 6 ha</option>
              <option value="7-12">7 - 12 ha</option>
              <option value="13-20">13 - 20 ha</option>
              <option value="21-29">21 - 29 ha</option>
              <option value="30-40">30 - 40 ha</option>
            </select>
         </div>

          <div className="input-group">
            <label>Telefone</label>
            <input
              type="text"
              name="telefone"
              value={farmData.telefone}
              onChange={handleFarmChange}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Principal Plantação</label>
          <select name="plantacao" value={farmData.plantacao} onChange={handleFarmChange}>
            <option value="">Selecione</option>
            <option value="Soja">Soja</option>
            <option value="Tomate">Tomate</option>
            <option value="Café">Café</option>
            <option value="Milho">Milho</option>
            <option value="Feijão">Feijão</option>
          </select>
        </div>

        {alertMessage.text && etapa === 2 && (
          <div className={`alert-message ${alertMessage.type}`}>
            {alertMessage.text}
          </div>
        )}

        <div className="botoes-container">
          <button 
            className="btn-voltar"
            onClick={() => setEtapa(1)}
          >
            ← Voltar
          </button>

          <button 
            className="btn-finalizar"
            onClick={handleSaveFarm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Cadastrando...
              </>
            ) : (
              "Finalizar Cadastro 🌾"
            )}
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="cadastro-completo-container">
      {/* Background Layers */}
      <div className="cadastro-background-layer cadastro-background-layer-1"></div>
      <div className="cadastro-background-layer cadastro-background-layer-2"></div>
      <div className="cadastro-background-overlay"></div>
      
      {/* Gradient Spheres */}
      <div className="cadastro-gradient-sphere cadastro-gradient-sphere-1"></div>
      <div className="cadastro-gradient-sphere cadastro-gradient-sphere-2"></div>

      {/* Grid Pattern */}
      <div className="cadastro-grid-pattern"></div>

      {/* Card Principal */}
      <div className="cadastro-card">
        <div className="cadastro-card-glow"></div>
        <div className="cadastro-card-pattern"></div>

        {etapa === 1 ? renderEtapa1() : renderEtapa2()}
<br />
      </div>
    </div>
  )
}