import './style.css'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText } from 'ai'
import removeMarkdown from 'remove-markdown'

const openrouter = createOpenRouter({
  apiKey: import.meta.env.VITE_OPENROUTER_KEY  
})

// Cache para mensajes y configuración optimizada
const MESSAGE_CACHE = new Map()
const EMOTIONAL_PATTERNS = {
  joy: ['feliz', 'alegre', 'genial', 'excelente', 'maravilloso', '¡', 'éxito'],
  sadness: ['triste', 'lamento', 'desafortunadamente', 'problema', 'error', 'mal'],
  excitement: ['increíble', 'fantástico', 'sorprendente', 'wow', 'impresionante'],
  calm: ['tranquilo', 'relajado', 'serenamente', 'pausadamente', 'suavemente'],
  urgent: ['rápido', 'urgente', 'inmediatamente', 'pronto', 'ya', 'ahora']
}

// Función optimizada para limpiar markdown y texto
function cleanMarkdownText(text) {
  return removeMarkdown(text, {
    stripListLeaders: true,
    listUnicodeChar: '',
    gfm: true,
    useImgAltText: false
  });
}

// Función optimizada para limpiar texto completo
const cleanText = (() => {
  const patterns = [
    /```[\s\S]*?```/g,        
    /https?:\/\/[^\s]+/gi,    
    /\b\d+\.\d+\b/g,          
    /[^\w\s\.,;:!?¿¡áéíóúñü]/gi, 
    /\s+/g,                   
    /\n\s*\n/g               
  ]
  
  const replacements = [
    '',
    'enlace',
    (match) => match.replace('.', ' punto '),
    '',
    ' ',
    '\n'
  ]
  
  return (text) => {
    // Primero limpiar markdown
    let cleaned = cleanMarkdownText(text)
    
    // Luego aplicar patrones adicionales
    patterns.forEach((pattern, i) => {
      if (typeof replacements[i] === 'function') {
        cleaned = cleaned.replace(pattern, replacements[i])
      } else {
        cleaned = cleaned.replace(pattern, replacements[i])
      }
    })
    
    return cleaned.trim()
  }
})()

// Detección emocional optimizada
function detectEmotion(text) {
  const lowerText = text.toLowerCase()
  let maxScore = 0
  let dominantEmotion = 'neutral'
  
  Object.entries(EMOTIONAL_PATTERNS).forEach(([emotion, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      const matches = (lowerText.match(new RegExp(keyword, 'gi')) || []).length
      return acc + matches
    }, 0)
    
    if (score > maxScore) {
      maxScore = score
      dominantEmotion = emotion
    }
  })
  
  return { emotion: dominantEmotion, intensity: Math.min(maxScore * 0.2, 1) }
}

// Configuración emocional para la voz
function getEmotionalVoiceSettings(emotion, intensity) {
  const baseSettings = { rate: 0.9, pitch: 1, volume: 1 }
  
  const emotionalSettings = {
    joy: { rate: 1.1, pitch: 1.2, volume: 1 },
    sadness: { rate: 0.7, pitch: 0.8, volume: 0.9 },
    excitement: { rate: 1.2, pitch: 1.3, volume: 1 },
    calm: { rate: 0.8, pitch: 0.9, volume: 0.8 },
    urgent: { rate: 1.3, pitch: 1.1, volume: 1 },
    neutral: baseSettings
  }
  
  const settings = emotionalSettings[emotion] || baseSettings
  
  // Aplicar intensidad emocional
  return {
    rate: baseSettings.rate + (settings.rate - baseSettings.rate) * intensity,
    pitch: baseSettings.pitch + (settings.pitch - baseSettings.pitch) * intensity,
    volume: baseSettings.volume + (settings.volume - baseSettings.volume) * intensity
  }
}

// Pool de voces para mejor rendimiento
let availableVoices = []
let preferredVoice = null

function initializeVoices() {
  availableVoices = speechSynthesis.getVoices()
  
  // Buscar la mejor voz en español
  const spanishVoices = availableVoices.filter(voice => 
    voice.lang.startsWith('es') && !voice.name.includes('Microsoft')
  )
  
  preferredVoice = spanishVoices.find(voice => voice.name.includes('Google')) || 
                   spanishVoices.find(voice => voice.name.includes('Lucía')) ||
                   spanishVoices[0] ||
                   availableVoices[0]
}

// Inicializar voces cuando estén disponibles
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = initializeVoices
}

// Función optimizada de texto a voz con emociones
function speakText(text) {
  // Cancelar lectura anterior
  speechSynthesis.cancel()
  
  if (!text || text.trim().length === 0) return
  
  const cleanedText = cleanText(text)
  const emotional = detectEmotion(cleanedText)
  const voiceSettings = getEmotionalVoiceSettings(emotional.emotion, emotional.intensity)
  
  console.log(`Emoción detectada: ${emotional.emotion} (intensidad: ${emotional.intensity.toFixed(2)})`)
  
  const utterance = new SpeechSynthesisUtterance(cleanedText)
  
  // Configurar voz
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }
  
  utterance.lang = 'es-ES'
  utterance.rate = Math.max(0.5, Math.min(2, voiceSettings.rate))
  utterance.pitch = Math.max(0, Math.min(2, voiceSettings.pitch))
  utterance.volume = Math.max(0, Math.min(1, voiceSettings.volume))
  
  // Eventos optimizados
  utterance.onstart = () => console.log(`🎤 Hablando con emoción: ${emotional.emotion}`)
  utterance.onend = () => console.log('✅ Lectura completada')
  utterance.onerror = (event) => console.error('❌ Error en síntesis:', event.error)
  
  speechSynthesis.speak(utterance)
}

// Mensajes optimizados con más variedad emocional
const WELCOME_MESSAGES = [
  { text: "¡Hola! Soy tu asistente EndyOS. ¡Estoy emocionado de ayudarte hoy!", emotion: "joy" },
  { text: "¡Bienvenido! Me alegra verte por aquí. ¿En qué puedo ayudarte?", emotion: "joy" },
  { text: "Hola, soy EndyOS, tu asistente inteligente. Estoy aquí para lo que necesites.", emotion: "calm" },
  { text: "¡Saludos! Soy tu asistente virtual. ¿Qué aventura de conocimiento tendremos hoy?", emotion: "excitement" }
]

const THINKING_MESSAGES = [
  { text: "Hmm, interesante pregunta. Déjame procesar esto...", emotion: "calm" },
  { text: "¡Qué consulta tan fascinante! Dame un momento para analizarla...", emotion: "excitement" },
  { text: "Procesando tu solicitud con cuidado...", emotion: "calm" },
  { text: "¡Me encanta este tipo de preguntas! Trabajando en la respuesta...", emotion: "joy" },
  { text: "Analizando todos los aspectos de tu consulta...", emotion: "neutral" }
]

// Función para obtener mensaje aleatorio
const getRandomMessage = (messageArray) => 
  messageArray[Math.floor(Math.random() * messageArray.length)]

// Inicialización con delay para mejor UX
window.addEventListener('load', () => {
  setTimeout(() => {
    initializeVoices() // Asegurar que las voces estén cargadas
    const welcomeMsg = getRandomMessage(WELCOME_MESSAGES)
    speakText(welcomeMsg.text)
  }, 1200) // Delay ligeramente mayor para mejor inicialización
})

// Manejo del formulario optimizado
const form = document.querySelector('#form')
const promptInput = document.querySelector('#prompt')

// Debounce para evitar múltiples envíos
let isProcessing = false

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  if (isProcessing) return
  
  const prompt = promptInput.value.trim()
  if (!prompt) {
    speakText("Por favor, escribe algo para que pueda ayudarte.")
    return
  }
  
  isProcessing = true
  
  try {
    // Verificar cache primero
    const cacheKey = prompt.toLowerCase()
    if (MESSAGE_CACHE.has(cacheKey)) {
      const cachedResponse = MESSAGE_CACHE.get(cacheKey)
      speakText(cachedResponse)
      return
    }
    
    // Mensaje de procesamiento con emoción
    const thinkingMsg = getRandomMessage(THINKING_MESSAGES)
    speakText(thinkingMsg.text)
    
    const response = streamText({
      model: openrouter('deepseek/deepseek-chat-v3.1:free'),
      prompt: `Responde de manera conversacional y natural, mostrando emociones apropiadas según el contexto: ${prompt}`
    })
    
    let fullText = ''
    
    // Streaming optimizado
    for await (const chunk of response.textStream) {
      fullText += chunk
    }
    
    if (fullText.trim()) {
      const cleanedResponse = cleanText(fullText)
      
      // Guardar en cache (máximo 50 entradas)
      if (MESSAGE_CACHE.size >= 50) {
        const firstKey = MESSAGE_CACHE.keys().next().value
        MESSAGE_CACHE.delete(firstKey)
      }
      MESSAGE_CACHE.set(cacheKey, cleanedResponse)
      
      speakText(cleanedResponse)
    }
    
  } catch (error) {
    console.error('Error:', error)
    speakText("Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.")
  } finally {
    isProcessing = false
    promptInput.value = '' // Limpiar input
  }
})

// Función mejorada para detener
function stopSpeaking() {
  speechSynthesis.cancel()
  console.log('🔇 Lectura detenida')
}

// Añadir soporte para tecla Enter sin Shift
promptInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    form.dispatchEvent(new Event('submit'))
  }
})

// Precargar voces cuando sea posible
setTimeout(initializeVoices, 500)

// Exportar funciones útiles
export { speakText, stopSpeaking, detectEmotion, cleanMarkdownText }