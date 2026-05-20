// components/Profile/ProfileHeader.jsx
export default function ProfileHeader({ 
  profileIcon, 
  userName, 
  memberTime, 
  editing, 
  onAvatarClick 
}) {
  return (
    <div className="profile-header-section">
      <div className="profile-header-glow"></div>
      <div className="profile-header-content">
        <div 
          className={`profile-avatar-container ${editing ? 'editing' : ''}`}
          onClick={onAvatarClick}
        >
          <div className="profile-avatar-ring"></div>
          <div className="profile-avatar-ring-2"></div>
          <div className="profile-avatar">
            <span>{profileIcon}</span>
          </div>
          {editing && (
            <div className="profile-avatar-edit-badge">
              <span className="material-symbols-outlined">edit</span>
              <div className="badge-glow"></div>
            </div>
          )}
        </div>
        
        <div className="profile-title-wrapper">
          <h1 className="profile-title">
            {userName || "Agricultor"}
            <div className="title-underline"></div>
          </h1>
          <div className="profile-badge-tech">
            <span className="material-symbols-outlined">eco</span>
            <span className="membro">Membro há {memberTime}</span>
            <div className="badge-glow"></div>
          </div>
        </div>
      </div>
    </div>
  )
}