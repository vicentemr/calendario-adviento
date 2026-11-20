import { Escena } from "./escena";
import { prepararLimpieza } from "./limpiar";

interface Cupon {
  dia: number;
  titulo: string;
  descripcion: string;
  condiciones?: string;
}

interface Datos {
  anio: number;
  firma: string;
  cupones: Cupon[];
}

const datos: Datos = JSON.parse(document.getElementById("datos-calendario")!.textContent!);
const CLAVE = `ventana-empanada-${datos.anio}`;

function leerAbiertos(): Set<number> {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return new Set(crudo ? (JSON.parse(crudo) as number[]) : []);
  } catch {
    return new Set();
  }
}

function guardarAbiertos(abiertos: Set<number>) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...abiertos].sort((a, b) => a - b)));
  } catch {
    /* Sin almacenamiento: igual funciona, solo no recuerda. */
  }
}

/** Fecha de hoy. En desarrollo se puede simular con ?hoy=2026-12-10 (y ?reset para borrar). */
function fechaDeHoy(): Date {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(location.search);
    if (params.has("reset")) {
      try {
        localStorage.removeItem(CLAVE);
      } catch {}
    }
    const simulada = params.get("hoy");
    if (simulada) {
      const [a, m, d] = simulada.split("-").map(Number);
      if (a && m && d) return new Date(a, m - 1, d, 12);
    }
  }
  return new Date();
}

const hoy = fechaDeHoy();
const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
const fechaDe = (dia: number) => new Date(datos.anio, 11, dia);
// TEMPORAL (solo para probar): true abre todos los vidrios sin validar fecha. Volver a false antes de entregar.
const SIN_VALIDAR_FECHA = true;
const disponible = (dia: number) => SIN_VALIDAR_FECHA || inicioHoy >= fechaDe(dia);
const esHoy = (dia: number) => inicioHoy.getTime() === fechaDe(dia).getTime();
const diasHasta = (dia: number) => Math.round((fechaDe(dia).getTime() - inicioHoy.getTime()) / 86400000);

const abiertos = leerAbiertos();
for (const dia of [...abiertos]) if (!disponible(dia)) abiertos.delete(dia);

const escena = new Escena(document.getElementById("escena") as HTMLCanvasElement);
const vidrios = [...document.querySelectorAll<HTMLButtonElement>(".vidrio")];
const aviso = document.getElementById("aviso")!;
const subtitulo = document.getElementById("subtitulo")!;
const nota = document.getElementById("nota") as HTMLDialogElement;
const limpiezas = new Map<number, { limpiarSolo: () => void }>();

function etiqueta(dia: number, estado: string) {
  const fecha = `${dia} de diciembre`;
  if (estado === "abierto") return `Día ${dia}, abierto. Ver cupón.`;
  if (estado === "listo") return `Día ${dia}, empañado. Límpialo para ver tu cupón.`;
  return `Día ${dia}, se abre el ${fecha}.`;
}

function ponerEstado(vidrio: HTMLButtonElement, estado: "cerrado" | "listo" | "abierto") {
  const dia = Number(vidrio.dataset.dia);
  vidrio.dataset.estado = estado;
  vidrio.setAttribute("aria-label", etiqueta(dia, estado));
}

function actualizarSubtitulo() {
  const ultimo = fechaDe(24);
  if (inicioHoy < fechaDe(1)) {
    const faltan = diasHasta(1);
    subtitulo.textContent =
      faltan === 1
        ? "Mañana se empaña el primer vidrio."
        : `La ventana se empaña el 1 de diciembre. Faltan ${faltan} días.`;
  } else if (inicioHoy > ultimo) {
    subtitulo.textContent = "Feliz Navidad, amor. Todos los vidrios son tuyos.";
  } else {
    const dia = inicioHoy.getDate();
    const pendientes = vidrios.filter((v) => v.dataset.estado === "listo").length;
    if (!abiertos.has(dia)) subtitulo.textContent = `Hoy se empañó el vidrio ${dia}. Pásale el dedo.`;
    else if (pendientes) subtitulo.textContent = `Te quedan ${pendientes} vidrios de días pasados por limpiar.`;
    else if (dia === 24) subtitulo.textContent = "Es Nochebuena. Ya limpiaste todos los vidrios.";
    else subtitulo.textContent = "Ya limpiaste el de hoy. Mañana hay otro.";
  }
}

function mostrarNota(dia: number) {
  const cupon = datos.cupones.find((c) => c.dia === dia);
  nota.querySelector(".nota-dia")!.textContent = `${dia} de diciembre`;
  nota.querySelector(".nota-titulo")!.textContent = cupon?.titulo ?? "Cupón por escribir";
  nota.querySelector(".nota-texto")!.textContent =
    cupon?.descripcion ?? "Este cupón todavía está en camino.";
  const condiciones = nota.querySelector<HTMLElement>(".nota-condiciones")!;
  condiciones.textContent = cupon?.condiciones ?? "";
  condiciones.hidden = !cupon?.condiciones;
  if (!nota.open) nota.showModal();
  history.replaceState(null, "", `#dia-${String(dia).padStart(2, "0")}`);
}

nota.addEventListener("close", () => {
  history.replaceState(null, "", location.pathname + location.search);
});
nota.addEventListener("click", (e) => {
  if (e.target === nota) nota.close();
});

let avisoTiempo = 0;
function avisar(texto: string) {
  aviso.textContent = texto;
  aviso.classList.add("visible");
  clearTimeout(avisoTiempo);
  avisoTiempo = window.setTimeout(() => aviso.classList.remove("visible"), 3800);
}

function abrir(vidrio: HTMLButtonElement) {
  const dia = Number(vidrio.dataset.dia);
  abiertos.add(dia);
  guardarAbiertos(abiertos);
  vidrio.classList.remove("despejando");
  ponerEstado(vidrio, "abierto");
  vidrio.style.touchAction = "";
  limpiezas.delete(dia);
  actualizarSubtitulo();
  mostrarNota(dia);
}

for (const vidrio of vidrios) {
  const dia = Number(vidrio.dataset.dia);
  if (esHoy(dia)) vidrio.dataset.hoy = "";
  if (abiertos.has(dia)) ponerEstado(vidrio, "abierto");
  else if (disponible(dia)) {
    ponerEstado(vidrio, "listo");
    // El de hoy se limpia en cualquier dirección; los atrasados dejan
    // hacer scroll vertical (se limpian con un toque o de lado a lado).
    vidrio.style.touchAction = esHoy(dia) ? "none" : "pan-y";
    limpiezas.set(
      dia,
      prepararLimpieza({ vidrio, escena, alTerminar: () => abrir(vidrio) }),
    );
  } else ponerEstado(vidrio, "cerrado");

  vidrio.addEventListener("click", (e) => {
    const estado = vidrio.dataset.estado;
    if (estado === "abierto") mostrarNota(dia);
    else if (estado === "listo") {
      // Teclado (Enter/Espacio): click sin puntero, limpiamos por ella.
      if (e.detail === 0) limpiezas.get(dia)?.limpiarSolo();
    } else {
      const faltan = diasHasta(dia);
      avisar(
        faltan === 1
          ? `Paciencia, amor: este vidrio se limpia mañana.`
          : `Paciencia, amor: este vidrio se limpia el ${dia} de diciembre. Faltan ${faltan} días.`,
      );
      vidrio.classList.remove("negado");
      void vidrio.offsetWidth;
      vidrio.classList.add("negado");
    }
  });
}

actualizarSubtitulo();
document.documentElement.classList.add("listo");

const enlace = location.hash.match(/^#dia-(\d{1,2})$/);
if (enlace) {
  const dia = Number(enlace[1]);
  if (abiertos.has(dia)) mostrarNota(dia);
}
