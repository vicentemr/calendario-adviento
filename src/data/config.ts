// Datos personales del calendario. Cambia estos valores cuando quieras.
export const config = {
  /** Cómo le dices a ella. Aparece en el título: "Para ti, ___". */
  nombreElla: "Laura",
  /** Cómo firmas tú las notas. */
  firma: "Vicente",
  /** Año del calendario. Las casillas se abren en diciembre de este año. */
  anio: 2026,
  /**
   * TEMPORAL (solo para probar): true abre todas las casillas sin validar la fecha
   * y permite ?reset en el sitio publicado. Volver a false antes de entregar.
   */
  abrirTodo: true,
  /** Días con regalo dorado y cómo se llama cada uno. */
  especiales: {
    24: "Nochebuena",
    27: "Cumpleaños",
    31: "Fin de año",
  } as Record<number, string>,
};
