// Cómo se acomodan las 31 casillas. Cada bloque es de 4 columnas x 6 filas:
// en el celular van uno debajo de otro (4x18) y en pantallas grandes lado a
// lado (12x6). El número es el día; repetirlo hace más grande la casilla.
const BLOQUES = [
  [
    [17, 8, 8, 3],
    [24, 24, 24, 10],
    [24, 24, 24, 10],
    [24, 24, 24, 22],
    [1, 1, 12, 5],
    [1, 1, 12, 19],
  ],
  [
    [14, 6, 28, 28],
    [14, 21, 28, 28],
    [9, 27, 27, 27],
    [9, 27, 27, 27],
    [26, 27, 27, 27],
    [2, 15, 25, 11],
  ],
  [
    [13, 18, 18, 29],
    [16, 31, 31, 31],
    [16, 31, 31, 31],
    [23, 31, 31, 31],
    [20, 30, 30, 4],
    [20, 30, 30, 7],
  ],
];

export type Acomodo = "normal" | "espejo" | "volteado";
export type Forma = "cuadro" | "ancho" | "alto" | "grande" | "especial";

export interface Lugar {
  dia: number;
  forma: Forma;
  /** Orden de aparición: de arriba a la izquierda hacia abajo a la derecha. */
  orden: number;
}

const aAreas = (filas: number[][]) =>
  filas.map((f) => `"${f.map((d) => `d${d}`).join(" ")}"`).join(" ");

export function cuadricula(acomodo: Acomodo) {
  const bloques = acomodo === "volteado" ? BLOQUES.map((b) => [...b].reverse()) : BLOQUES;
  const voltear = (f: number[]) => (acomodo === "espejo" ? [...f].reverse() : f);

  const movil = bloques.flat().map(voltear);
  const escritorio = bloques[0].map((_, i) => voltear(bloques.flatMap((b) => b[i])));

  const lugares: Lugar[] = Array.from({ length: 31 }, (_, i) => {
    const dia = i + 1;
    const fila = movil.findIndex((f) => f.includes(dia));
    const col = movil[fila].indexOf(dia);
    const w = movil[fila].filter((d) => d === dia).length;
    const h = movil.filter((f) => f.includes(dia)).length;
    const forma: Forma =
      w === 3
        ? "especial"
        : w === 2 && h === 2
          ? "grande"
          : w > h
            ? "ancho"
            : h > w
              ? "alto"
              : "cuadro";
    return { dia, forma, orden: fila + col * 0.6 };
  });

  return { movil: aAreas(movil), escritorio: aAreas(escritorio), lugares };
}
