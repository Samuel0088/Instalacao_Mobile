// CadastroCompleto.jsx

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../services/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, addDoc, collection } from "firebase/firestore"
import "../../styles/App/CadastroCompleto.css"

export default function CadastroCompleto() {
  const navigate = useNavigate()

  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState({
    type: "",
    text: "",
  })

  const [userId, setUserId] = useState(null)

  const [userData, setUserData] = useState({
    name: "",
    age: "",
    type: "",
    document: "",
    email: "",
    password: "",
  })

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
    plantacao: "",
  })

  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "")

    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      )

      const data = await response.json()

      if (!data.erro) {
        setFarmData((prev) => ({
          ...prev,
          bairro: data.bairro || "",
          municipio: data.localidade || "",
          uf: data.uf || "",
        }))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleUserChange = (e) => {
    const { name, value } = e.target

    setUserData({
      ...userData,
      [name]: value,
    })

    setAlertMessage({
      type: "",
      text: "",
    })
  }

  const handleFarmChange = (e) => {
    const { name, value } = e.target

    setFarmData({
      ...farmData,
      [name]: value,
    })
  }

  const validateUserData = () => {
    if (
      !userData.name ||
      !userData.age ||
      !userData.type ||
      !userData.document ||
      !userData.email ||
      !userData.password
    ) {
      setAlertMessage({
        type: "error",
        text: "Preencha todos os campos.",
      })

      return false
    }

    if (userData.password.length < 6) {
      setAlertMessage({
        type: "error",
        text: "Senha mínima de 6 caracteres.",
      })

      return false
    }

    return true
  }

  const validateFarmData = () => {
    if (
      !farmData.name ||
      !farmData.tipo_proprietario ||
      !farmData.data_aquisicao ||
      !farmData.cep ||
      !farmData.bairro ||
      !farmData.municipio ||
      !farmData.uf ||
      !farmData.area_total ||
      !farmData.telefone ||
      !farmData.plantacao
    ) {
      setAlertMessage({
        type: "error",
        text: "Preencha os dados da fazenda.",
      })

      return false
    }

    return true
  }

  const handleCreateUser = async () => {
    if (!validateUserData()) return

    setLoading(true)

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )

      await setDoc(doc(db, "users", userCred.user.uid), {
        name: userData.name,
        age: parseInt(userData.age),
        type: userData.type,
        document: userData.document,
        email: userData.email,
        hectares: 0,
        createdAt: new Date().toISOString(),
      })

      setUserId(userCred.user.uid)

      setAlertMessage({
        type: "success",
        text: "Conta criada com sucesso 🌱",
      })

      setTimeout(() => {
        setEtapa(2)

        setAlertMessage({
          type: "",
          text: "",
        })
      }, 1200)
    } catch (error) {
      let errorMessage = "Erro ao criar conta."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso."
      }

      setAlertMessage({
        type: "error",
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFarm = async () => {
    if (!validateFarmData()) return

    setLoading(true)

    try {
      await addDoc(collection(db, "farms"), {
        ...farmData,
        ownerId: userId,
        ownerName: userData.name,
        createdAt: new Date(),
      })

      await setDoc(
        doc(db, "users", userId),
        {
          hectares: parseFloat(farmData.area_total),
        },
        { merge: true }
      )

      setAlertMessage({
        type: "success",
        text: "Cadastro concluído 🌾",
      })

      setTimeout(() => {
        navigate("/home")
      }, 1800)
    } catch (error) {
      console.error(error)

      setAlertMessage({
        type: "error",
        text: "Erro ao cadastrar fazenda.",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDocument = (value, type) => {
    const numbers = value.replace(/\D/g, "")

    if (type === "CPF") {
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }

    return numbers
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  return (
    <div className="cadastro-page">

      <div className="cadastro-hero">
        <div className="login-hero__overlay" />

        <div className="login-hero__content">

          <div className="login-logo">
            <img
              className="logo-img"
              src="assets/image/Logo-redonda.png"
              alt=""
            />
          </div>

          <p className="login-hero__subtitle">
            Cadastre sua propriedade rural
          </p>

          <h1 className="login-hero__title">
            Cadastro
          </h1>

        </div>
      </div>

      <main className="cadastro-card">
        <div className="cadastro-header">

          <div className="etapa-indicador">

            <span
              className={`etapa ${etapa === 1 ? "ativa" : "completa"}`}
            >
              {etapa > 1 ? "✓" : "1"}
            </span>

            <span className="etapa-linha"></span>

            <span
              className={`etapa ${etapa === 2 ? "ativa" : ""}`}
            >
              2
            </span>

          </div>

          <h2>
            {etapa === 1
              ? "Dados do Agricultor"
              : "Dados da Fazenda"}
          </h2>

          <p className="cadastro-subtitle">
            {etapa === 1
              ? "Primeiro, conte-nos sobre você"
              : "Agora, conte-nos sobre sua propriedade"}
          </p>

        </div>

        {etapa === 1 && (
          <div className="cadastro-form">

            <div className="input-group">
              <label>Nome Completo</label>

              <input
                type="text"
                name="name"
                value={userData.name}
                onChange={handleUserChange}
                placeholder="Seu nome"
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

                <select
                  name="type"
                  value={userData.type}
                  onChange={handleUserChange}
                >
                  <option value="">Selecione</option>
                  <option value="CPF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>

            </div>

            {userData.type && (
              <div className="input-group">

                <label>
                  {userData.type === "CPF"
                    ? "CPF"
                    : "CNPJ"}
                </label>

                <input
                  type="text"
                  name="document"
                  value={userData.document}
                  onChange={(e) => {
                    const formatted = formatDocument(
                      e.target.value,
                      userData.type
                    )

                    handleUserChange({
                      target: {
                        name: "document",
                        value: formatted,
                      },
                    })
                  }}
                  placeholder={
                    userData.type === "CPF"
                      ? "000.000.000-00"
                      : "00.000.000/0000-00"
                  }
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
                placeholder="Sua senha"
              />
            </div>

            {alertMessage.text && (
              <div className={`alert-message ${alertMessage.type}`}>
                {alertMessage.text}
              </div>
            )}

            <button
              className="btn-next"
              onClick={handleCreateUser}
              disabled={loading}
            >
              {loading
                ? "Criando conta..."
                : "Próximo →"}
            </button>

            <button
              type="button"
              className="cadastro-login-back"
              onClick={() => navigate("/login")}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar para login
            </button>

          </div>
        )}

        {etapa === 2 && (
          <div className="cadastro-form">

            <div className="input-group">
              <label>Nome da Fazenda</label>

              <input
                type="text"
                name="name"
                value={farmData.name}
                onChange={handleFarmChange}
                placeholder="Nome da fazenda"
              />
            </div>

            <div className="input-row">

              <div className="input-group">
                <label>Tipo Proprietário</label>

                <select
                  name="tipo_proprietario"
                  value={farmData.tipo_proprietario}
                  onChange={handleFarmChange}
                >
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
              />
            </div>

            <div className="input-group">
              <label>Município</label>

              <input
                type="text"
                name="municipio"
                value={farmData.municipio}
                onChange={handleFarmChange}
              />
            </div>

            <div className="input-row">

              <div className="input-group">
                <label>Área Total</label>

                <select
                  name="area_total"
                  value={farmData.area_total}
                  onChange={handleFarmChange}
                >
                  <option value="">Selecione</option>
                  <option value="1-6">1 - 6 ha</option>
                  <option value="7-12">7 - 12 ha</option>
                  <option value="13-20">13 - 20 ha</option>
                </select>
              </div>

              <div className="input-group">
                <label>Telefone</label>

                <input
                  type="text"
                  name="telefone"
                  value={farmData.telefone}
                  onChange={handleFarmChange}
                />
              </div>

            </div>

            <div className="input-group">
              <label>Principal Plantação</label>

              <select
                name="plantacao"
                value={farmData.plantacao}
                onChange={handleFarmChange}
              >
                <option value="">Selecione</option>
                <option value="Soja">Soja</option>
                <option value="Milho">Milho</option>
                <option value="Café">Café</option>
              </select>
            </div>

            {alertMessage.text && (
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
                {loading
                  ? "Finalizando..."
                  : "Finalizar Cadastro 🌾"}
              </button>

            </div>

          </div>
        )}

      </main>

    </div>
  )
}
