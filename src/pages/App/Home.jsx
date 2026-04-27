// Home.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../services/firebase"
import { getWeatherByCity } from "../../services/weatherService"
import { doc, getDoc, query, where, getDocs, collection } from "firebase/firestore"

// Componentes
import ParticleBackground from "../../components/App/Home/ParticleBackground"
import MouseGlow from "../../components/App/Home/MouseGlow"
import LoadingScreen from "../../components/App/Home/LoadingScreen"
import WelcomeSection from "../../components/App/Home/WelcomeSection"
import FarmInfoCard from "../../components/App/Home/FarmInfoCard"
import MetricsGrid from "../../components/App/Home/MetricsGrid"
import FlightActionButton from "../../components/App/Home/FlightActionButton"
import ActivitiesList from "../../components/App/Home/ActivitiesList"
import ExploreModules from "../../components/App/Home/ExploreModules"
import AppFooter from "../../components/App/Global/AppFooter"
import MenuBar from "../../components/App/Global/MenuBar"
import AppHeader from "../../components/App/Global/AppHeader"  

import "../../styles/App/Home.css"

export default function Home() {
  const [userData, setUserData] = useState(null)
  const [farmData, setFarmData] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setUserData(docSnap.data())
        }

        const q = query(
          collection(db, "farms"),
          where("ownerId", "==", user.uid)
        )

        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const farm = snapshot.docs[0].data()
          setFarmData(farm)

          if (farm.municipio && farm.uf) {
            const weatherData = await getWeatherByCity(farm.municipio, farm.uf)
            setWeather(weatherData)
          }
        } else {
          setFarmData(null)
          setWeather(null)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const hasFarm = !!farmData
  const userName = userData?.name?.split(' ')[0]

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <>
      <ParticleBackground />
      <MouseGlow />
      
      <AppHeader title="Zenith" showLogo={true} showNotification={true} />
      
      <div className="home-container">
        <WelcomeSection 
          userName={userName}
          hasFarm={hasFarm}
          farmName={farmData?.name}
          onRegister={() => navigate("/cadastrar-fazenda")}
        />

        {hasFarm && <FarmInfoCard farmData={farmData} />}

        <MetricsGrid hasFarm={hasFarm} weather={weather} farmData={farmData} />

        {hasFarm && (
          <FlightActionButton onNavigate={() => navigate("/novo-voo")} />
        )}

        <section className="activities-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="material-symbols-outlined">history</span>
              Atividades Recentes
            </h2>
            {hasFarm && (
              <button 
                className="view-all-btn" 
                onClick={() => navigate("/explore", { state: { activeTab: "atividades" } })}
              >
                <span>Ver todas</span>
                <span className="material-symbols-outlined">arrow_forward</span>
                <div className="btn-glow"></div>
              </button>
            )}
          </div>

          <ActivitiesList 
            hasFarm={hasFarm}
            onViewAll={() => navigate("/explore", { state: { activeTab: "atividades" } })}
            onRegister={() => navigate("/cadastrar-fazenda")}
          />
        </section>

        <ExploreModules onNavigate={navigate} />
        <AppFooter />
      </div>

      <MenuBar />
    </>
  )
}