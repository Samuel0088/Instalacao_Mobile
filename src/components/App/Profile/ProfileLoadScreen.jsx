// components/Profile/ProfileLoadingScreen.jsx
import DroneIcon from "../Global/DroneIcon"

export default function ProfileLoadingScreen({ message = "Carregando seu perfil..." }) {
  return (
    <div className="profile-loading-screen">
      <div className="profile-loading-content">
        <div className="profile-loading-logo">
          <DroneIcon className="profile-loading-drone-icon" />
          <div className="profile-loading-logo-glow"></div>
        </div>
        <div className="profile-loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p>{message}</p>
        <span className="profile-loading-subtitle">Agricultura de Precisão</span>
      </div>
    </div>
  )
}
