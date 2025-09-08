
//  Configuracion central

export const API_KEYS = {
  YOUTUBE: import.meta.env.VITE_YOUTUBE_API_KEY,
  OPENROUTER: import.meta.env.VITE_OPENROUTER_KEY
}

export const CACHE_DURATIONS = {
  YOUTUBE: 3600000,    
  WEATHER: 600000,     
  CRYPTO: 300000,      
  MESSAGE: 50          
}

export const WELCOME_MESSAGES = [
  "¡Hola! Soy EndyOS y estoy listo para lo que se te ocurra.",
  "¡Saludos! Soy EndyOS, tu compañero digital favorito. ¿Comenzamos?",
  "¡Hey! EndyOS aquí. ¿Qué tal si empezamos con algo interesante?",
  "EndyOS activado. ¿En qué aventura digital nos metemos hoy?"
]

export const THINKING_MESSAGES = [
  "EndyOS procesando... Dame un segundo que estoy pensando.",
  "Hmm, déjame analizar esto con mi cerebro EndyOS...",
  "EndyOS calculando... Un momento mientras proceso tu solicitud.",
  "Dame un momento para procesar tu consulta..."
]

export const LOCAL_FACTS = [
  "Los pulpos tienen tres corazones y sangre azul.",
  "Un rayo es cinco veces más caliente que la superficie del Sol.",
  "Los humanos comparten el 60% de su ADN con los plátanos.",
  "Un día en Venus dura más que un año en Venus.",
  "El corazón de una ballena azul es tan grande como un auto pequeño."
]

export const VOICE_CONFIG = {
  lang: 'es-ES',
  rate: 0.9,
  pitch: 1,
  volume: 1
}