// ========================================
// 🔧 PROCESADOR DE COMANDOS
// ========================================
import { youtubeService } from '../services/youtubeService.js'
import { browserService } from '../services/browserService.js'
import { apiService } from '../services/apiService.js'

class CommandProcessor {
  /**
   * Procesa comandos relacionados con YouTube
   * @param {string} prompt - Comando del usuario
   * @returns {string|Promise<string>|null} - Resultado del comando
   */
  processYouTubeCommand(prompt) {
    const lowerPrompt = prompt.toLowerCase()
    
    // Comando: "abre youtube" o "abrir youtube"
    if (lowerPrompt.includes('abre youtube') || lowerPrompt.includes('abrir youtube')) {
      return youtubeService.open()
    }
    
    // Comando: "reproduce en youtube [algo]"
    const playYoutubeMatch = lowerPrompt.match(/(?:reproduce|reproducir|pon|poner|play).*?(?:en youtube|youtube)\s+(.+)/) ||
                            lowerPrompt.match(/(?:youtube).*?(?:reproduce|reproducir|pon|poner|play)\s+(.+)/)
    if (playYoutubeMatch) {
      const query = playYoutubeMatch[1].trim()
      
      // Opción para reproductor embebido
      if (lowerPrompt.includes('aquí') || lowerPrompt.includes('integrado') || lowerPrompt.includes('embebido')) {
        return youtubeService.playEmbedded(query)
      } else {
        return youtubeService.searchAndPlay(query)
      }
    }
    
    // Comando: "busca en youtube [algo]"
    const youtubeSearchMatch = lowerPrompt.match(/(?:busca en youtube|buscar en youtube)\s+(.+)/) || 
                              lowerPrompt.match(/en youtube\s+(.+)/)
    if (youtubeSearchMatch) {
      const query = youtubeSearchMatch[1].trim()
      return youtubeService.open(query, false)
    }
    
    return null
  }

  /**
   * Procesa comandos del navegador
   * @param {string} prompt - Comando del usuario
   * @returns {string|null} - Resultado del comando
   */
  processBrowserCommand(prompt) {
    // Primero verificar comandos de YouTube
    const youtubeResult = this.processYouTubeCommand(prompt)
    if (youtubeResult) return youtubeResult
    
    // Luego otros comandos de navegador
    return browserService.processBrowserCommand(prompt)
  }

  /**
   * Procesa todos los tipos de comandos
   * @param {string} prompt - Comando del usuario
   * @returns {Promise<string|null>} - Resultado del comando
   */
  async processCommand(prompt) {
    // 1. Verificar comandos de navegador (incluye YouTube)
    const browserResult = this.processBrowserCommand(prompt)
    if (browserResult) {
      // Manejar tanto valores síncronos como promesas
      return browserResult instanceof Promise ? await browserResult : browserResult
    }
    
    // 2. Verificar comandos de API
    const apiResult = await apiService.processApiCommand(prompt)
    if (apiResult) return apiResult
    
    // 3. No es un comando específico
    return null
  }

  /**
   * Verifica si el prompt contiene un comando específico
   * @param {string} prompt - Comando del usuario
   * @returns {boolean} - True si es un comando
   */
  isCommand(prompt) {
    const lowerPrompt = prompt.toLowerCase()
    
    // Comandos de navegador/YouTube
    const browserCommands = [
      'abre', 'abrir', 'busca', 'buscar', 'reproduce', 'reproducir', 
      'pon', 'poner', 'play', 'youtube'
    ]
    
    // Comandos de API
    const apiCommands = [
      'clima', 'tiempo', 'bitcoin', 'crypto', 'ethereum', 
      'dato curioso', 'curiosidad', 'sorpréndeme', 
      'mi ubicación', 'donde estoy', 'mi ip'
    ]
    
    const allCommands = [...browserCommands, ...apiCommands]
    
    return allCommands.some(cmd => lowerPrompt.includes(cmd)) ||
           /https?:\/\//.test(prompt) ||
           /\w+\.\w+/.test(prompt)
  }
}

export const commandProcessor = new CommandProcessor()