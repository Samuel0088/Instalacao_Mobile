// components/Profile/ProfileActions.jsx
export default function ProfileActions({ 
  editing, 
  saving, 
  onEdit, 
  onSave, 
  onCancel, 
  onLogout 
}) {
  if (!editing) {
    return (
      <div className="profile-actions-tech">
        <button className="action-btn primary" onClick={onEdit}>
          <div className="btn-glow"></div>
          <span className="material-symbols-outlined">edit</span>
          <span>Editar Perfil</span>
          <div className="btn-progress"></div>
        </button>
        
        <button className="action-btn danger" onClick={onLogout}>
          <div className="btn-glow"></div>
          <span className="material-symbols-outlined">logout</span>
          <span>Sair</span>
          <div className="btn-progress"></div>
        </button>
      </div>
    )
  }

  return (
    <div className="profile-actions-tech">
      <button 
        className="action-btn primary" 
        onClick={onSave}
        disabled={saving}
      >
        <div className="btn-glow"></div>
        {saving ? (
          <>
            <div className="btn-spinner"></div>
            <span>Salvando...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">save</span>
             <br />
            <span>Salvar Alterações</span>
          </>
        )}
        <div className="btn-progress" style={{ width: saving ? '100%' : '0%' }}></div>
      </button>
      
      <button className="action-btn secondary" onClick={onCancel}>
        <div className="btn-glow"></div>
        <span className="material-symbols-outlined">close</span>
        <span>Cancelar</span>
        <div className="btn-progress"></div>
      </button>
    </div>
  )
}