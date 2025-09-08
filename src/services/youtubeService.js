// ========================================
// 🎵 SERVICIO DE YOUTUBE
// ========================================
import { API_KEYS, CACHE_DURATIONS } from '../config/constants.js'
import { cacheManager } from '../Utils/CacheManager.js'

class YouTubeService {
  constructor() {
    this.apiKey = API_KEYS.YOUTUBE
  }

  /**
   * Busca un video en YouTube
   * @param {string} query - Búsqueda
   * @returns {Object|null} - Datos del video
   */
  async searchVideo(query) {
    try {
      const cacheKey = `youtube_${query.toLowerCase()}`
      
      // Verificar cache
      const cachedVideo = cacheManager.getVideo(cacheKey)
      if (cachedVideo) return cachedVideo

      if (this.apiKey) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${this.apiKey}`
        
        const response = await fetch(searchUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.items && data.items.length > 0) {
            const videoData = {
              id: data.items[0].id.videoId,
              title: data.items[0].snippet.title,
              url: `https://www.youtube.com/watch?v=${data.items[0].id.videoId}&autoplay=1`
            }
            
            // Guardar en cache
            cacheManager.setVideo(cacheKey, videoData, CACHE_DURATIONS.YOUTUBE)
            return videoData
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error buscando en YouTube:', error)
      return null
    }
  }

  /**
   * Abre YouTube en una nueva pestaña
   * @param {string} searchQuery - Búsqueda opcional
   * @param {boolean} autoplay - Si debe reproducir automáticamente
   * @returns {string} - Mensaje de confirmación
   */
  open(searchQuery = '', autoplay = false) {
    let url = 'https://www.youtube.com'
    let message = ''
    
    if (searchQuery) {
      if (autoplay) {
        return this.searchAndPlay(searchQuery)
      } else {
        url += `/results?search_query=${encodeURIComponent(searchQuery)}`
        message = `EndyOS buscando "${searchQuery}" en YouTube`
      }
    } else {
      message = `EndyOS abriendo YouTube`
    }
    
    window.open(url, '_blank')
    return message
  }

  /**
   * Busca y reproduce un video
   * @param {string} query - Búsqueda
   * @returns {string} - Mensaje de confirmación
   */
  async searchAndPlay(query) {
    try {
      const videoData = await this.searchVideo(query)
      
      if (videoData && videoData.id) {
        const playUrl = `https://www.youtube.com/watch?v=${videoData.id}&autoplay=1`
        window.open(playUrl, '_blank')
        return `EndyOS reproduciendo "${videoData.title}" en YouTube`
      } else {
        // Fallback: búsqueda normal
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        window.open(searchUrl, '_blank')
        return `EndyOS buscando "${query}" en YouTube. Haz clic en el primer video para reproducir.`
      }
      
    } catch (error) {
      console.error('Error reproduciendo YouTube:', error)
      // Fallback a búsqueda normal
      const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      window.open(fallbackUrl, '_blank')
      return `EndyOS buscando "${query}" en YouTube`
    }
  }

  /**
   * Crea un reproductor embebido
   * @param {string} videoId - ID del video
   * @param {string} containerId - ID del contenedor
   * @returns {HTMLElement} - Elemento del reproductor
   */
  createEmbeddedPlayer(videoId, containerId = 'youtube-player') {
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

  /**
   * Reproduce con reproductor embebido
   * @param {string} query - Búsqueda
   * @returns {string} - Mensaje de confirmación
   */
  async playEmbedded(query) {
    try {
      const videoData = await this.searchVideo(query)
      
      if (videoData && videoData.id) {
        this.createEmbeddedPlayer(videoData.id)
        return `EndyOS reproduciendo "${videoData.title}" en reproductor integrado`
      } else {
        // Fallback a ventana nueva
        return await this.searchAndPlay(query)
      }
      
    } catch (error) {
      console.error('Error creando reproductor:', error)
      return await this.searchAndPlay(query)
    }
  }
}

export const youtubeService = new YouTubeService()

// Exportar métodos individuales para compatibilidad
export const searchYouTubeVideo = (query) => youtubeService.searchVideo(query)
export const openYouTube = (searchQuery, autoplay) => youtubeService.open(searchQuery, autoplay)
export const searchAndPlayYouTube = (query) => youtubeService.searchAndPlay(query)
export const createYouTubePlayer = (videoId, containerId) => youtubeService.createEmbeddedPlayer(videoId, containerId)
export const playYouTubeEmbedded = (query) => youtubeService.playEmbedded(query)