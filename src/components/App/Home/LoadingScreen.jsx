// components/Home/LoadingScreen.jsx

import "../../../styles/App/LoadingScreen.css"

export default function LoadingScreen() {
  return (
    <div className="loading-screen">

      {/* Glow */}
      <div className="loading-glow"></div>

      {/* SVG LOGO */}
      <div className="logo-wrapper">

        <svg
          className="zenith-svg"
          viewBox="0 0 820 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >

          {/* Z */}
          <path
            className="draw-path"
            d="M40 40H130L40 140H130"
          />

          {/* E */}
          <path
            className="draw-path"
            d="M180 40V140M180 40H260M180 90H245M180 140H260"
          />

          {/* N */}
          <path
            className="draw-path"
            d="M310 140V40L400 140V40"
          />

          {/* I */}
          <path
            className="draw-path"
            d="M460 40V140"
          />

          {/* T */}
          <path
            className="draw-path"
            d="M520 40H620M570 40V140"
          />

          {/* H */}
          <path
            className="draw-path"
            d="M680 40V140M680 90H770M770 40V140"
          />

        </svg>

      </div>

      {/* Texto */}
      <p className="loading-text">
        Inicializando sistema...
      </p>

    </div>
  )
}