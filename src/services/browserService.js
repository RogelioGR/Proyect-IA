// ========================================
// 🌐 SERVICIO DE NAVEGADOR
// ========================================

class BrowserService {
  /**
   * Abre una URL en una nueva pestaña
   * @param {string} url - URL a abrir
   * @returns {string} - Mensaje de confirmación
   */
  openURL(url) {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      window.open(url, '_blank')
      return `EndyOS abriendo ${url}`
    } catch (error) {
      console.error('Error abriendo URL:', error)
      return `EndyOS no pudo abrir ${url}. Verifica la dirección.`
    }
  }

  /**
   * Realiza una búsqueda en Google
   * @param {string} query - Término de búsqueda
   * @returns {string} - Mensaje de confirmación
   */
  searchGoogle(query) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
      window.open(searchUrl, '_blank')
      return `EndyOS buscando "${query}" en Google`
    } catch (error) {
      console.error('Error en búsqueda de Google:', error)
      return `EndyOS no pudo realizar la búsqueda en Google`
    }
  }

  /**
   * Abre sitios web populares directamente
   * @param {string} siteName - Nombre del sitio
   * @returns {string|null} - URL del sitio o null si no se encuentra
   */
  getPopularSiteURL(siteName) {
    const sites = {
      'facebook': 'https://facebook.com',
      'twitter': 'https://twitter.com',
      'instagram': 'https://instagram.com',
      'linkedin': 'https://linkedin.com',
      'github': 'https://github.com',
      'stackoverflow': 'https://stackoverflow.com',
      'reddit': 'https://reddit.com',
      'netflix': 'https://netflix.com',
      'amazon': 'https://amazon.com',
      'gmail': 'https://gmail.com',
      'google drive': 'https://drive.google.com',
      'whatsapp': 'https://web.whatsapp.com',
      'telegram': 'https://web.telegram.org',
      'discord': 'https://discord.com/app',
      'spotify': 'https://open.spotify.com',
      'twitch': 'https://twitch.tv'
    }

    const normalizedName = siteName.toLowerCase().trim()
    return sites[normalizedName] || null
  }

  /**
   * Procesa comandos de navegador del prompt
   * @param {string} prompt - Comando del usuario
   * @returns {string|null} - Resultado del comando o null si no aplica
   */
  processBrowserCommand(prompt) {
    const lowerPrompt = prompt.toLowerCase()
    
    // Comando: "abre [sitio/url]"
    const openMatch = lowerPrompt.match(/(?:abre|abrir)\s+(.+)/)
    if (openMatch) {
      const target = openMatch[1].trim()
      
      // Verificar si es una URL
      if (target.includes('.') || target.startsWith('http')) {
        return this.openURL(target)
      }
      
      // Verificar sitios populares
      const siteURL = this.getPopularSiteURL(target)
      if (siteURL) {
        return this.openURL(siteURL)
      }
      
      // Si no es reconocido, buscar en Google
      return this.searchGoogle(`sitio ${target}`)
    }
    
    // Comando: "busca [algo]"
    const searchMatch = lowerPrompt.match(/(?:busca|buscar)\s+(.+)/)
    if (searchMatch) {
      const query = searchMatch[1].trim()
      return this.searchGoogle(query)
    }
    
    // Comando directo de URL
    const urlMatch = prompt.match(/(https?:\/\/[^\s]+)/) || prompt.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    if (urlMatch && (lowerPrompt.includes('http') || lowerPrompt.match(/\w+\.\w+/))) {
      return this.openURL(urlMatch[1])
    }
    
    return null
  }

  /**
   * Valida si una cadena parece ser una URL
   * @param {string} str - Cadena a validar
   * @returns {boolean} - True si parece URL
   */
  isValidURL(str) {
    try {
      const url = str.startsWith('http') ? str : `https://${str}`
      new URL(url)
      return str.includes('.')
    } catch {
      return false
    }
  }

  /**
   * Extrae el dominio de una URL
   * @param {string} url - URL completa
   * @returns {string} - Dominio extraído
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }
}

export const browserService = new BrowserService()

// Exportar métodos individuales para compatibilidad
export const openURL = (url) => browserService.openURL(url)
export const searchGoogle = (query) => browserService.searchGoogle(query)