// Diseño "Crepúsculo": el bosque con lluvia detrás de todo y las casillas
// como vidrios empañados que se limpian con el dedo.
import "./casa";
import { Escena } from "./escena";
import { prepararLimpieza } from "./limpiar";
import { dibujarParejaColor } from "./pareja";

const dentro = () => document.documentElement.classList.contains("dentro");

/** Pinos junto a la casa, según el tamaño de la pantalla (ver .hogar en el CSS). */
function pinosDeLaCasa() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const u = Math.min(w / 100, h * 0.0056);
  const izquierda = w / 2 - 31 * u; // borde izquierdo de la casa
  // Desde afuera, cada quien sale de donde la casa deja ver; desde adentro se
  // los ve subir por todo el pino.
  const suelo = (afuera: number) => () => (dentro() ? window.innerHeight * 0.85 : afuera);
  return [
    // Al costado de la casa: se trepa desde el suelo.
    { x: (izquierda - 12 * u) / w, punta: 0.33, esbeltez: 0.2, suelo: suelo(h - 22 * u), lado: 1 },
    // Detrás del balcón: asoman por encima de la caja de cedro.
    { x: (izquierda + 69 * u) / w, punta: 0.3, esbeltez: 0.26, suelo: suelo(h - 56 * u), lado: -1 },
  ];
}

const escena = new Escena(document.getElementById("escena") as HTMLCanvasElement, {
  protagonistas: pinosDeLaCasa,
  pareja: dibujarParejaColor,
});

const hoyMismo = (c: HTMLElement) => c.dataset.hoy !== undefined;

for (const casilla of document.querySelectorAll<HTMLButtonElement>(
  '.casilla:not([data-forma="especial"])[data-estado="listo"]',
)) {
  // El de hoy se limpia en cualquier dirección; los demás dejan hacer scroll
  // vertical (se limpian con un toque o de lado a lado).
  casilla.style.touchAction = hoyMismo(casilla) ? "none" : "pan-y";
  const { limpiarSolo } = prepararLimpieza({
    vidrio: casilla,
    escena,
    alTerminar: () => {
      casilla.style.touchAction = "";
      casilla.classList.remove("despejando");
      casilla.dispatchEvent(new CustomEvent("revelada"));
    },
  });
  // Teclado (Enter o Espacio): clic sin puntero, se limpia solo.
  casilla.addEventListener("click", (e) => {
    if (e.detail === 0 && casilla.dataset.estado === "listo") limpiarSolo();
  });
}
