import { useState, useEffect } from "react"
import { useFarm } from "./hooks/useFarm"
import "../../../styles/App/Explore.css"
import "../../../styles/App/ClimaTab.css"

const API_KEY = "d77668673cf15b7d0488f921007cbd6b"

export default function ClimaTab() {
  const { farmData, loading: farmLoading } = useFarm()

  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedRecommendation, setExpandedRecommendation] = useState(null)

  const fetchWeather = async () => {
    if (!farmData) {
      setError("Nenhuma fazenda cadastrada")
      setLoading(false)
      return
    }

    if (!farmData.municipio || !farmData.uf) {
      setError("Localização da fazenda incompleta")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const city = encodeURIComponent(farmData.municipio)
      const state = farmData.uf

      // 🔥 1. CLIMA ATUAL
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},BR&appid=${API_KEY}&units=metric&lang=pt_br`
      )
      const weather = await weatherRes.json()

      // 🔥 2. FORECAST (MÍN/MAX DO DIA)
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},${state},BR&appid=${API_KEY}&units=metric&lang=pt_br`
      )
      const forecast = await forecastRes.json()

      let minTempDay = weather.main.temp
      let maxTempDay = weather.main.temp

      if (forecast.cod === "200") {
        const today = new Date().toISOString().split("T")[0]

        const todayList = forecast.list.filter(item =>
          item.dt_txt.startsWith(today)
        )

        if (todayList.length > 0) {
          const temps = todayList.map(item => item.main.temp)

          minTempDay = Math.min(...temps)
          maxTempDay = Math.max(...temps)
        }
      }

      if (weather.cod === 200) {
        setWeatherData({
          city: weather.name,
          state,
          farmName: farmData.name,

          temperature: Math.round(weather.main.temp),
          feelsLike: Math.round(weather.main.feels_like),

          tempMin: Math.round(minTempDay),
          tempMax: Math.round(maxTempDay),

          humidity: weather.main.humidity,
          pressure: weather.main.pressure,

          windSpeed: weather.wind.speed,
          windDeg: weather.wind.deg,
          windGust: weather.wind.gust || 0,

          rain: weather.rain?.["1h"] || 0,

          description: weather.weather[0].description,
          icon: weather.weather[0].icon,
          clouds: weather.clouds.all,

          visibility: weather.visibility / 1000,

          sunrise: new Date(weather.sys.sunrise * 1000).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sunset: new Date(weather.sys.sunset * 1000).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),

          date: new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
        })
      } else {
        setError("Cidade não encontrada")
      }
    } catch (err) {
      console.error(err)
      setError("Erro ao buscar clima")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!farmLoading) fetchWeather()
  }, [farmData, farmLoading])

  const getWindDirection = (deg) => {
    const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"]
    return dirs[Math.round(deg / 45) % 8]
  }

  const getWeatherSymbol = (iconCode) => {
    const code = iconCode?.slice(0, 2)
    const symbols = {
      "01": "sunny",
      "02": "partly_cloudy_day",
      "03": "cloud",
      "04": "cloud",
      "09": "rainy",
      "10": "rainy",
      "11": "thunderstorm",
      "13": "weather_snowy",
      "50": "foggy",
    }

    return symbols[code] || "cloud"
  }

  const retry = () => fetchWeather()

  // Gerar recomendações
  const getRecommendations = () => {
    if (!weatherData) return []

    const recommendations = []

    // Solo seco
    if (weatherData.humidity < 50 && weatherData.rain === 0) {
      recommendations.push({
        type: "warning",
        icon: "water_drop",
        title: "Solo seco",
        message: "Irrigação recomendada"
      })
    }

    // Alta umidade
    if (weatherData.humidity > 80) {
      recommendations.push({
        type: "warning",
        icon: "humidity_high",
        title: "Alta umidade",
        message: "Risco de fungos. Monitore as plantas"
      })
    }

    // Calor intenso
    if (weatherData.temperature > 32) {
      recommendations.push({
        type: "warning",
        icon: "whatshot",
        title: "Calor intenso",
        message: "Proteja plantas sensíveis do sol forte"
      })
    }

    // Temperatura baixa
    if (weatherData.temperature < 15) {
      recommendations.push({
        type: "warning",
        icon: "ac_unit",
        title: "Temperatura baixa",
        message: "Risco de geada. Proteja as plantas"
      })
    }

    // Vento forte
    if (weatherData.windSpeed > 8) {
      recommendations.push({
        type: "warning",
        icon: "wind_power",
        title: "Vento forte",
        message: "Evite pulverização e verifique estruturas"
      })
    }

    // Chuva forte
    if (weatherData.rain > 5) {
      recommendations.push({
        type: "info",
        icon: "rainy",
        title: "Chuva forte",
        message: "Suspenda irrigação e verifique drenagem"
      })
    }

    // Condições ideais
    if (weatherData.humidity >= 50 && weatherData.humidity <= 70 && 
        weatherData.temperature >= 20 && weatherData.temperature <= 30 && 
        weatherData.windSpeed <= 5 && weatherData.rain === 0) {
      recommendations.push({
        type: "success",
        icon: "sentiment_satisfied",
        title: "Condições ideais",
        message: "Perfeito para atividades no campo"
      })
    }

    // 🌟 RECOMENDAÇÃO PADRÃO - Sempre mostrar pelo menos uma recomendação
    if (recommendations.length === 0) {
      recommendations.push({
        type: "info",
        icon: "agriculture",
        title: "Clima estável",
        message: "Condições normais para as atividades agrícolas"
      })
    }

    return recommendations
  }

  // LOADING
  if (loading || farmLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary)' }}>cloud</span>
          </div>
          <h3 style={styles.loadingTitle}>Buscando clima</h3>
          <p style={styles.loadingText}>
            {farmData ? `Obtendo dados para ${farmData.municipio}...` : 'Carregando...'}
          </p>
        </div>
      </div>
    )
  }

  // ERRO
  if (error || !weatherData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--danger)' }}>error</span>
          </div>
          <h3 style={styles.errorTitle}>Ops!</h3>
          <p style={styles.errorText}>{error || "Não foi possível obter os dados"}</p>
          {farmData && (
            <button style={styles.retryButton} onClick={retry}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    )
  }

  const recommendations = getRecommendations()
  const updatedTime = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const getRecommendationAccent = (type) => {
    if (type === "warning") return "#ffaa00"
    if (type === "success") return "#56a870"
    return "#0066ff"
  }

  const getRecommendationDetails = (title) => {
    if (title === "Solo seco" || title === "Alta umidade") {
      return `Umidade atual de ${weatherData.humidity}% e chuva de ${weatherData.rain} mm na última hora.`
    }
    if (title === "Calor intenso" || title === "Temperatura baixa") {
      return `Temperatura atual de ${weatherData.temperature}°C, com sensação de ${weatherData.feelsLike}°C.`
    }
    if (title === "Vento forte") {
      return `Vento atual de ${weatherData.windSpeed} m/s, com rajadas de ${weatherData.windGust} m/s.`
    }
    if (title === "Chuva forte") {
      return `Volume registrado de ${weatherData.rain} mm na última hora.`
    }
    return `Temperatura de ${weatherData.temperature}°C, umidade de ${weatherData.humidity}% e vento de ${weatherData.windSpeed} m/s.`
  }

  return (
    <div className="climate-dashboard">
      <section className="climate-hero">
        <header className="climate-location">
          <h1>{weatherData.city}, {weatherData.state}</h1>
          <p>
            <span className="material-symbols-outlined" aria-hidden="true">calendar_today</span>
            {weatherData.date}
          </p>
        </header>

        <div className="climate-overview-card">
          <div className="climate-reading">
            <div className="climate-condition">
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                alt={weatherData.description}
              />
              <strong>{weatherData.description}</strong>
            </div>
            <div className="climate-temperature" aria-label={`${weatherData.temperature} graus Celsius`}>
              <strong>{weatherData.temperature}</strong>
              <span>°C</span>
            </div>
          </div>

          <div className="climate-highlights">
            <div>
              <span className="material-symbols-outlined climate-min-icon">arrow_downward</span>
              <small>Mínima</small>
              <strong>{weatherData.tempMin}°</strong>
            </div>
            <div>
              <span className="material-symbols-outlined climate-max-icon">arrow_upward</span>
              <small>Máxima</small>
              <strong>{weatherData.tempMax}°</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="climate-stats" aria-label="Detalhes meteorológicos">
        {[
          ["humidity_percentage", "Umidade", `${weatherData.humidity}%`],
          ["air", "Vento", `${weatherData.windSpeed} m/s`, getWindDirection(weatherData.windDeg)],
          ["speed", "Pressão", `${weatherData.pressure} hPa`],
          ["rainy", "Chuva", `${weatherData.rain} mm`],
          ["airwave", "Rajada", `${weatherData.windGust} m/s`],
          ["visibility", "Visibilidade", `${weatherData.visibility} km`],
          ["cloud", "Nuvens", `${weatherData.clouds}%`],
          ["wb_twilight", "Nascer", weatherData.sunrise],
          ["wb_twilight", "Pôr", weatherData.sunset],
        ].map(([icon, label, value, detail]) => (
          <article className="climate-stat-card" key={label}>
            <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
              {detail && <em>{detail}</em>}
            </div>
          </article>
        ))}
      </section>

      <section className="climate-recommendations">
        <h2>
          <span className="material-symbols-outlined" aria-hidden="true">eco</span>
          Recomendações
        </h2>
        <div className="climate-recommendation-list">
          {recommendations.map((rec, index) => (
            <article
              className={`climate-recommendation climate-recommendation--${rec.type} ${expandedRecommendation === index ? "is-expanded" : ""}`}
              key={`${rec.title}-${index}`}
              style={{ "--recommendation-accent": getRecommendationAccent(rec.type) }}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{rec.icon}</span>
              <div>
                <strong>{rec.title}</strong>
                <p>{rec.message}</p>
              </div>
              <button
                type="button"
                className="climate-recommendation-details-button"
                aria-expanded={expandedRecommendation === index}
                onClick={() => setExpandedRecommendation(expandedRecommendation === index ? null : index)}
              >
                {expandedRecommendation === index ? "Ocultar" : "Ver detalhes"}
                <span className="material-symbols-outlined" aria-hidden="true">
                  {expandedRecommendation === index ? "expand_less" : "chevron_right"}
                </span>
              </button>
              {expandedRecommendation === index && (
                <p className="climate-recommendation-details">
                  {getRecommendationDetails(rec.title)}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <p className="climate-updated">
        <span className="material-symbols-outlined" aria-hidden="true">update</span>
        Atualizado agora · {updatedTime}
      </p>
    </div>
  )
}

// Estilos responsivos com design mais clean
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '12px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  },

  // Card principal
  mainCard: {
    background: '#f7f5f0',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border)',
    borderRadius: '28px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 10px 30px var(--primary-glow)',
    width: '100%',
    boxSizing: 'border-box',
  },
  mainCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cityName: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--g4)',
    margin: '0 0 4px 0',
    lineHeight: 1.2,
  },
  date: {
    fontSize: '0.85rem',
    color: 'var(--muted)',
    margin: 0,
    textTransform: 'capitalize',
    display: 'flex',
    alignItems: 'center',
  },
  weatherIcon: {
    textAlign: 'center',
    background: '#f7f5f0',
    boxShadow: '0 10px 30px var(--primary-glow)',
    padding: '12px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border)',
    minWidth: '100px',
  },
  weatherSymbol: {
    display: 'block',
    fontSize: '38px',
    color: 'var(--g4)',
    lineHeight: 1,
    marginBottom: '8px',
  },
  weatherDesc: {
    fontSize: '0.8rem',
    color: 'var(--ink)',
    margin: '2px 0 0 0',
    textTransform: 'capitalize',
  },

  // Temperatura
  tempSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  tempCircle: {
    position: 'relative',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(145deg, var(--g4) 0%, var(--g5) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 18px 34px rgba(45, 97, 64, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.18)',
  },
  tempValue: {
    fontSize: '3rem',
    fontWeight: '700',
    color: '#fff',
  },
  tempUnit: {
    fontSize: '1rem',
    color: '#fff',
    alignSelf: 'flex-start',
    marginTop: '20px',
  },
  tempDetails: {
    flex: 1,
    minWidth: '140px',
  },
  tempDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--muted)',
    marginBottom: '6px',
    fontSize: '0.9rem',
  },
  tempRange: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tempRangeItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    maxWidth: '150px',
  },
  tempRangeLabel: {
    color: 'var(--muted)',
    fontSize: '0.78rem',
    fontWeight: '600',
  },
  tempRangeIcon: {
    fontSize: '16px',
    verticalAlign: 'middle',
  },
  tempMin: {
    color: 'var(--g4)',
    fontWeight: '700',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  tempMax: {
    color: '#d58a00',
    fontWeight: '700',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },

  // Grid de estatísticas
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  statCard: {
    background: '#f7f5f0',
    boxShadow: '0 10px 30px var(--primary-glow)',
    border: '1px solid var(--border)',
    borderRadius: '18px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'transform 0.2s',
  },
  statIcon: {
    fontSize: '22px',
    color: 'var(--primary)',
    minWidth: '32px',
  },
  statInfo: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    display: 'block',
    fontSize: '0.65rem',
    color: 'var(--muted)',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  statValue: {
    fontSize: '0.95rem',
    color: 'var(--ink)',
    fontWeight: '600',
    display: 'inline-block',
    marginRight: '4px',
  },
  statSub: {
    fontSize: '0.65rem',
    color: '#6b7280',
    marginLeft: '2px',
  },

  // Recomendações
  recommendationsCard: {
    background: '#f7f5f0',
    boxShadow: '0 10px 30px var(--primary-glow)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '28px',
    padding: '20px',
    marginBottom: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  recommendationsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--ink)',
    fontSize: '1.1rem',
    margin: '0 0 16px 0',
    fontWeight: '500',
  },
  recommendationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  recommendation: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    background: '#f7f5f0',
    boxShadow: '0 10px 30px var(--primary-glow)',
    border: '1px solid var(--border)',
    borderRadius: '18px',
    transition: 'all 0.2s',
  },
  recommendationWarning: {
    borderLeft: '4px solid #ffaa00',
    background: 'rgba(255,170,0,0.05)',
  },
  recommendationSuccess: {
    borderLeft: '4px solid #56a870',
    background: 'rgba(86,168,112,0.08)',
  },
  recommendationInfo: {
    borderLeft: '4px solid #0066ff',
    background: 'rgba(0,102,255,0.05)',
  },
  recommendationIcon: {
    fontSize: '22px',
    color: 'var(--primary)',
    minWidth: '32px',
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitleText: {
    color: 'var(--g1)',
    display: 'block',
    fontWeight: '700',
    marginBottom: '2px',
  },
  recommendationMessage: {
    color: 'var(--g1)',
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: 1.35,
  },

  // Loading e erro
  loadingContainer: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingCard: {
    background: '#f7f5f0',
    boxShadow: '0 10px 30px var(--primary-glow)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border)',
    borderRadius: '28px',
    padding: '32px 24px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '280px',
  },
  loadingIcon: {
    marginBottom: '14px',
  },
  loadingTitle: {
    color: 'var(--ink)',
    margin: '0 0 6px 0',
    fontSize: '1.2rem',
  },
  loadingText: {
    color: 'var(--muted)',
    margin: 0,
    fontSize: '0.9rem',
  },
  errorCard: {
    background: '#f7f5f0',
    boxShadow: '0 10px 30px var(--primary-glow)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,68,68,0.2)',
    borderRadius: '28px',
    padding: '32px 24px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '280px',
  },
  errorIcon: {
    marginBottom: '14px',
  },
  errorTitle: {
    color: '#ff4d4d',
    margin: '0 0 6px 0',
    fontSize: '1.2rem',
  },
  errorText: {
    color: 'var(--muted)',
    margin: '0 0 16px 0',
    fontSize: '0.9rem',
  },
  retryButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '26px',
    padding: '10px 20px',
    color: '#fff',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    marginTop: '8px',
  },
}
