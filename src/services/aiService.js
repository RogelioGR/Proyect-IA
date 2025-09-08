// ========================================
// 🤖 SERVICIO DE IA
// ========================================
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText } from 'ai'
import { API_KEYS } from '../config/constants.js'
import { cleanText } from '../Utils/textUtils.js'
import { cacheManager } from '../Utils/CacheManager.js'

class AIService {
  constructor() {
    this.openrouter = createOpenRouter({
      apiKey: API_KEYS.OPENROUTER
    })
    this.model = 'deepseek/deepseek-chat-v3.1:free'
  }

  /**
   * Genera una respuesta usando IA
   * @param {string} prompt - Prompt del usuario
   * @returns {Promise<string>} - Respuesta generada
   */
  async generateResponse(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt vacío o inválido')
    }

    const cacheKey = prompt.toLowerCase()
    
    // Verificar cache
    if (cacheManager.hasMessage(cacheKey)) {
      return cacheManager.getMessage(cacheKey)
    }

    try {
      const response = await streamText({
        model: this.openrouter(this.model),
        prompt: `Responde de manera natural como EndyOS, con personalidad humana: ${prompt}`,
        temperature: 1,
        maxTokens: 500 // Limitar tokens para respuestas más concisas
      })
      
      let fullText = ''
      for await (const chunk of response.textStream) {
        fullText += chunk
      }
      
      if (!fullText.trim()) {
        throw new Error('Respuesta vacía de la IA')
      }

      const cleanedResponse = cleanText(fullText)
      
      // Guardar en cache
      cacheManager.setMessage(cacheKey, cleanedResponse)
      
      return cleanedResponse
      
    } catch (error) {
      console.error('Error generando respuesta IA:', error)
      throw error
    }
  }

  /**
   * Verifica si el servicio está disponible
   * @returns {boolean} - True si está disponible
   */
  isAvailable() {
    return !!API_KEYS.OPENROUTER
  }

  /**
   * Obtiene información sobre el modelo actual
   * @returns {Object} - Información del modelo
   */
  getModelInfo() {
    return {
      name: this.model,
      provider: 'OpenRouter',
      available: this.isAvailable()
    }
  }

  /**
   * Cambia el modelo de IA
   * @param {string} newModel - Nombre del nuevo modelo
   */
  setModel(newModel) {
    if (typeof newModel === 'string' && newModel.trim().length > 0) {
      this.model = newModel
      console.log(`Modelo cambiado a: ${newModel}`)
    }
  }

  /**
   * Limpia el cache de mensajes
   */
  clearCache() {
    cacheManager.clearMessages()
  }

  /**
   * Genera una respuesta con contexto adicional
   * @param {string} prompt - Prompt del usuario
   * @param {string} context - Contexto adicional
   * @returns {Promise<string>} - Respuesta generada
   */
  async generateResponseWithContext(prompt, context = '') {
    const fullPrompt = context 
      ? `Contexto: ${context}\n\nUsuario: ${prompt}`
      : prompt

    return await this.generateResponse(fullPrompt)
  }

  /**
   * Genera múltiples variaciones de una respuesta
   * @param {string} prompt - Prompt del usuario
   * @param {number} variations - Número de variaciones
   * @returns {Promise<Array>} - Array de respuestas
   */
  async generateVariations(prompt, variations = 3) {
    const promises = Array.from({ length: variations }, (_, i) => 
      this.generateResponse(`${prompt} (variación ${i + 1})`)
    )

    try {
      return await Promise.all(promises)
    } catch (error) {
      console.error('Error generando variaciones:', error)
      return []
    }
  }
}

export const aiService = new AIService()