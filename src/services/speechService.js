import { cleanText } from '../Utils/textUtils.js'
import { VOICE_CONFIG } from '../config/constants.js'

class SpeechService {
  constructor() {
    this.availableVoices = []
    this.preferredVoice = null
    this.initialized = false
  }

  /**
   * Inicializa las voces disponibles
   */
  initializeVoices() {
    this.availableVoices = speechSynthesis.getVoices()
    
    const spanishVoices = this.availableVoices.filter(voice => 
      voice.lang.startsWith('es')
    )
    
    this.preferredVoice = spanishVoices.find(voice => 
      voice.name.includes('Google') || voice.name.includes('Lucía')
    ) || spanishVoices[0] || this.availableVoices[0]
    
    this.initialized = true
  }

  /**
   * Habla el texto proporcionado
   * @param {string} text - Texto a hablar
   */
  speak(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('SpeechService: Texto vacío o inválido')
      return
    }
    
    if (!this.initialized) {
      this.initializeVoices()
    }
    
    // Cancelar cualquier síntesis anterior
    speechSynthesis.cancel()
    
    const cleanedText = cleanText(text)
    if (!cleanedText) {
      console.warn('SpeechService: Texto limpio vacío')
      return
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanedText)
    
    // Configurar voz
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice
    }
    
    // Aplicar configuración
    utterance.lang = VOICE_CONFIG.lang
    utterance.rate = VOICE_CONFIG.rate
    utterance.pitch = VOICE_CONFIG.pitch
    utterance.volume = VOICE_CONFIG.volume
    
    // Manejar errores
    utterance.onerror = (event) => {
      console.error('Error en síntesis de voz:', event.error)
    }
    
    speechSynthesis.speak(utterance)
  }

  /**
   * Detiene la síntesis de voz
   */
  stop() {
    speechSynthesis.cancel()
  }

  /**
   * Verifica si está hablando
   * @returns {boolean}
   */
  isSpeaking() {
    return speechSynthesis.speaking
  }

  /**
   * Pausa la síntesis de voz
   */
  pause() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
    }
  }

  /**
   * Reanuda la síntesis de voz
   */
  resume() {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }

  /**
   * Obtiene información sobre las voces disponibles
   * @returns {Array}
   */
  getVoicesInfo() {
    return this.availableVoices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      gender: voice.gender || 'unknown',
      localService: voice.localService
    }))
  }
}

// Crear instancia singleton
export const speechService = new SpeechService()

// Inicializar cuando cambien las voces
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => speechService.initializeVoices()
}

// Exportar métodos individuales para compatibilidad
export const speakText = (text) => speechService.speak(text)
export const stopSpeaking = () => speechService.stop()