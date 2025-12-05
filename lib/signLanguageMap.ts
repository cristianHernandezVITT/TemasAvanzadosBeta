/**
 * Mapeo de palabras/frases a animaciones Lottie de lenguaje de señas
 * 
 * Para agregar nuevas animaciones:
 * 1. Crea o descarga el archivo .json de Lottie
 * 2. Colócalo en /public/animations/
 * 3. Agrega la entrada aquí: "palabra": "/animations/nombre-archivo.json"
 * 
 * También puedes usar URLs de CDN o servicios como LottieFiles
 */

export const signLanguageMap: Record<string, string> = {
  // Saludos y cortesía
  "hola": "/animations/hola.json",
  "gracias": "/animations/gracias.json",
  "por favor": "/animations/por-favor.json",
  "de nada": "/animations/de-nada.json",
  "adiós": "/animations/adios.json",
  
  // Respuestas básicas
  "sí": "/animations/si.json",
  "si": "/animations/si.json",
  "no": "/animations/no.json",
  "ok": "/animations/ok.json",
  
  // Acciones comunes de UI
  "botón": "/animations/boton.json",
  "boton": "/animations/boton.json",
  "enlace": "/animations/enlace.json",
  "campo": "/animations/campo.json",
  "guardar": "/animations/guardar.json",
  "cancelar": "/animations/cancelar.json",
  "buscar": "/animations/buscar.json",
  "eliminar": "/animations/eliminar.json",
  "editar": "/animations/editar.json",
  "crear": "/animations/crear.json",
  "cerrar": "/animations/cerrar.json",
  "abrir": "/animations/abrir.json",
  "exportar": "/animations/exportar.json",
  "importar": "/animations/importar.json",
  
  // Palabras específicas de la aplicación
  "usuario": "/animations/usuario.json",
  "usuarios": "/animations/usuario.json",
  "estudiante": "/animations/estudiante.json",
  "estudiantes": "/animations/estudiante.json",
  "materia": "/animations/materia.json",
  "materias": "/animations/materia.json",
  "carrera": "/animations/carrera.json",
  "carreras": "/animations/carrera.json",
  "rol": "/animations/rol.json",
  "roles": "/animations/rol.json",
  "dashboard": "/animations/dashboard.json",
  "registro": "/animations/registro.json",
  "histograma": "/animations/histograma.json",
  "pareto": "/animations/pareto.json",
  "dispersión": "/animations/dispersion.json",
  "dispersion": "/animations/dispersion.json",
  "control": "/animations/control.json",
  "asignación": "/animations/asignacion.json",
  "asignacion": "/animations/asignacion.json",
  
  // Acciones específicas
  "crear usuario": "/animations/crear.json",
  "editar usuario": "/animations/editar.json",
  "eliminar usuario": "/animations/eliminar.json",
  "exportar excel": "/animations/exportar.json",
  "exportar pdf": "/animations/exportar.json",
  "cerrar sesión": "/animations/cerrar.json",
  "cerrar sesion": "/animations/cerrar.json",
}

/**
 * Ruta a la animación neutral por defecto
 */
export const defaultNeutralAnimationPath = "/animations/neutral.json"

/**
 * Cargar animación neutral (fallback)
 */
export async function loadNeutralAnimation(): Promise<any> {
  try {
    const response = await fetch(defaultNeutralAnimationPath)
    if (response.ok) {
      const json = await response.json()
      // Validar estructura
      if (json && json.v && Array.isArray(json.layers) && json.layers.length > 0) {
        return json
      }
    }
  } catch (error) {
    console.warn("Error loading neutral animation:", error)
  }
  
  // Fallback básico válido si no se puede cargar
  return {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 60,
    w: 400,
    h: 400,
    nm: "Neutral",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Hand",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [200, 200, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        ip: 0,
        op: 60,
        st: 0,
        bm: 0
      }
    ]
  }
}

/**
 * URLs alternativas de servicios de Lottie (si prefieres usar CDN)
 * Ejemplo: LottieFiles, etc.
 */
export const lottieCDNUrls: Record<string, string> = {
  // Puedes agregar URLs de servicios como:
  // "hola": "https://lottie.host/embed/abc123.json",
  // "gracias": "https://assets5.lottiefiles.com/packages/lf20_xyz.json",
}

