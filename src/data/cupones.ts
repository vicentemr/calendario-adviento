// Los 31 cupones del calendario, uno por día de diciembre.
// (La ventana empañada de /ventana solo usa del 1 al 24.)
//
// Estos son EJEMPLOS para que veas cómo se ve: reemplázalos por los tuyos.
// - titulo:      lo que vale el cupón (corto, se ve grande).
// - descripcion: el detalle, con tus palabras.
// - condiciones: (opcional) la letra chica: cuándo, dónde, cómo canjearlo.

export interface Cupon {
  dia: number;
  titulo: string;
  descripcion: string;
  condiciones?: string;
}

export const cupones: Cupon[] = [
  { dia: 1, titulo: "Vale por un abrazo largo", descripcion: "De esos que no se sueltan hasta que tú digas.", condiciones: "Canjeable en cualquier momento, sin aviso previo." },
  { dia: 2, titulo: "Vale por una cita sorpresa", descripcion: "Yo planeo todo; tú solo te alistas.", condiciones: "Te aviso la hora un día antes." },
  { dia: 3, titulo: "Vale por un desayuno en la cama", descripcion: "Café, pan calientito y lo que se te antoje.", condiciones: "Válido un fin de semana a tu elección." },
  { dia: 4, titulo: "Vale por una noche de películas", descripcion: "Tú eliges la saga, yo pongo la canchita y la manta.", condiciones: "Sin quejarme de la película. Prometido." },
  { dia: 5, titulo: "Vale por un masaje", descripcion: "Media hora de masaje en la espalda, sin apuro.", condiciones: "Ampliable si me lo pides bonito." },
  { dia: 6, titulo: "Vale por una carta escrita a mano", descripcion: "Una carta de verdad, en papel, solo para ti." },
  { dia: 7, titulo: "Vale por un día sin hacer nada", descripcion: "Yo me encargo de todo lo demás.", condiciones: "Válido hasta fin de año." },
  { dia: 8, titulo: "Vale por tu postre favorito", descripcion: "El que tú quieras, donde tú quieras." },
  { dia: 9, titulo: "Vale por un paseo de noche", descripcion: "Caminar sin rumbo, de la mano, conversando de todo." },
  { dia: 10, titulo: "Vale por una cena hecha por mí", descripcion: "Me meto a la cocina y te sorprendo.", condiciones: "No me hago responsable del resultado." },
  { dia: 11, titulo: "Vale por ganar una discusión", descripcion: "Una vez, sin pelear: tienes la razón.", condiciones: "Úsalo con sabiduría." },
  { dia: 12, titulo: "Vale por una playlist", descripcion: "Una lista de canciones que me recuerdan a ti." },
  { dia: 13, titulo: "Vale por una sesión de fotos", descripcion: "Yo de fotógrafo todo el día, las veces que quieras." },
  { dia: 14, titulo: "Vale por elegir el plan", descripcion: "El sábado se hace lo que tú digas." },
  { dia: 15, titulo: "Vale por un picnic", descripcion: "Mantita, comida rica y un lugar bonito." },
  { dia: 16, titulo: "Vale por un 'sí' sin preguntas", descripcion: "Me pides algo y digo que sí.", condiciones: "Dentro de lo razonable (y un poquito más)." },
  { dia: 17, titulo: "Vale por una tarde de juegos", descripcion: "Juegos de mesa, cartas o lo que quieras jugar." },
  { dia: 18, titulo: "Vale por una salida a bailar", descripcion: "Aunque yo baile como baile." },
  { dia: 19, titulo: "Vale por un antojo a domicilio", descripcion: "Me escribes qué se te antoja y te lo llevo." },
  { dia: 20, titulo: "Vale por un recuerdo impreso", descripcion: "Imprimimos nuestras fotos favoritas del año." },
  { dia: 21, titulo: "Vale por armar el árbol juntos", descripcion: "Con música navideña y chocolatito caliente." },
  { dia: 22, titulo: "Vale por una escapada", descripcion: "Un día fuera de la ciudad, solo tú y yo.", condiciones: "Fecha a coordinar en enero." },
  { dia: 23, titulo: "Vale por mi tiempo completo", descripcion: "Celular guardado, todo el día para ti." },
  { dia: 24, titulo: "Vale por una Nochebuena juntos", descripcion: "Y por todas las que vengan.", condiciones: "Válido para siempre." },
  { dia: 25, titulo: "Vale por un chocolate caliente", descripcion: "Con panetón, en pijama y sin mirar el reloj." },
  { dia: 26, titulo: "Vale por una siesta larga", descripcion: "Para descansar de tanta cena, bien abrazados." },
  { dia: 27, titulo: "Vale por un día entero a tu manera", descripcion: "Feliz cumpleaños. Hoy todo se hace como tú quieras.", condiciones: "Incluye torta, velita y deseo." },
  { dia: 28, titulo: "Vale por una broma perdonada", descripcion: "Me la haces y me río igual.", condiciones: "Válido todo el Día de los Inocentes." },
  { dia: 29, titulo: "Vale por un recuento del año", descripcion: "Los mejores momentos, contados entre los dos." },
  { dia: 30, titulo: "Vale por una lista de deseos", descripcion: "Escribimos juntos lo que queremos para el año que viene." },
  { dia: 31, titulo: "Vale por el primer abrazo del año", descripcion: "A las doce en punto, antes que nadie.", condiciones: "Incluye las doce uvas." },
];
