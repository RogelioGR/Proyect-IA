// ========================================
// 📝 UTILIDADES DE TEXTO
// ========================================
import removeMarkdown from 'remove-markdown'

/**
 * Limpia texto de caracteres especiales y markdown
 * @param {string} text - Texto a limpiar
 * @returns {string} - Texto limpio
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return ''
  return removeMarkdown(text).replace(/\s+/g, ' ').trim()
}

/**
 * Obtiene un mensaje aleatorio de un array
 * @param {Array} messageArray - Array de mensajes
 * @returns {string} - Mensaje aleatorio
 */
export const getRandomMessage = (messageArray) => {
  return messageArray[Math.floor(Math.random() * messageArray.length)]
}

/**
 * Extrae ciudad del prompt de clima
 * @param {string} prompt - Prompt del usuario
 * @returns {string} - Ciudad extraída o 'Madrid' por defecto
 */
export const extractCityFromPrompt = (prompt) => {
  const lowerPrompt = prompt.toLowerCase()
  
  const cityMatch = lowerPrompt.match(/(?:clima|tiempo).*?(?:en|de)\s+([a-záéíóúñ\s]+)/) ||
                   lowerPrompt.match(/([a-záéíóúñ\s]+).*?(?:clima|tiempo)/)
  
  return cityMatch ? cityMatch[1].trim() : 'Cancun'
}

/**
 * Extrae monedas del prompt de crypto
 * @param {string} prompt - Prompt del usuario  
 * @returns {Array} - Array de monedas
 */
export const extractCoinsFromPrompt = (prompt) => {
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('bitcoin') && !lowerPrompt.includes('ethereum')) {
    return ['bitcoin']
  } else if (lowerPrompt.includes('ethereum') && !lowerPrompt.includes('bitcoin')) {
    return ['ethereum']
  }
  
  return ['bitcoin', 'ethereum']
}    