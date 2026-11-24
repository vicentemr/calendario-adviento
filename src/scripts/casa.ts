interface Cupon {
  dia: number;
  titulo: string;
  descripcion: string;
  condiciones?: string;
}

interface Datos {
  diseno: string;
  anio: number;
  abrirTodo: boolean;
  especiales: Record<number, string>;
  confeti: string[];
  migas: string[];
  /** true: las casillas comunes no se abren con un clic (se limpian). */
  manual: boolean;
  cupones: Cupon[];
}

type Estado = "cerrado" | "listo" | "abriendo" | "abierto";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const datos: Datos = JSON.parse($("datos-calendario").textContent!);
const CLAVE = `casa-${datos.diseno}-${datos.anio}`;
const ULTIMO = 31;
const raiz = document.documentElement;
const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ---------- Fechas y memoria ---------- */

const pruebas = import.meta.env.DEV || datos.abrirTodo;
const params = new URLSearchParams(location.search);

function leerAbiertos(): Set<number> {
  try {
    if (pruebas && params.has("reset")) localStorage.removeItem(CLAVE);
    return new Set(JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as number[]);
  } catch {
    return new Set();
  }
}

function guardarAbiertos() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...abiertos].sort((a, b) => a - b)));
  } catch {
    /* Sin almacenamiento: igual funciona, solo no recuerda. */
  }
}

/** Fecha de hoy. En desarrollo se puede simular con ?hoy=2026-12-10. */
function fechaDeHoy(): Date {
  const simulada = import.meta.env.DEV && params.get("hoy");
  if (simulada) {
    const [a, m, d] = simulada.split("-").map(Number);
    if (a && m && d) return new Date(a, m - 1, d);
  }
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

const hoy = fechaDeHoy();
// Al simular una fecha sí se valida, aunque abrirTodo esté activo.
const validar = !datos.abrirTodo || (import.meta.env.DEV && params.has("hoy"));
const fechaDe = (dia: number) => new Date(datos.anio, 11, dia);
const disponible = (dia: number) => !validar || hoy >= fechaDe(dia);
const esHoy = (dia: number) => hoy.getTime() === fechaDe(dia).getTime();
const diasHasta = (dia: number) =>
  Math.round((fechaDe(dia).getTime() - hoy.getTime()) / 86400000);

const abiertos = leerAbiertos();
for (const dia of [...abiertos]) if (!disponible(dia)) abiertos.delete(dia);

/* ---------- La puerta ---------- */

const fachada = $("fachada");
const vista = $("vista");
const interior = $("interior");
const puerta = $<HTMLButtonElement>("puerta");
const vano = $("vano");
let moviendo = false;

/** Transformación que acerca la vista hasta que el vano cubre toda la pantalla. */
function acercamiento() {
  const v = vano.getBoundingClientRect();
  const w = innerWidth;
  const h = innerHeight;
  const s = Math.max(w / v.width, h / v.height) * 1.9;
  const cx = v.left + v.width / 2;
  const cy = v.top + v.height * 0.58;
  return `translate(${w / 2 - cx * s}px, ${h / 2 - cy * s}px) scale(${s})`;
}

async function entrar(conAnimacion = true) {
  if (moviendo) return;
  moviendo = true;
  if (conAnimacion) {
    if (reducir.matches) {
      raiz.classList.add("dentro");
      await fachada.animate({ opacity: [1, 0] }, 250).finished;
    } else {
      fachada.dataset.paso = "tocando";
      await esperar(420);
      fachada.dataset.paso = "abriendo";
      await esperar(1250);
      fachada.dataset.paso = "entrando";
      const opciones = { duration: 1250, easing: "cubic-bezier(.65,0,.25,1)" };
      const zoom = vista.animate({ transform: ["none", acercamiento()] }, opciones);
      fachada.animate(
        { opacity: [1, 1, 0], offset: [0, 0.6, 1] },
        { duration: 1250, easing: "linear" },
      );
      // Las casillas empiezan a aparecer mientras todavía estamos cruzando.
      await esperar(700);
      raiz.classList.add("dentro");
      await zoom.finished;
    }
  }
  fachada.hidden = true;
  delete fachada.dataset.paso;
  raiz.classList.add("dentro");
  interior.inert = false;
  if (conAnimacion) $("titulo").focus({ preventScroll: true });
  moviendo = false;
}

async function salir() {
  if (moviendo) return;
  moviendo = true;
  interior.inert = true;
  scrollTo({ top: 0, behavior: "instant" });
  fachada.hidden = false;
  fachada.dataset.paso = "entrando";
  if (reducir.matches) {
    await fachada.animate({ opacity: [0, 1] }, 250).finished;
  } else {
    const opciones = { duration: 1100, easing: "cubic-bezier(.65,0,.25,1)" };
    fachada.animate({ opacity: [0, 1, 1], offset: [0, 0.28, 1] }, { duration: 1100, easing: "linear" });
    const zoom = vista.animate({ transform: [acercamiento(), "none"] }, opciones);
    // El vano todavía tapa toda la pantalla: aquí se guarda el interior.
    await esperar(330);
    raiz.classList.remove("dentro");
    await zoom.finished;
  }
  raiz.classList.remove("dentro");
  fachada.dataset.paso = "cerrando";
  await esperar(reducir.matches ? 0 : 900);
  delete fachada.dataset.paso;
  puerta.focus({ preventScroll: true });
  moviendo = false;
}

puerta.addEventListener("click", () => entrar());
$("salir").addEventListener("click", salir);

/* ---------- Casillas ---------- */

const casillas = [...document.querySelectorAll<HTMLButtonElement>(".casilla")];
const aviso = $("aviso");
const subtitulo = $("subtitulo");
const nota = $<HTMLDialogElement>("nota");

function etiqueta(dia: number, estado: Estado) {
  const especial = datos.especiales[dia];
  const nombre = especial ? `Día ${dia}, ${especial}` : `Día ${dia}`;
  if (estado === "abierto") return `${nombre}, abierta. Ver cupón.`;
  if (estado === "cerrado") return `${nombre}, se abre el ${dia} de diciembre.`;
  return `${nombre}, lista para abrir.`;
}

function ponerEstado(casilla: HTMLElement, estado: Estado) {
  casilla.dataset.estado = estado;
  casilla.setAttribute("aria-label", etiqueta(Number(casilla.dataset.dia), estado));
}

function actualizarSubtitulo() {
  const pendientes = casillas.filter((c) => c.dataset.estado === "listo").length;
  const porAbrir =
    pendientes === 1 ? "Te queda una casilla por abrir." : `Te quedan ${pendientes} casillas por abrir.`;
  const terminado = "Ya abriste todo diciembre. Feliz año, amor.";
  const dia = hoy.getDate();
  let texto: string;
  if (hoy < fechaDe(1)) {
    const faltan = diasHasta(1);
    texto =
      faltan === 1
        ? "Mañana se abre la primera casilla."
        : `La primera casilla se abre en ${faltan} días.`;
  } else if (hoy > fechaDe(ULTIMO)) texto = pendientes ? porAbrir : terminado;
  else if (!abiertos.has(dia)) {
    texto = datos.especiales[dia]
      ? `Hoy es ${datos.especiales[dia]}. Tu regalo dorado te espera.`
      : `Hoy toca la casilla ${dia}.`;
  } else if (pendientes) texto = porAbrir;
  else texto = dia === ULTIMO ? terminado : "Ya abriste la de hoy. Mañana hay otra.";
  subtitulo.textContent = texto;
}

function mostrarNota(dia: number, desde?: HTMLElement) {
  const cupon = datos.cupones.find((c) => c.dia === dia);
  const nombre = datos.especiales[dia];
  nota.classList.toggle("dorada", Boolean(nombre));
  nota.querySelector(".nota-dia")!.textContent = `${dia} de diciembre${nombre ? `, ${nombre}` : ""}`;
  nota.querySelector(".nota-titulo")!.textContent = cupon?.titulo ?? "Cupón por escribir";
  nota.querySelector(".nota-texto")!.textContent =
    cupon?.descripcion ?? "Este cupón todavía está en camino.";
  const condiciones = nota.querySelector<HTMLElement>(".nota-condiciones")!;
  condiciones.textContent = cupon?.condiciones ?? "";
  condiciones.hidden = !cupon?.condiciones;
  if (!nota.open) nota.showModal();
  history.replaceState(null, "", `${location.search}#dia-${String(dia).padStart(2, "0")}`);

  // La nota sale de su casilla.
  if (desde && !reducir.matches) {
    const a = desde.getBoundingClientRect();
    const b = nota.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2);
    const dy = a.top + a.height / 2 - (b.top + b.height / 2);
    nota.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(-10deg)`, opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 700, easing: "cubic-bezier(.2,1,.3,1)" },
    );
  }
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
  avisoTiempo = window.setTimeout(() => aviso.classList.remove("visible"), 3600);
}

/** Papelitos o migas que saltan desde una casilla. */
function saltar(desde: HTMLElement, colores: string[], cantidad: number, fuerza: number) {
  if (reducir.matches || !colores.length) return;
  const r = desde.getBoundingClientRect();
  const capa = document.createElement("div");
  capa.className = "particulas";
  capa.setAttribute("aria-hidden", "true");
  document.body.append(capa);
  for (let i = 0; i < cantidad; i++) {
    const p = document.createElement("i");
    p.style.background = colores[i % colores.length];
    p.style.left = `${r.left + r.width * (0.2 + Math.random() * 0.6)}px`;
    p.style.top = `${r.top + r.height * (0.3 + Math.random() * 0.4)}px`;
    p.style.setProperty("--t", (0.6 + Math.random() * 0.9).toFixed(2));
    if (i % 3 === 0) p.style.borderRadius = "50%";
    const x = (Math.random() - 0.5) * fuerza * 2;
    const y = -fuerza * (0.4 + Math.random() * 0.9);
    const giro = (Math.random() - 0.5) * 900;
    const tramo = (kx: number, ty: number, kg: number) =>
      `translate(${x * kx}px, ${ty}px) rotate(${giro * kg}deg)`;
    p.animate(
      [
        { transform: "none", opacity: 1, easing: "cubic-bezier(.1,.7,.4,1)" },
        { transform: tramo(0.8, y, 0.5), opacity: 1, offset: 0.38, easing: "cubic-bezier(.5,0,.9,.6)" },
        { transform: tramo(1.15, fuerza * 1.3, 1), opacity: 1, offset: 0.9 },
        { transform: tramo(1.2, fuerza * 1.5, 1), opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 700, fill: "both" },
    );
    capa.append(p);
  }
  setTimeout(() => capa.remove(), 2000);
}

/** Espera a que terminen las animaciones de apertura (las infinitas no cuentan). */
async function finAnimaciones(el: HTMLElement) {
  const finitas = el
    .getAnimations({ subtree: true })
    .filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)));
  await Promise.race([Promise.allSettled(finitas.map((a) => a.finished)), esperar(3000)]);
}

async function abrir(casilla: HTMLButtonElement) {
  const dia = Number(casilla.dataset.dia);
  const especial = casilla.dataset.forma === "especial";
  abiertos.add(dia);
  guardarAbiertos();
  ponerEstado(casilla, "abriendo");
  if (especial) setTimeout(() => saltar(casilla, datos.confeti, 46, 190), 1000);
  else if (datos.migas.length) setTimeout(() => saltar(casilla, datos.migas, 12, 60), 420);
  await finAnimaciones(casilla);
  ponerEstado(casilla, "abierto");
  actualizarSubtitulo();
  if (!reducir.matches) await esperar(especial ? 450 : 150);
  // Si abrió otra mientras tanto, no encimamos las notas.
  if (!nota.open) mostrarNota(dia, casilla);
}

/** El diseño ya mostró su propia animación (p. ej. limpiar el vidrio). */
async function revelar(casilla: HTMLButtonElement) {
  const dia = Number(casilla.dataset.dia);
  abiertos.add(dia);
  guardarAbiertos();
  ponerEstado(casilla, "abierto");
  actualizarSubtitulo();
  if (!reducir.matches) await esperar(850);
  if (!nota.open) mostrarNota(dia, casilla);
}

for (const casilla of casillas) {
  const dia = Number(casilla.dataset.dia);
  if (esHoy(dia)) casilla.dataset.hoy = "";
  ponerEstado(casilla, abiertos.has(dia) ? "abierto" : disponible(dia) ? "listo" : "cerrado");

  casilla.addEventListener("revelada", () => void revelar(casilla));

  casilla.addEventListener("click", () => {
    const estado = casilla.dataset.estado as Estado;
    if (estado === "abierto") mostrarNota(dia, casilla);
    else if (estado === "listo") {
      if (!datos.manual || casilla.dataset.forma === "especial") void abrir(casilla);
    }
    else if (estado === "cerrado") {
      const faltan = diasHasta(dia);
      const cual = datos.especiales[dia] ? "este regalo" : "esta casilla";
      avisar(
        faltan === 1
          ? `Paciencia, amor: ${cual} se abre mañana.`
          : `Paciencia, amor: ${cual} se abre el ${dia} de diciembre. Faltan ${faltan} días.`,
      );
      casilla.classList.remove("negado");
      void casilla.offsetWidth;
      casilla.classList.add("negado");
    }
  });
}

actualizarSubtitulo();

const enlace = location.hash.match(/^#dia-(\d{1,2})$/);
if (enlace && abiertos.has(Number(enlace[1]))) {
  // Viene directo a un cupón: no hace falta tocar la puerta.
  void entrar(false);
  mostrarNota(Number(enlace[1]));
}
