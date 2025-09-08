// ========================================
// 🗄️ GESTOR DE CACHE
// ========================================

class CacheManager {
  constructor() {
    this.messageCache = new Map()
    this.apiCache = new Map()
    this.videoCache = new Map()
  }

  // Métodos para cache de mensajes
  setMessage(key, value, maxSize = 50) {
    if (this.messageCache.size >= maxSize) {
      const firstKey = this.messageCache.keys().next().value
      this.messageCache.delete(firstKey)
    }
    this.messageCache.set(key.toLowerCase(), value)
  }

  getMessage(key) {
    return this.messageCache.get(key.toLowerCase())
  }

  hasMessage(key) {
    return this.messageCache.has(key.toLowerCase())
  }

  // Métodos para cache de APIs
  setApi(key, data, duration) {
    this.apiCache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    })
  }

  getApi(key) {
    const cached = this.apiCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.duration) {
      this.apiCache.delete(key)
      return null
    }
    
    return cached.data
  }

  hasValidApi(key) {
    const cached = this.apiCache.get(key)
    if (!cached) return false
    
    return Date.now() - cached.timestamp < cached.duration
  }

  // Métodos para cache de videos
  setVideo(key, data, duration) {
    this.videoCache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    })
  }

  getVideo(key) {
    const cached = this.videoCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.duration) {
      this.videoCache.delete(key)
      return null
    }
    
    return cached.data
  }

  hasValidVideo(key) {
    const cached = this.videoCache.get(key)
    if (!cached) return false
    
    return Date.now() - cached.timestamp < cached.duration
  }

  // Limpiar todos los caches
  clearAll() {
    this.messageCache.clear()
    this.apiCache.clear()
    this.videoCache.clear()
  }

  // Limpiar cache específico
  clearMessages() { this.messageCache.clear() }
  clearApi() { this.apiCache.clear() }
  clearVideos() { this.videoCache.clear() }
}

export const cacheManager = new CacheManager()