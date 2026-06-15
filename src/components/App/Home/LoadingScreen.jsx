// components/Home/LoadingScreen.jsx

import "../../../styles/App/LoadingScreen.css"

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-status-bar" aria-hidden="true">
        <span>9:41</span>
        <div>
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>

      <h1 className="loading-brand">Zenith</h1>
      <div className="loading-home-indicator" aria-hidden="true"></div>
    </div>
  )
}
