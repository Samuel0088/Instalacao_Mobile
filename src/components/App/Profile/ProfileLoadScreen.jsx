// components/Profile/ProfileLoadingScreen.jsx
export default function ProfileLoadingScreen() {
  return (
    <div className="profile-loading-screen">
      <div className="profile-loading-content">
        <div className="profile-loading-logo">
          <span className="material-symbols-outlined">agriculture</span>
          <div className="profile-loading-logo-glow"></div>
        </div>
        <div className="profile-loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p>Carregando seu perfil...</p>
        <span className="profile-loading-subtitle">Agricultura de Precisão</span>
      </div>
    </div>
  )
}