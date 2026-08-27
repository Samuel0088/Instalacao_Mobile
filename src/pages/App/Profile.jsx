// Profile.jsx - Versão Tecnológica com Componentes
import { useState, useEffect } from "react"
import { auth, db } from "../../services/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { sendPasswordResetEmail } from "firebase/auth"

import FarmEditForm from "../../components/App/Profile/FarmEditForm"
// Componentes
import ProfileLoadingScreen from "../../components/App/Profile/ProfileLoadScreen"
import AlertMessage from "../../components/App/Profile/AlertMessage"
import PersonalInfoView from "../../components/App/Profile/PersonalInfoView"
import FarmInfoView from "../../components/App/Profile/FarmInfoView"
import ProfileEditForm from "../../components/App/Profile/ProfileEditForm"
import MenuBar from "../../components/App/Global/MenuBar"
import { ACCOUNT_ROLES } from "../../services/accessControl"

// CSS
import "../../styles/App/Profile.css"

export default function Profile() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [farmData, setFarmData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(null)
  const [farmCount, setFarmCount] = useState(null)
  const [totalFarmArea, setTotalFarmArea] = useState(null)
  const [editingFarm, setEditingFarm] = useState(false)
  const [savingFarm, setSavingFarm] = useState(false)
  const [passwordResetting, setPasswordResetting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    type: "",
    document: "",
    hectares: "",
    email: "",
    role: ACCOUNT_ROLES.ADMIN,
    profileIcon: "👨‍🌾",
    phone: "",
    city: "",
    state: ""
  })
  const [alertMessage, setAlertMessage] = useState({ type: "", text: "" })
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await loadUserData(currentUser.uid)
        await loadFarmData(currentUser.uid)
      } else {
        navigate("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData(data)
        setFormData({
          name: data.name || "",
          age: data.age || "",
          type: data.type || "",
          document: data.document || "",
          hectares: data.hectares || "",
          email: data.email || "",
          role: data.role || ACCOUNT_ROLES.ADMIN,
          profileIcon: data.profileIcon || "👨‍🌾",
          phone: data.phone || "",
          city: data.city || "",
          state: data.state || ""
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      showAlert("error", "Erro ao carregar perfil")
    }
  }

  const loadFarmData = async (uid) => {
    try {
      const farmsRef = collection(db, "farms")
      const q = query(farmsRef, where("ownerId", "==", uid))
      const querySnapshot = await getDocs(q)
      setFarmCount(querySnapshot.size)
      setTotalFarmArea(querySnapshot.docs.reduce((total, farmDoc) => {
        const area = Number(farmDoc.data().area_total)
        return Number.isFinite(area) ? total + area : total
      }, 0))

      if (!querySnapshot.empty) {
        const farmDoc = querySnapshot.docs[0]
        const data = farmDoc.data()
        
        setFarmData({
          id: farmDoc.id,
          name: data.name || "",
          area_total: data.area_total || "0",
          bairro: data.bairro || "",
          cep: data.cep || "",
          createdAt: data.createdAt || null,
          data_aquisicao: data.data_aquisicao || "",
          municipio: data.municipio || "",
          plantacao: data.plantacao || "",
          telefone: data.telefone || "",
          tipo_proprietario: data.tipo_proprietario || "",
          uf: data.uf || ""
        })
      } else {
        setFarmData(null)
      }
    } catch (error) {
      console.error("Erro ao carregar fazenda:", error)
      setFarmCount(null)
      setTotalFarmArea(null)
      showAlert("error", "Erro ao carregar dados da fazenda")
    }
  }

  const showAlert = (type, text) => {
    setAlertMessage({ type, text })
    setTimeout(() => setAlertMessage({ type: "", text: "" }), 3000)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleIconSelect = (icon) => {
    setFormData({ ...formData, profileIcon: icon })
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        name: formData.name,
        age: parseInt(formData.age) || null,
        type: formData.type,
        document: formData.document,
        role: formData.role || ACCOUNT_ROLES.ADMIN,
        hectares: parseFloat(formData.hectares) || null,
        profileIcon: formData.profileIcon,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        updatedAt: new Date().toISOString()
      })

      showAlert("success", "Perfil atualizado com sucesso! 🌱")
      setEditing(false)
      await loadUserData(user.uid)
      window.dispatchEvent(new Event("zenith-user-role-updated"))
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      showAlert("error", "Erro ao atualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFarm = async (updatedFarmData) => {
  if (!user || !farmData?.id) return

  setSavingFarm(true)
  try {
    const farmRef = doc(db, "farms", farmData.id)
    await updateDoc(farmRef, {
      name: updatedFarmData.name,
      area_total: parseFloat(updatedFarmData.area_total) || 0,
      plantacao: updatedFarmData.plantacao || "",
      municipio: updatedFarmData.municipio,
      uf: updatedFarmData.uf,
      bairro: updatedFarmData.bairro || "",
      cep: updatedFarmData.cep || "",
      data_aquisicao: updatedFarmData.data_aquisicao || "",
      telefone: updatedFarmData.telefone || "",
      tipo_proprietario: updatedFarmData.tipo_proprietario || "Proprietário",
      updatedAt: new Date().toISOString()
    })

    showAlert("success", "Fazenda atualizada com sucesso! 🌱")
    setEditingFarm(false)
    await loadFarmData(user.uid)
  } catch (error) {
    console.error("Erro ao atualizar fazenda:", error)
    showAlert("error", "Erro ao atualizar fazenda")
  } finally {
    setSavingFarm(false)
  }
}

  const handleLogout = async () => {
    try {
      await auth.signOut()
      navigate("/login")
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  const handleAddFarm = () => {
    navigate("/cadastrar-fazenda")
  }

  const handleEditFarm = () => {
  setEditingFarm(true)
}

  const calculateMemberTime = () => {
    const accountCreatedAt = userData?.createdAt || user?.metadata?.creationTime
    if (!accountCreatedAt) return null
    const created = accountCreatedAt?.toDate
      ? accountCreatedAt.toDate()
      : new Date(accountCreatedAt)
    if (Number.isNaN(created.getTime())) return null
    const now = new Date()
    const diffTime = Math.max(0, now - created)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "menos de um dia"
    if (diffDays === 1) return "1 dia"
    if (diffDays < 30) return `${diffDays} dias`
    if (diffDays < 60) return "1 mês"
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`
    if (diffDays < 730) return "1 ano"
    return `${Math.floor(diffDays / 365)} anos`
  }

  const handlePasswordReset = async () => {
    if (!user?.email || passwordResetting) return

    setPasswordResetting(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      showAlert("success", "Enviamos um link para alterar sua senha no e-mail cadastrado.")
    } catch (error) {
      console.error("Erro ao enviar redefinição de senha:", error)
      showAlert("error", "Não foi possível enviar o link para alterar a senha.")
    } finally {
      setPasswordResetting(false)
    }
  }

  const openProfileEditor = () => {
    setActiveTab(null)
    setEditingFarm(false)
    setEditing(true)
  }

  const getTotalHectares = () => {
    if (totalFarmArea !== null && farmCount > 0) {
      return totalFarmArea.toFixed(1)
    }
    if (farmCount === 0 && userData?.hectares !== undefined && userData?.hectares !== null) {
      const userArea = Number(userData.hectares)
      if (Number.isFinite(userArea)) return userArea.toFixed(1)
    }
    return null
  }

  const formatPhone = (phone) => {
    if (!phone) return "Não informado"
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    } else if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return phone
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setFormData({
      name: userData?.name || "",
      age: userData?.age || "",
      type: userData?.type || "",
      document: userData?.document || "",
      hectares: userData?.hectares || "",
      email: user?.email || "",
      role: userData?.role || ACCOUNT_ROLES.ADMIN,
      profileIcon: userData?.profileIcon || "👨‍🌾",
      phone: userData?.phone || "",
      city: userData?.city || "",
      state: userData?.state || ""
    })
  }

  const roleLabels = {
    [ACCOUNT_ROLES.ADMIN]: "Conta administradora",
    [ACCOUNT_ROLES.EMPLOYEE]: "Conta de funcionário",
    [ACCOUNT_ROLES.COLLABORATOR]: "Conta de colaborador"
  }

  const displayName = userData?.name || user?.displayName || "Agricultor"
  const profileInitial = displayName.trim().charAt(0).toLocaleUpperCase("pt-BR") || "A"
  const membershipTime = calculateMemberTime()
  const totalHectares = getTotalHectares()
  const userAge = Number(userData?.age)
  const hasValidAge = Number.isInteger(userAge) && userAge > 0

  if (loading) {
    return <ProfileLoadingScreen />
  }

  return (
    <>
      <div className="profile-container-tech profile-redesign" data-system-bar-color="#f4f9ef">
        <header className="profile-overview-hero">
          <div>
            <h1>Perfil</h1>
            <p>Sua conta e propriedades</p>
          </div>
        </header>

        <section className="profile-identity-card" aria-label="Resumo da conta">
          <div className="profile-identity-avatar" aria-hidden="true">
            <span>{profileInitial}</span>
            <span className="profile-identity-verified material-symbols-outlined">verified</span>
          </div>
          <div className="profile-identity-copy">
            <h2>{displayName}</h2>
            <p>
              <span className="material-symbols-outlined" aria-hidden="true">eco</span>
              {membershipTime ? `Membro há ${membershipTime}` : "Data de cadastro não informada"}
            </p>
            <span className="profile-account-type">
              <span className="material-symbols-outlined" aria-hidden="true">person</span>
              {roleLabels[userData?.role] || "Conta pessoal"}
            </span>
          </div>
          <span className="profile-identity-leaf material-symbols-outlined" aria-hidden="true">eco</span>
        </section>

        <section className="profile-summary" aria-labelledby="profile-summary-title">
          <div className="profile-section-title">
            <span className="material-symbols-outlined" aria-hidden="true">eco</span>
            <h2 id="profile-summary-title">Resumo da conta</h2>
          </div>
          <div className="profile-summary-grid">
            <article>
              <span className="material-symbols-outlined" aria-hidden="true">potted_plant</span>
              <strong>{totalHectares ? totalHectares.replace(".", ",") : "--"}</strong>
              <small>hectares</small>
            </article>
            <article>
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              <strong>{hasValidAge ? userAge : "--"}</strong>
              <small>anos</small>
            </article>
            <article className="farm-stat">
              <span className="material-symbols-outlined" aria-hidden="true">home_work</span>
              <strong>{farmCount ?? "--"}</strong>
              <small>{farmCount === 1 ? "fazenda" : "fazendas"}</small>
            </article>
          </div>
        </section>

        <AlertMessage type={alertMessage.type} text={alertMessage.text} />

        <section className="profile-settings" aria-labelledby="profile-settings-title">
          <div className="profile-section-title">
            <span className="material-symbols-outlined" aria-hidden="true">settings</span>
            <h2 id="profile-settings-title">Conta e configurações</h2>
          </div>
          <div className="profile-settings-list">
            <div className={`profile-setting-item ${activeTab === "pessoal" ? "is-open" : ""}`}>
              <button
                type="button"
                aria-expanded={activeTab === "pessoal"}
                onClick={() => {
                  if (editing) handleCancelEdit()
                  setEditingFarm(false)
                  setActiveTab(activeTab === "pessoal" ? null : "pessoal")
                }}
              >
                <span className="profile-setting-icon material-symbols-outlined" aria-hidden="true">person</span>
                <span><strong>Informações pessoais</strong><small>Seus dados e preferências da conta</small></span>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {activeTab === "pessoal" ? "expand_more" : "chevron_right"}
                </span>
              </button>
              {activeTab === "pessoal" && (
                <section className="profile-expanded-content">
                  <PersonalInfoView
                    userData={userData}
                    user={user}
                    onEdit={openProfileEditor}
                    onChangePassword={handlePasswordReset}
                    passwordResetting={passwordResetting}
                  />
                </section>
              )}
            </div>

            <div className={`profile-setting-item ${activeTab === "fazenda" ? "is-open" : ""}`}>
              <button
                type="button"
                aria-expanded={activeTab === "fazenda"}
                onClick={() => {
                  if (editing) handleCancelEdit()
                  setEditingFarm(false)
                  setActiveTab(activeTab === "fazenda" ? null : "fazenda")
                }}
              >
                <span className="profile-setting-icon material-symbols-outlined" aria-hidden="true">agriculture</span>
                <span><strong>Fazenda</strong><small>Consulte os dados da propriedade</small></span>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {activeTab === "fazenda" ? "expand_more" : "chevron_right"}
                </span>
              </button>
              {activeTab === "fazenda" && (
                <section className="profile-expanded-content">
                  {!editingFarm ? (
                    <FarmInfoView farmData={farmData} onAddFarm={handleAddFarm} onEditFarm={handleEditFarm} formatPhone={formatPhone} />
                  ) : (
                    <FarmEditForm farmData={farmData} onSave={handleSaveFarm} onCancel={() => setEditingFarm(false)} saving={savingFarm} />
                  )}
                </section>
              )}
            </div>

            <div className={`profile-setting-item ${editing ? "is-open" : ""}`}>
              <button
                type="button"
                aria-expanded={editing}
                onClick={() => {
                  if (editing) {
                    handleCancelEdit()
                  } else {
                    setEditing(true)
                  }
                  setEditingFarm(false)
                  setActiveTab(null)
                }}
              >
                <span className="profile-setting-icon material-symbols-outlined" aria-hidden="true">edit</span>
                <span><strong>Editar perfil</strong><small>Atualize suas informações</small></span>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {editing ? "expand_more" : "chevron_right"}
                </span>
              </button>
              {editing && (
                <section className="profile-expanded-content">
                  <ProfileEditForm formData={formData} onChange={handleChange} onIconSelect={handleIconSelect} />
                  <div className="profile-edit-actions">
                    <button type="button" onClick={handleSave} disabled={saving}>
                      <span className="material-symbols-outlined" aria-hidden="true">save</span>
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                    <button type="button" className="cancel" onClick={handleCancelEdit}>Cancelar</button>
                  </div>
                </section>
              )}
            </div>

            <div className="profile-setting-item">
              <button type="button" className="logout" onClick={handleLogout}>
                <span className="profile-setting-icon material-symbols-outlined" aria-hidden="true">logout</span>
                <span><strong>Sair</strong><small>Encerrar sessão nesta conta</small></span>
                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <MenuBar />
    </>
  )
}
