import matrix from '../data/matrix.json';

export default function About() {
  return (
    <article className="animate-fade-up space-y-4">
      <h1 className="text-2xl font-extrabold">Acerca de asiEstudio</h1>
      <section className="card space-y-2">
        <h2 className="font-bold">¿Cómo se calcula tu perfil?</h2>
        <p>Cada respuesta suma puntos a una o más dimensiones según una matriz de ponderación fija. El resultado es un porcentaje por dimensión: 4 canales de aprendizaje, atención sostenida, organización del tiempo y ansiedad ante exámenes.</p>
        <p>Tu arquetipo es el canal con mayor porcentaje; si los dos primeros están a {matrix.thresholds.multimodalGap} puntos o menos, eres <b>Multimodal</b>. El cálculo es determinista: las mismas respuestas siempre dan el mismo resultado.</p>
        <p>Los mini-retos aportan puntos a atención y canal visual. Puedes omitirlos: en ese caso no se cuentan, y tu porcentaje no baja.</p>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">Tu privacidad</h2>
        <p>No hay cuentas ni servidor. Tus respuestas, historial y progreso viven en el almacenamiento de tu navegador y nunca se envían a ningún lugar. Puedes exportarlos o borrarlos desde el historial.</p>
      </section>
      <section className="card space-y-2">
        <h2 className="font-bold">Alcance y limitaciones</h2>
        <p>Es una herramienta orientativa basada en hábitos de estudio con respaldo en la literatura (práctica de recuperación, repetición espaciada, práctica intercalada). No es una prueba clínica ni diagnostica trastornos de aprendizaje o de ansiedad. Si la ansiedad ante exámenes te afecta mucho, consulta con un orientador o profesional de salud.</p>
        <p>Los pesos de la matriz son una propuesta inicial pendiente de validación por especialistas.</p>
      </section>
      <p className="text-center text-xs text-slate-500">Matriz v{matrix.version}</p>
    </article>
  );
}
