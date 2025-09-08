// ========================================
// 🚀 SERVICIO DE APIs EXTERNAS
// ========================================
import { CACHE_DURATIONS, LOCAL_FACTS } from '../config/constants.js'
import { cacheManager } from '../Utils/CacheManager.js'
import { extractCityFromPrompt, extractCoinsFromPrompt } from '../Utils/textUtils.js'

class ApiService {
  constructor() {
    this.currentLocation = null
  }

  /**
   * Obtiene la ubicación actual del usuario
   * @returns {Promise<Object|null>} - Ubicación detectada
   */
  async getCurrentLocation() {
    if (this.currentLocation) return this.currentLocation

    try {
      const cacheKey = 'current_location'
      const cachedLocation = cacheManager.getApi(cacheKey)
      if (cachedLocation) {
        this.currentLocation = cachedLocation
        return cachedLocation
      }

      // Intentar primero con geolocalización del navegador
      const browserLocation = await this.getBrowserLocation()
      if (browserLocation) {
        this.currentLocation = browserLocation
        cacheManager.setApi(cacheKey, browserLocation, 3600000) // 1 hora
        return browserLocation
      }

      // Fallback a geolocalización por IP
      const ipLocation = await this.getLocationByIP()
      if (ipLocation) {
        this.currentLocation = ipLocation
        cacheManager.setApi(cacheKey, ipLocation, 3600000)
        return ipLocation
      }

      return null

    } catch (error) {
      console.error('Error obteniendo ubicación actual:', error)
      return null
    }
  }

  /**
   * Obtiene ubicación usando la API de geolocalización del navegador
   * @returns {Promise<Object|null>} - Coordenadas y ubicación
   */
  getBrowserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocalización no disponible en el navegador')
        resolve(null)
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutos
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            console.log(`📍 Coordenadas obtenidas: ${latitude}, ${longitude}`)
            
            // Convertir coordenadas a ciudad usando geocodificación inversa
            const cityName = await this.getCityFromCoordinates(latitude, longitude)
            
            resolve({
              type: 'browser',
              latitude,
              longitude,
              city: cityName || 'Unknown',
              coords: `${latitude},${longitude}`
            })
          } catch (error) {
            console.error('Error procesando coordenadas:', error)
            resolve(null)
          }
        },
        (error) => {
          console.log('Error o denegación de geolocalización:', error.message)
          resolve(null)
        },
        options
      )
    })
  }

  /**
   * Convierte coordenadas a nombre de ciudad
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   * @returns {Promise<string|null>} - Nombre de la ciudad
   */
  async getCityFromCoordinates(lat, lng) {
    try {
      // Usar servicio gratuito de geocodificación inversa
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`)
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.city || data.locality || data.principalSubdivision || null
      
    } catch (error) {
      console.error('Error en geocodificación inversa:', error)
      return null
    }
  }

  /**
   * Obtiene ubicación por IP
   * @returns {Promise<Object|null>} - Información de ubicación
   */
  async getLocationByIP() {
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) throw new Error('Error al obtener información de ubicación')
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON válido')
      }
      
      const text = await response.text()
      let data
      
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        throw new Error('Error al parsear JSON de ubicación')
      }
      
      return {
        type: 'ip',
        ip: data.ip || 'Desconocida',
        city: data.city || 'Desconocida',
        region: data.region || 'Desconocida',
        country: data.country_name || 'Desconocido',
        timezone: data.timezone || 'Desconocida',
        latitude: data.latitude,
        longitude: data.longitude
      }
      
    } catch (error) {
      console.error('Error obteniendo ubicación por IP:', error)
      return null
    }
  }

  /**
   * Obtiene información del clima
   * @param {string|null} city - Ciudad a consultar (null para ubicación actual)
   * @returns {Object|null} - Información del clima
   */
  async getWeather(city = null) {
    try {
      let targetCity = city
      let cacheKey = 'weather_default'

      // Si no se especifica ciudad, usar ubicación actual
      if (!targetCity) {
        console.log('🌍 Obteniendo clima para ubicación actual...')
        const currentLocation = await this.getCurrentLocation()
        
        if (currentLocation) {
          if (currentLocation.coords) {
            // Usar coordenadas si están disponibles
            targetCity = currentLocation.coords
            cacheKey = `weather_coords_${currentLocation.coords}`
            console.log(`📍 Usando coordenadas: ${targetCity}`)
          } else if (currentLocation.city && currentLocation.city !== 'Desconocida') {
            // Usar nombre de ciudad
            targetCity = currentLocation.city
            cacheKey = `weather_${targetCity.toLowerCase()}`
            console.log(`🏙️ Usando ciudad: ${targetCity}`)
          } else {
            // Usar wttr.in sin parámetros para auto-detección
            targetCity = ''
            cacheKey = 'weather_auto'
            console.log('🌐 Usando auto-detección de wttr.in')
          }
        } else {
          // Fallback a Cancún si no se puede detectar ubicación
          targetCity = 'Cancun'
          cacheKey = 'weather_fallback_cancun'
          console.log('🏖️ Fallback a Cancún')
        }
      } else {
        cacheKey = `weather_${city.toLowerCase()}`
      }
      
      // Verificar cache
      const cachedWeather = cacheManager.getApi(cacheKey)
      if (cachedWeather) {
        console.log('📦 Clima obtenido desde cache')
        return cachedWeather
      }

      // Construir URL
      let weatherURL
      if (targetCity === '') {
        // Auto-detección por IP
        weatherURL = 'https://wttr.in/?format=j1'
      } else if (targetCity.includes(',')) {
        // Coordenadas
        weatherURL = `https://wttr.in/${encodeURIComponent(targetCity)}?format=j1`
      } else {
        // Ciudad
        weatherURL = `https://wttr.in/${encodeURIComponent(targetCity)}?format=j1`
      }

      console.log('🌤️ Consultando clima:', weatherURL)

      const response = await fetch(weatherURL, {
        headers: {
          'User-Agent': 'EndyOS Weather Client'
        }
      })
      
      if (!response.ok) throw new Error(`Error HTTP ${response.status} al obtener clima`)
      
      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta del clima no es JSON válido')
      }
      
      const text = await response.text()
      let data
      
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        console.error('Error parseando JSON del clima:', parseError)
        throw new Error('Error al parsear JSON del clima')
      }
      
      // Verificar que la estructura de datos sea correcta
      if (!data.current_condition || !data.current_condition[0] || !data.nearest_area || !data.nearest_area[0]) {
        console.error('Estructura de datos del clima inválida:', data)
        throw new Error('Estructura de datos del clima inválida')
      }
      
      const current = data.current_condition[0]
      const location = data.nearest_area[0]
      
      const weatherInfo = {
        location: `${location.areaName[0].value}, ${location.country[0].value}`,
        temperature: `${current.temp_C}°C`,
        feelsLike: `${current.FeelsLikeC}°C`,
        description: current.weatherDesc[0].value,
        humidity: `${current.humidity}%`,
        windSpeed: `${current.windspeedKmph} km/h`,
        windDir: current.winddir16Point,
        pressure: `${current.pressure} mb`,
        visibility: `${current.visibility} km`,
        uvIndex: current.uvIndex || 'N/A'
      }
      
      // Guardar en cache
      cacheManager.setApi(cacheKey, weatherInfo, CACHE_DURATIONS.WEATHER)
      
      console.log('✅ Clima obtenido exitosamente:', weatherInfo.location)
      return weatherInfo
      
    } catch (error) {
      console.error('❌ Error obteniendo clima:', error)
      return null
    }
  }

  /**
   * Obtiene precios de criptomonedas
   * @param {Array} coins - Array de monedas a consultar
   * @returns {Array|null} - Datos de criptomonedas
   */
  async getCrypto(coins = ['bitcoin', 'ethereum']) {
    try {
      const cacheKey = `crypto_${coins.join('_')}`
      
      // Verificar cache
      const cachedCrypto = cacheManager.getApi(cacheKey)
      if (cachedCrypto) return cachedCrypto

      const coinList = coins.join(',')
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinList}&vs_currencies=usd,eur&include_24hr_change=true`)
      
      if (!response.ok) throw new Error('Error al obtener criptomonedas')
      
      // Verificar contenido JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta no es JSON válido')
      }
      
      const text = await response.text()
      let data
      
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        throw new Error('Error al parsear JSON de criptomonedas')
      }
      
      const cryptoData = Object.entries(data).map(([coin, prices]) => ({
        name: coin.charAt(0).toUpperCase() + coin.slice(1),
        usd: `$${prices.usd?.toLocaleString() || '0'}`,
        eur: `€${prices.eur?.toLocaleString() || '0'}`,
        change24h: `${prices.usd_24h_change?.toFixed(2) || 0}%`
      }))
      
      // Guardar en cache
      cacheManager.setApi(cacheKey, cryptoData, CACHE_DURATIONS.CRYPTO)
      
      return cryptoData
      
    } catch (error) {
      console.error('Error crypto:', error)
      return null
    }
  }

  /**
   * Obtiene un dato curioso
   * @param {string} type - Tipo de dato (trivia, math, date)
   * @returns {string} - Dato curioso
   */
  async getFunFact(type = 'trivia') {
    try {
      const response = await fetch(`http://numbersapi.com/random/${type}`)
      if (!response.ok) throw new Error('Error al obtener dato curioso')
      
      const fact = await response.text()
      return fact
      
    } catch (error) {
      console.error('Error fun fact:', error)
      return LOCAL_FACTS[Math.floor(Math.random() * LOCAL_FACTS.length)]
    }
  }

  /**
   * Obtiene información de ubicación e IP
   * @returns {Object|null} - Datos de ubicación
   */
  async getLocationInfo() {
    try {
      const location = await this.getCurrentLocation()
      return location
      
    } catch (error) {
      console.error('Error ubicación:', error)
      return null
    }
  }

  /**
   * Procesa comandos de API del prompt
   * @param {string} prompt - Comando del usuario
   * @returns {string|null} - Respuesta del comando o null si no aplica
   */
  async processApiCommand(prompt) {
    const lowerPrompt = prompt.toLowerCase()
    
    // 🌤️ Comandos de clima
    if (lowerPrompt.includes('clima') || lowerPrompt.includes('tiempo')) {
      // Verificar si se especifica una ciudad
      const specifiedCity = extractCityFromPrompt(prompt)
      const weather = await this.getWeather(specifiedCity)
      
      if (weather) {
        return `🌤️ El clima en ${weather.location}: ${weather.temperature} (sensación ${weather.feelsLike}), ${weather.description}. Humedad ${weather.humidity}, viento ${weather.windSpeed} ${weather.windDir}. Presión ${weather.pressure}, visibilidad ${weather.visibility}.`
      } else {
        return "❌ No pude obtener información del clima en este momento."
      }
    }
    
    // 💰 Comandos de criptomonedas
    if (lowerPrompt.includes('bitcoin') || lowerPrompt.includes('crypto') || lowerPrompt.includes('ethereum')) {
      const coins = extractCoinsFromPrompt(prompt)
      const crypto = await this.getCrypto(coins)
      
      if (crypto && crypto.length > 0) {
        let response = "💰 Precios de criptomonedas: "
        crypto.forEach(coin => {
          const changeIcon = parseFloat(coin.change24h) >= 0 ? '📈' : '📉'
          response += `${coin.name}: ${coin.usd}, cambio 24h: ${coin.change24h} ${changeIcon}. `
        })
        return response
      } else {
        return "❌ No pude obtener los precios de criptomonedas en este momento."
      }
    }
    
    // 🎲 Comandos de datos curiosos
    if (lowerPrompt.includes('dato curioso') || lowerPrompt.includes('curiosidad') || lowerPrompt.includes('sorpréndeme')) {
      const fact = await this.getFunFact()
      return `🎲 Aquí tienes un dato curioso: ${fact}`
    }
    
    // 🌍 Comandos de ubicación
    if (lowerPrompt.includes('mi ubicación') || lowerPrompt.includes('donde estoy') || lowerPrompt.includes('mi ip')) {
      const location = await this.getLocationInfo()
      if (location) {
        if (location.type === 'browser') {
          return `📍 Tu ubicación aproximada es: ${location.city}. Coordenadas: ${location.latitude}, ${location.longitude} (obtenidas por GPS)`
        } else {
          return `🌐 Tu IP es ${location.ip}. Te encuentras en ${location.city}, ${location.region}, ${location.country}. Zona horaria: ${location.timezone}.`
        }
      } else {
        return "❌ No pude obtener tu información de ubicación."
      }
    }
    
    return null // No es un comando de API
  }
}

export const apiService = new ApiService()

// Exportar métodos individuales para compatibilidad
export const getWeather = (city) => apiService.getWeather(city)
export const getCrypto = (coins) => apiService.getCrypto(coins)
export const getFunFact = (type) => apiService.getFunFact(type)
export const getLocationInfo = () => apiService.getLocationInfo()