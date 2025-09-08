
import './style.css'

// Importar servicios y utilidades
import { speechService, speakText } from './services/speechService.js'
import { commandProcessor } from './processors/commandProcessor.js'
import { aiService } from './services/aiService.js'
import { getRandomMessage } from './Utils/textUtils.js'
import { WELCOME_MESSAGES, THINKING_MESSAGES } from './config/constants.js'

// Clase principal

class EndyOSApp {
  constructor() {
    this.isProcessing = false
    this.form = null
    this.promptInput = null
    this.initialized = false
    this.retryCount = 0
    this.maxRetries = 3
  }

  
  async initialize() {
    if (this.initialized) return

      this.form = document.querySelector('#form')
      this.promptInput = document.querySelector('#prompt')

      if (!this.form || !this.promptInput) {
        console.error('Elementos del DOM no encontrados')
        throw new Error('DOM elements not found')
      }

      // Configurar eventos
      this.setupEventListeners()

      // Inicializar servicios
      await this.initializeServices()

      // Mensaje de bienvenida
      this.showWelcomeMessage()
  }

  /**
   * @param {Error} error - Error de inicialización
   */
  handleInitializationError(error) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(`🔄 Reintentando inicialización (${this.retryCount}/${this.maxRetries})...`)
      setTimeout(() => this.initialize(), 2000 * this.retryCount)
    } else {
      console.error('💥 EndyOS no pudo inicializarse después de varios intentos')
      // Mostrar mensaje de error en la interfaz si es posible
      this.showErrorMessage('EndyOS no pudo inicializarse. Recarga la página.')
    }
  }

  /**
   * @param {string} message - Mensaje de error
   */
  showErrorMessage(message) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'error-message'
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
    `
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)

    // Remover después de 5 segundos
    setTimeout(() => errorDiv.remove(), 5000)
  }

  /**
   * Inicializa los servicios
   */
  async initializeServices() {
    try {
      console.log('🔧 Inicializando servicios...')
      
      // Inicializar síntesis de voz
      await speechService.initializeVoices()
      console.log('🔊 Servicio de voz inicializado')
      
      // Verificar disponibilidad de servicios
      if (!aiService.isAvailable()) {
        console.warn('⚠️ Servicio de IA no disponible - falta API key')
      } else {
        console.log('🤖 Servicio de IA disponible')
      }

      // Verificar commandProcessor
      if (commandProcessor && typeof commandProcessor.processCommand === 'function') {
        console.log('⚡ Procesador de comandos cargado')
      } else {
        console.warn('⚠️ Procesador de comandos no disponible')
      }

    } catch (error) {
      console.error('❌ Error inicializando servicios:', error)
      throw error
    }
  }

  /**
   * Configura los event listeners
   */
  setupEventListeners() {
    if (!this.form || !this.promptInput) {
      throw new Error('Form elements not available for event setup')
    }

    // Submit del formulario
    this.form.addEventListener('submit', (e) => this.handleSubmit(e))

    // Enter en el input
    this.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.form.dispatchEvent(new Event('submit'))
      }
    })

    // Limpiar input cuando se hace clic
    this.promptInput.addEventListener('focus', () => {
      if (this.promptInput.value.trim() === '') {
        this.promptInput.placeholder = 'Escribe tu comando o pregunta...'
      }
    })

    // Prevenir envío múltiple
    this.promptInput.addEventListener('input', () => {
      if (this.isProcessing) {
        this.promptInput.style.opacity = '0.7'
      } else {
        this.promptInput.style.opacity = '1'
      }
    })

    console.log('📝 Event listeners configurados')
  }

  /**
   * Muestra mensaje de bienvenida
   */
  showWelcomeMessage() {
    setTimeout(() => {
      try {
        const welcomeMsg = getRandomMessage(WELCOME_MESSAGES)
        speakText(welcomeMsg)
        console.log('👋 Mensaje de bienvenida reproducido')
      } catch (error) {
        console.error('Error en mensaje de bienvenida:', error)
        speakText("Hola, soy EndyOS, tu asistente virtual.")
      }
    }, 1000)
  }

  /**
   * Maneja el envío del formulario
   * @param {Event} e - Evento de submit
   */
  async handleSubmit(e) {
    e.preventDefault()
    
    if (this.isProcessing) {
      console.log('⏳ Ya procesando solicitud anterior...')
      return
    }
    
    const prompt = this.promptInput.value.trim()
    if (!prompt) {
      speakText("Por favor, escribe algo para que EndyOS pueda ayudarte.")
      return
    }

    console.log('📝 Procesando comando:', prompt)
    this.isProcessing = true
    
    // Indicador visual de procesamiento
    this.setProcessingState(true)
    
    try {
      await this.processUserInput(prompt)
    } catch (error) {
      console.error('❌ Error procesando entrada:', error)
      await this.handleProcessingError(error)
    } finally {
      this.isProcessing = false
      this.setProcessingState(false)
      this.promptInput.value = ''
      this.promptInput.focus()
    }
  }

  /**
   * Establece el estado visual de procesamiento
   * @param {boolean} processing - Si está procesando
   */
  setProcessingState(processing) {
    if (this.promptInput) {
      this.promptInput.disabled = processing
      this.promptInput.style.opacity = processing ? '0.7' : '1'
      this.promptInput.placeholder = processing ? 'EndyOS está pensando...' : 'Escribe tu comando o pregunta...'
    }

    if (this.form) {
      this.form.style.pointerEvents = processing ? 'none' : 'all'
    }
  }

  /**
   * Maneja errores de procesamiento
   * @param {Error} error - Error ocurrido
   */
  async handleProcessingError(error) {
    let message = "Lo siento, EndyOS tuvo un pequeño problema. ¿Intentamos de nuevo?"

    if (error.message.includes('API')) {
      message = "Hay un problema con el servicio de IA. Verifica tu conexión."
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      message = "Problemas de conexión. Verifica tu internet."
    } else if (error.message.includes('timeout')) {
      message = "La respuesta tardó demasiado. ¿Intentamos con algo más simple?"
    }

    speakText(message)
  }

  /**
   * Procesa la entrada del usuario
   * @param {string} prompt - Entrada del usuario
   */
  async processUserInput(prompt) {
    try {
      // 1. Verificar comandos específicos primero
      if (commandProcessor && typeof commandProcessor.processCommand === 'function') {
        const commandResult = await commandProcessor.processCommand(prompt)
        
        if (commandResult) {
          console.log('⚡ Comando procesado:', commandResult.substring(0, 50) + '...')
          speakText(commandResult)
          return
        }
      }

      // 2. Si no es comando específico, usar IA
      if (!aiService.isAvailable()) {
        speakText("Lo siento, el servicio de IA no está disponible en este momento.")
        return
      }

      // Mostrar mensaje de "pensando"
      const thinkingMsg = getRandomMessage(THINKING_MESSAGES)
      speakText(thinkingMsg)

      console.log('🤖 Generando respuesta con IA...')

      // Generar respuesta con IA con timeout
      const aiResponse = await Promise.race([
        aiService.generateResponse(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI response timeout')), 30000)
        )
      ])
      
      if (aiResponse && aiResponse.trim()) {
        console.log('✅ Respuesta IA generada:', aiResponse.substring(0, 50) + '...')
        speakText(aiResponse)
      } else {
        speakText("No pude generar una respuesta. ¿Puedes intentar reformular tu pregunta?")
      }

    } catch (error) {
      console.error('❌ Error procesando entrada del usuario:', error)
      throw error // Re-lanzar para manejo en handleSubmit
    }
  }

  /**
   * Obtiene estadísticas de la aplicación
   * @returns {Object} - Estadísticas
   */
  getStats() {
    return {
      initialized: this.initialized,
      processing: this.isProcessing,
      retryCount: this.retryCount,
      aiAvailable: aiService?.isAvailable() || false,
      speechAvailable: speechService?.initialized || false,
      modelInfo: aiService?.getModelInfo() || null,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Reinicia la aplicación
   */
  reset() {
    
    try {
      speechService.stop()
      
      if (aiService && typeof aiService.clearCache === 'function') {
        aiService.clearCache()
      }
      
      this.isProcessing = false
      this.retryCount = 0
      
      if (this.promptInput) {
        this.promptInput.value = ''
        this.promptInput.disabled = false
        this.promptInput.style.opacity = '1'
      }
      
      this.setProcessingState(false)
      console.log('✅ EndyOS reiniciado')
      
    } catch (error) {
      console.error('❌ Error reiniciando:', error)
    }
  }

  /**
   * Destruye la aplicación
   */
  destroy() {
    console.log('💥 Destruyendo EndyOS...')
    
    try {
      speechService.stop()
      this.initialized = false
      this.isProcessing = false
      
      // Limpiar event listeners si es necesario
      if (this.form) {
        this.form.removeEventListener('submit', this.handleSubmit)
      }
      
      console.log('✅ EndyOS destruido')
      
    } catch (error) {
      console.error('❌ Error destruyendo:', error)
    }
  }
}

// ========================================
// 🚀 INICIALIZACIÓN
// ========================================

// Crear instancia global de la aplicación
const endyOSApp = new EndyOSApp()

// Función de inicialización robusta
async function initializeEndyOS() {
  try {
    console.log('🚀 Iniciando EndyOS...')
    await endyOSApp.initialize()
  } catch (error) {
    console.error('💥 Error crítico en inicialización:', error)
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEndyOS)
} else {
  initializeEndyOS()
}

// Inicializar cuando la ventana se cargue completamente
window.addEventListener('load', () => {
  console.log('🪟 Ventana cargada completamente')
  // Re-inicializar síntesis de voz por si acaso
  setTimeout(() => {
    try {
      speechService.initializeVoices()
    } catch (error) {
      console.error('Error re-inicializando voz:', error)
    }
  }, 500)
})

// Manejar errores globales
window.addEventListener('error', (event) => {
  console.error('💥 Error global:', event.error)
  
  if (endyOSApp.initialized && !endyOSApp.isProcessing) {
    speakText("EndyOS detectó un error. Sistema reiniciándose...")
    setTimeout(() => {
      try {
        endyOSApp.reset()
      } catch (error) {
        console.error('Error en reinicio automático:', error)
      }
    }, 2000)
  }
})

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Promesa rechazada no manejada:', event.reason)
  event.preventDefault() // Prevenir que aparezca en la consola
  
  if (endyOSApp.initialized) {
    speakText("Se detectó un error en segundo plano.")
  }
})

// ========================================
// 🔧 FUNCIONES DE UTILIDAD GLOBAL
// ========================================

// Función global para obtener estadísticas
window.getEndyOSStats = () => endyOSApp.getStats()

// Función global para reiniciar
window.resetEndyOS = () => endyOSApp.reset()

// ========================================
// 📤 EXPORTS PARA COMPATIBILIDAD
// ========================================
export default endyOSApp

// Re-exportar funciones principales para compatibilidad hacia atrás
export { 
  speakText
} from './services/speechService.js'

export const stopSpeaking = () => {
  try {
    return speechService.stop()
  } catch (error) {
    console.error('Error deteniendo voz:', error)
  }
}

export { 
  openURL, 
  searchGoogle 
} from './services/browserService.js'

export { 
  searchYouTubeVideo,
  openYouTube,
  searchAndPlayYouTube,
  createYouTubePlayer,
  playYouTubeEmbedded
} from './services/youtubeService.js'

export { 
  getWeather,
  getCrypto,
  getFunFact,
  getLocationInfo
} from './services/apiService.js'