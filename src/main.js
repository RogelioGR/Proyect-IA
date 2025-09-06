import './style.css'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText } from 'ai'
import removeMarkdown from 'remove-markdown'

const openrouter = createOpenRouter({
  apiKey: import.meta.env.VITE_OPENROUTER_KEY  
})

// APIs Keys
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

// Cache para respuestas y APIs
const MESSAGE_CACHE = new Map()
const API_CACHE = new Map()
const VIDEO_CACHE = new Map()

// Limpiar texto de caracteres especiales
const cleanText = (text) => {
  if (!text || typeof text !== 'string') return ''
  return removeMarkdown(text).replace(/\s+/g, ' ').trim()
}

// ========================================
// 🎵 FUNCIONES DE YOUTUBE MEJORADAS
// ========================================

async function searchYouTubeVideo(query) {
  try {
    const cacheKey = `youtube_${query.toLowerCase()}`
    
    // Verificar cache (válido por 1 hora)
    if (VIDEO_CACHE.has(cacheKey)) {
      const cached = VIDEO_CACHE.get(cacheKey)
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.data
      }
    }

    if (YOUTUBE_API_KEY) {
      // Método 1: Con API oficial de YouTube
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
      
      const response = await fetch(searchUrl)
      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const videoId = data.items[0].id.videoId
          const videoData = {
            id: videoId,
            title: data.items[0].snippet.title,
            url: `https://www.youtube.com/watch?v=${videoId}&autoplay=1`
          }
          
          // Guardar en cache
          VIDEO_CACHE.set(cacheKey, {
            data: videoData,
            timestamp: Date.now()
          })
          
          return videoData
        }
      }
    }
    

    
    
  } catch (error) {
    console.error('Error buscando en YouTube:', error)
    return null
  }
}

function openYouTube(searchQuery = '', autoplay = false) {
  let url = 'https://www.youtube.com'
  let message = ''
  
  if (searchQuery) {
    if (autoplay) {
      // Para reproducir, intentamos obtener el primer video
      return searchAndPlayYouTube(searchQuery)
    } else {
      // Para buscar sin reproducir
      url += `/results?search_query=${encodeURIComponent(searchQuery)}`
      message = `EndyOS buscando "${searchQuery}" en YouTube`
    }
  } else {
    message = `EndyOS abriendo YouTube`
  }
  
  window.open(url, '_blank')
  return message
}

async function searchAndPlayYouTube(query) {
  try {
    const videoData = await searchYouTubeVideo(query)
    
    if (videoData) {
      if (videoData.id) {
        // Si tenemos el ID del video, ir directamente al video con autoplay
        const playUrl = `https://www.youtube.com/watch?v=${videoData.id}&autoplay=1`
        window.open(playUrl, '_blank')
        return `EndyOS reproduciendo "${videoData.title}" en YouTube`
      } else {
        // Fallback: abrir búsqueda con parámetro de reproducción
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        window.open(searchUrl, '_blank')
        
        return `EndyOS buscando "${query}" en YouTube. Haz clic en el primer video para reproducir.`
      }
    } else {
      throw new Error('No se pudo encontrar el video')
    }
    
  } catch (error) {
    console.error('Error reproduciendo YouTube:', error)
    // Fallback a búsqueda normal
    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    window.open(fallbackUrl, '_blank')
    return `EndyOS buscando "${query}" en YouTube`
  }
}

// Función para crear un reproductor embebido en la página
function createYouTubePlayer(videoId, containerId = 'youtube-player') {
  // Crear contenedor si no existe
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 480px;
      height: 270px;
      z-index: 10000;
      background: #000;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `
    document.body.appendChild(container)
  }
  
  // Crear iframe del reproductor
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 8px;
  `
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
  iframe.allowFullscreen = true
  
  container.innerHTML = ''
  container.appendChild(iframe)
  
  // Botón para cerrar
  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '×'
  closeBtn.style.cssText = `
    position: absolute;
    top: -10px;
    right: -10px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #ff0000;
    color: white;
    border: none;
    font-size: 18px;
    cursor: pointer;
    font-weight: bold;
  `
  closeBtn.onclick = () => container.remove()
  container.appendChild(closeBtn)
  
  return container
}

// Función para reproducir con reproductor embebido
async function playYouTubeEmbedded(query) {
  try {
    const videoData = await searchYouTubeVideo(query)
    
    if (videoData && videoData.id) {
      createYouTubePlayer(videoData.id)
      return `EndyOS reproduciendo "${videoData.title}" en reproductor integrado`
    } else {
      // Fallback a ventana nueva
      return await searchAndPlayYouTube(query)
    }
    
  } catch (error) {
    console.error('Error creando reproductor:', error)
    return await searchAndPlayYouTube(query)
  }
}

// ========================================
// 🌐 FUNCIONES DE NAVEGADOR
// ========================================

function openURL(url) {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    window.open(url, '_blank')
    return `EndyOS abriendo ${url}`
  } catch (error) {
    return `EndyOS no pudo abrir ${url}. Verifica la dirección.`
  }
}

function searchGoogle(query) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
  window.open(searchUrl, '_blank')
  return `EndyOS buscando "${query}" en Google`
}

// ========================================
// 🚀 INTEGRACIONES CON APIs
// ========================================

// 🌤️ API del Clima (OpenWeatherMap gratuita)
async function getWeather(city = 'cancun') {
  try {
    const cacheKey = `weather_${city.toLowerCase()}`
    
    // Verificar cache (válido por 10 minutos)
    if (API_CACHE.has(cacheKey)) {
      const cached = API_CACHE.get(cacheKey)
      if (Date.now() - cached.timestamp < 600000) {
        return cached.data
      }
    }

    // API gratuita sin key (limitada pero funcional)
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
    
    if (!response.ok) throw new Error('Error al obtener clima')
    
    const data = await response.json()
    const current = data.current_condition[0]
    const location = data.nearest_area[0]
    
    const weatherInfo = {
      location: `${location.areaName[0].value}, ${location.country[0].value}`,
      temperature: `${current.temp_C}°C`,
      description: current.weatherDesc[0].value,
      humidity: `${current.humidity}%`,
      windSpeed: `${current.windspeedKmph} km/h`
    }
    
    // Guardar en cache
    API_CACHE.set(cacheKey, {
      data: weatherInfo,
      timestamp: Date.now()
    })
    
    return weatherInfo
    
  } catch (error) {
    console.error('Error clima:', error)
    return null
  }
}

// 💰 API de Criptomonedas (CoinGecko - gratuita)
async function getCrypto(coins = ['bitcoin', 'ethereum']) {
  try {
    const cacheKey = `crypto_${coins.join('_')}`
    
    // Cache válido por 5 minutos
    if (API_CACHE.has(cacheKey)) {
      const cached = API_CACHE.get(cacheKey)
      if (Date.now() - cached.timestamp < 300000) {
        return cached.data
      }
    }

    const coinList = coins.join(',')
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinList}&vs_currencies=usd,eur&include_24hr_change=true`)
    
    if (!response.ok) throw new Error('Error al obtener criptomonedas')
    
    const data = await response.json()
    const cryptoData = Object.entries(data).map(([coin, prices]) => ({
      name: coin.charAt(0).toUpperCase() + coin.slice(1),
      usd: `$${prices.usd.toLocaleString()}`,
      eur: `€${prices.eur.toLocaleString()}`,
      change24h: `${prices.usd_24h_change?.toFixed(2) || 0}%`
    }))
    
    // Guardar en cache
    API_CACHE.set(cacheKey, {
      data: cryptoData,
      timestamp: Date.now()
    })
    
    return cryptoData
    
  } catch (error) {
    console.error('Error crypto:', error)
    return null
  }
}

// 🎲 API de Datos Curiosos (Numbers API - gratuita)
async function getFunFact(type = 'trivia') {
  try {
    const response = await fetch(`http://numbersapi.com/random/${type}`)
    if (!response.ok) throw new Error('Error al obtener dato curioso')
    
    const fact = await response.text()
    return fact
    
  } catch (error) {
    // Fallback a datos locales si la API falla
    const localFacts = [
      "Los pulpos tienen tres corazones y sangre azul.",
      "Un rayo es cinco veces más caliente que la superficie del Sol.",
      "Los humanos comparten el 60% de su ADN con los plátanos.",
      "Un día en Venus dura más que un año en Venus.",
      "El corazón de una ballena azul es tan grande como un auto pequeño."
    ]
    return localFacts[Math.floor(Math.random() * localFacts.length)]
  }
}

// 🔧 API de Utilidades - IP y Geolocalización
async function getLocationInfo() {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) throw new Error('Error al obtener información de ubicación')
    
    const data = await response.json()
    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      timezone: data.timezone
    }
    
  } catch (error) {
    console.error('Error ubicación:', error)
    return null
  }
}

// ========================================
// 🤖 PROCESADOR DE COMANDOS DE API
// ========================================

async function processApiCommand(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  
  // 🌤️ Comandos de clima
  if (lowerPrompt.includes('clima') || lowerPrompt.includes('tiempo')) {
    let city = 'Madrid' // Ciudad por defecto
    
    // Extraer ciudad del prompt
    const cityMatch = lowerPrompt.match(/(?:clima|tiempo).*?(?:en|de)\s+([a-záéíóúñ\s]+)/) ||
                     lowerPrompt.match(/([a-záéíóúñ\s]+).*?(?:clima|tiempo)/)
    
    if (cityMatch) {
      city = cityMatch[1].trim()
    }
    
    const weather = await getWeather(city)
    if (weather) {
      return `El clima en ${weather.location}: ${weather.temperature}, ${weather.description}. Humedad ${weather.humidity}, viento ${weather.windSpeed}.`
    } else {
      return "No pude obtener información del clima en este momento."
    }
  }
  
  // 💰 Comandos de criptomonedas
  if (lowerPrompt.includes('bitcoin') || lowerPrompt.includes('crypto') || lowerPrompt.includes('ethereum')) {
    let coins = ['bitcoin', 'ethereum']
    
    // Detectar monedas específicas
    if (lowerPrompt.includes('bitcoin') && !lowerPrompt.includes('ethereum')) {
      coins = ['bitcoin']
    } else if (lowerPrompt.includes('ethereum') && !lowerPrompt.includes('bitcoin')) {
      coins = ['ethereum']
    }
    
    const crypto = await getCrypto(coins)
    if (crypto && crypto.length > 0) {
      let response = "Precios de criptomonedas: "
      crypto.forEach(coin => {
        const changeIcon = parseFloat(coin.change24h) >= 0 ? '📈' : '📉'
        response += `${coin.name}: ${coin.usd}, cambio 24h: ${coin.change24h} ${changeIcon}. `
      })
      return response
    } else {
      return "No pude obtener los precios de criptomonedas en este momento."
    }
  }
  
  // 🎲 Comandos de datos curiosos
  if (lowerPrompt.includes('dato curioso') || lowerPrompt.includes('curiosidad') || lowerPrompt.includes('sorpréndeme')) {
    const fact = await getFunFact()
    return `Aquí tienes un dato curioso: ${fact}`
  }
  
  // 🌍 Comandos de ubicación
  if (lowerPrompt.includes('mi ubicación') || lowerPrompt.includes('donde estoy') || lowerPrompt.includes('mi ip')) {
    const location = await getLocationInfo()
    if (location) {
      return `Tu IP es ${location.ip}. Te encuentras en ${location.city}, ${location.region}, ${location.country}. Zona horaria: ${location.timezone}.`
    } else {
      return "No pude obtener tu información de ubicación."
    }
  }
  
  return null // No es un comando de API
}

// ========================================
// 🗣️ SÍNTESIS DE VOZ
// ========================================

let availableVoices = []
let preferredVoice = null

function initializeVoices() {
  availableVoices = speechSynthesis.getVoices()
  
  const spanishVoices = availableVoices.filter(voice => 
    voice.lang.startsWith('es')
  )
  
  preferredVoice = spanishVoices.find(voice => 
    voice.name.includes('Google') || voice.name.includes('Lucía')
  ) || spanishVoices[0] || availableVoices[0]
}

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = initializeVoices
}

function speakText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return
  
  speechSynthesis.cancel()
  
  const cleanedText = cleanText(text)
  if (!cleanedText) return
  
  const utterance = new SpeechSynthesisUtterance(cleanedText)
  
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }
  
  utterance.lang = 'es-ES'
  utterance.rate = 0.9
  utterance.pitch = 1
  utterance.volume = 1
  
  utterance.onstart = () => console.log('🎤 Iniciando lectura')
  utterance.onend = () => console.log('✅ Lectura completada')
  utterance.onerror = (event) => console.error('❌ Error en síntesis:', event.error)
  
  speechSynthesis.speak(utterance)
}

function stopSpeaking() {
  speechSynthesis.cancel()
}

// ========================================
// 💬 MENSAJES DEL SISTEMA
// ========================================

const WELCOME_MESSAGES = [
  "¡Hola! Soy EndyOS y estoy listo para lo que se te ocurra.",
  "¡Saludos! Soy EndyOS, tu compañero digital favorito. ¿Comenzamos?",
  "¡Hey! EndyOS aquí. ¿Qué tal si empezamos con algo interesante?",
  "EndyOS activado. ¿En qué aventura digital nos metemos hoy?"
]

const THINKING_MESSAGES = [
  "EndyOS procesando... Dame un segundo que estoy pensando.",
  "Hmm, déjame analizar esto con mi cerebro EndyOS...",
  "EndyOS calculando... Un momento mientras proceso tu solicitud.",
  "Dame un momento para procesar tu consulta..."
]

function getRandomMessage(messageArray) {
  return messageArray[Math.floor(Math.random() * messageArray.length)]
}

// ========================================
// 🔧 PROCESADOR MEJORADO DE COMANDOS
// ========================================

function processBrowserCommand(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  
  // Comando: "abre youtube" o "abrir youtube"
  if (lowerPrompt.includes('abre youtube') || lowerPrompt.includes('abrir youtube')) {
    return openYouTube()
  }
  
  // Comando: "reproduce en youtube [algo]" - MEJORADO
  const playYoutubeMatch = lowerPrompt.match(/(?:reproduce|reproducir|pon|poner|play).*?(?:en youtube|youtube)\s+(.+)/) ||
                          lowerPrompt.match(/(?:youtube).*?(?:reproduce|reproducir|pon|poner|play)\s+(.+)/)
  if (playYoutubeMatch) {
    const query = playYoutubeMatch[1].trim()
    
    // Opción para reproductor embebido o ventana nueva
    if (lowerPrompt.includes('aquí') || lowerPrompt.includes('integrado') || lowerPrompt.includes('embebido')) {
      return playYouTubeEmbedded(query)
    } else {
      return searchAndPlayYouTube(query)
    }
  }
  
  // Comando: "busca en youtube [algo]"
  const youtubeSearchMatch = lowerPrompt.match(/(?:busca en youtube|buscar en youtube)\s+(.+)/) || 
                            lowerPrompt.match(/en youtube\s+(.+)/)
  if (youtubeSearchMatch) {
    const query = youtubeSearchMatch[1].trim()
    return openYouTube(query, false)
  }
  
  // Comando: "abre [página web]"
  const openMatch = lowerPrompt.match(/(?:abre|abrir)\s+(.+)/)
  if (openMatch) {
    const site = openMatch[1].trim()
    
    if (site.includes('.') || site.startsWith('http')) {
      return openURL(site)
    } else {
      return searchGoogle(`sitio ${site}`)
    }
  }
  
  // Comando: "busca [algo]"
  const searchMatch = lowerPrompt.match(/busca?\s+(.+)/) || lowerPrompt.match(/buscar\s+(.+)/)
  if (searchMatch) {
    const query = searchMatch[1]
    return searchGoogle(query)
  }
  
  // Comando directo de URL
  if (lowerPrompt.includes('http') || lowerPrompt.match(/\w+\.\w+/)) {
    const urlMatch = prompt.match(/(https?:\/\/[^\s]+)/) || prompt.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (urlMatch) {
      return openURL(urlMatch[1])
    }
  }
  
  return null
}

// ========================================
// 🚀 INICIALIZACIÓN Y MANEJO DE EVENTOS
// ========================================

window.addEventListener('load', () => {
  setTimeout(async () => {
    initializeVoices()
    
    const welcomeMsg = getRandomMessage(WELCOME_MESSAGES)
    speakText(welcomeMsg)
  }, 1000)
})

const form = document.querySelector('#form')
const promptInput = document.querySelector('#prompt')
let isProcessing = false

form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  if (isProcessing) return
  
  const prompt = promptInput.value.trim()
  if (!prompt) {
    speakText("Por favor, escribe algo para que EndyOS pueda ayudarte.")
    return
  }
  
  isProcessing = true
  
  try {
    // 1. Verificar comandos de navegador PRIMERO
    const browserCommand = processBrowserCommand(prompt)
    if (browserCommand) {
      // Manejar promesas y valores regulares
      if (browserCommand instanceof Promise) {
        const result = await browserCommand
        speakText(result)
      } else {
        speakText(browserCommand)
      }
      promptInput.value = ''
      return
    }
    
    // 2. Verificar comandos de API
    const apiResponse = await processApiCommand(prompt)
    if (apiResponse) {
      speakText(apiResponse)
      promptInput.value = ''
      return
    }
    
    // 3. Si no es comando específico, usar IA
    const cacheKey = prompt.toLowerCase()
    if (MESSAGE_CACHE.has(cacheKey)) {
      const cachedResponse = MESSAGE_CACHE.get(cacheKey)
      speakText(cachedResponse)
      return
    }
    
    speakText(getRandomMessage(THINKING_MESSAGES))
    
    const response = await streamText({
      model: openrouter('deepseek/deepseek-chat-v3.1:free'),
      prompt: `Responde de manera natural como EndyOS, con personalidad Humana: ${prompt}`,
      temperature: 1
    })
    
    let fullText = ''
    for await (const chunk of response.textStream) {
      fullText += chunk
    }
    
    if (fullText.trim()) {
      const cleanedResponse = cleanText(fullText)
      
      // Gestión del cache 
      if (MESSAGE_CACHE.size >= 50) {
        const firstKey = MESSAGE_CACHE.keys().next().value
        MESSAGE_CACHE.delete(firstKey)
      }
      MESSAGE_CACHE.set(cacheKey, cleanedResponse)
      
      speakText(cleanedResponse)
    }
    
  } catch (error) {
    console.error('Error:', error)
    speakText("Lo siento, EndyOS tuvo un pequeño problema. ¿Intentamos de nuevo?")
  } finally {
    isProcessing = false
    promptInput.value = ''
  }
})

promptInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    form.dispatchEvent(new Event('submit'))
  }
})

// Inicializar voces después de un breve delay
setTimeout(initializeVoices, 500)

// ========================================
// 📤 EXPORTS
// ========================================

export { 
  speakText, 
  stopSpeaking, 
  openURL, 
  openYouTube, 
  searchGoogle,
  searchAndPlayYouTube,
  playYouTubeEmbedded,
  searchYouTubeVideo,
  createYouTubePlayer,
  getWeather,
  getCrypto,
  getFunFact,
  getLocationInfo
}