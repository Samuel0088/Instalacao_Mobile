// components/Profile/ProfileEditForm.jsx
import { ACCOUNT_ROLES } from "../../../services/accessControl"

const profileIcons = ["👨‍🌾", "🚜", "🌱", "🌽", "🌻", "🐄", "🐓", "🍎", "🌾", "🧑‍🌾", "🌿", "🍊", "🐝", "🚛", "🏡"]

export default function ProfileEditForm({ formData, onChange, onIconSelect }) {
  return (
    <div className="profile-card glass edit-card">
      <div className="card-corner"></div>
      <div className="card-header">
        <div className="header-icon">
          <span className="material-symbols-outlined">edit</span>
          <div className="icon-glow"></div>
        </div>
        <h3 className="personal-info-title">Editar Perfil</h3>
        <div className="header-line"></div>
      </div>
      
      <div className="card-content">
        {/* Icon Selector */}
        <div className="icon-selector-tech">
          <label>
            <span className="material-symbols-outlined">emoji_emotions</span>
            Escolha seu ícone
          </label>
          <div className="icon-grid-tech">
            {profileIcons.map((icon, index) => (
              <button
                key={index}
                className={`icon-option-tech ${formData.profileIcon === icon ? 'selected' : ''}`}
                onClick={() => onIconSelect(icon)}
                type="button"
              >
                {icon}
                {formData.profileIcon === icon && <div className="icon-selected-glow"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="form-fields">
          <div className="input-group">
            <span className="material-symbols-outlined">manage_accounts</span>
            <input
              className="tech-input"
              name="name"
              value={formData.name}
              placeholder="Nome completo"
              onChange={onChange}
            />
            <div className="input-glow"></div>
          </div>

          <div className="input-group">
            <span className="material-symbols-outlined">cake</span>
            <input
              className="tech-input"
              type="number"
              name="age"
              value={formData.age}
              placeholder="Idade"
              min="0"
              max="120"
              onChange={onChange}
            />
            <div className="input-glow"></div>
          </div>

          <div className="input-group">
            <span className="material-symbols-outlined">call</span>
            <input
              className="tech-input"
              name="phone"
              value={formData.phone}
              placeholder="Telefone"
              onChange={onChange}
            />
            <div className="input-glow"></div>
          </div>

          <div className="input-group">
            <span className="material-symbols-outlined">badge</span>
            <select
              className="tech-select"
              name="role"
              value={formData.role || ACCOUNT_ROLES.ADMIN}
              onChange={onChange}
            >
              <option value={ACCOUNT_ROLES.ADMIN}>Administrador / Chefe</option>
              <option value={ACCOUNT_ROLES.EMPLOYEE}>Funcionário</option>
              <option value={ACCOUNT_ROLES.COLLABORATOR}>Colaborador</option>
            </select>
            <div className="input-glow"></div>
          </div>

          <div className="input-group">
            <span className="material-symbols-outlined">assignment_ind</span>
            <select
              className="tech-select"
              name="type"
              value={formData.type}
              onChange={onChange}
            >
              <option value="">Tipo de proprietário</option>
              <option value="CPF">Pessoa Física (CPF)</option>
              <option value="PJ">Pessoa Jurídica (CNPJ)</option>
            </select>
            <div className="input-glow"></div>
          </div>

          {formData.type && (
            <div className="input-group">
              <span className="material-symbols-outlined">assignment_ind</span>
              <input
                className="tech-input"
                name="document"
                value={formData.document}
                placeholder={formData.type === "CPF" ? "CPF" : "CNPJ"}
                maxLength={formData.type === "CPF" ? 11 : 14}
                onChange={onChange}
              />
              <div className="input-glow"></div>
            </div>
          )}

          <div className="input-group">
            <span className="material-symbols-outlined">square_foot</span>
            <input
              className="tech-input"
              type="number"
              name="hectares"
              value={formData.hectares}
              placeholder="Hectares totais"
              min="0"
              step="0.1"
              onChange={onChange}
            />
            <div className="input-glow"></div>
          </div>

          <div className="input-row-tech">
            <div className="input-group">
              <span className="material-symbols-outlined">location_city</span>
              <input
                className="tech-input"
                name="city"
                value={formData.city}
                placeholder="Cidade"
                onChange={onChange}
              />
              <div className="input-glow"></div>
            </div>
            <div className="input-group small">
              <span className="material-symbols-outlined">pin</span>
              <input
                className="tech-input"
                name="state"
                value={formData.state}
                placeholder="UF"
                maxLength="2"
                onChange={onChange}
              />
              <div className="input-glow"></div>
            </div>
          </div>
        </div>

        <div className="info-note">
          <span className="material-symbols-outlined">info</span>
          <p>Estas informações serão usadas como padrão para novas propriedades</p>
        </div>
      </div>
    </div>
  )
}
