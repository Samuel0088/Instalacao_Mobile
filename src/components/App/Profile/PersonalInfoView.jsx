const ROLE_LABELS = {
  admin: "Produtor / Gestor",
  employee: "Funcionário",
  collaborator: "Colaborador",
}

export default function PersonalInfoView({
  userData,
  user,
  onEdit,
  onChangePassword,
  passwordResetting,
}) {
  const displayName = userData?.name || user?.displayName || "Nome não informado"
  const initial = displayName === "Nome não informado"
    ? "?"
    : displayName.trim().charAt(0).toLocaleUpperCase("pt-BR")
  const location = [userData?.city, userData?.state].filter(Boolean).join(" - ")

  const infoItems = [
    { icon: "person", label: "Nome completo", value: userData?.name },
    { icon: "mail", label: "E-mail", value: user?.email },
    { icon: "call", label: "Telefone", value: userData?.phone },
    { icon: "location_on", label: "Localização", value: location },
    { icon: "badge", label: "Função", value: ROLE_LABELS[userData?.role] },
  ]

  return (
    <div className="personal-details">
      <div className="personal-account-summary">
        <div className="personal-account-avatar" aria-hidden="true">{initial}</div>
        <div className="personal-account-copy">
          <strong>{displayName}</strong>
          <span className={user?.emailVerified ? "is-verified" : "is-pending"}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {user?.emailVerified ? "verified_user" : "info"}
            </span>
            {user?.emailVerified ? "Conta verificada" : "E-mail não verificado"}
          </span>
        </div>
      </div>

      <div className="personal-data-list">
        {infoItems.map((item) => (
          <button type="button" className="personal-data-row" key={item.label} onClick={onEdit}>
            <span className="personal-data-icon material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            <span className="personal-data-copy">
              <small>{item.label}</small>
              <strong>{item.value || "Não informado"}</strong>
            </span>
            <span className="personal-data-action material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
        ))}

        <button
          type="button"
          className="personal-data-row password-row"
          onClick={onChangePassword}
          disabled={passwordResetting}
        >
          <span className="personal-data-icon material-symbols-outlined" aria-hidden="true">shield</span>
          <span className="personal-data-copy">
            <small>Segurança</small>
            <strong>{passwordResetting ? "Enviando e-mail..." : "Alterar senha"}</strong>
          </span>
          <span className="personal-data-action material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
