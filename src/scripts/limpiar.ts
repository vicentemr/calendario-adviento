// Limpiar el vidrio con el dedo: cada trazo borra la niebla y deja ver
// la escena nítida que está detrás.

import type { Escena } from "./escena";

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");

export interface OpcionesLimpieza {
  vidrio: HTMLElement;
  escena: Escena;
  alTerminar: () => void;
}

export function prepararLimpieza({ vidrio, escena, alTerminar }: OpcionesLimpieza) {
  const lienzo = document.createElement("canvas");
  lienzo.className = "limpio";
  lienzo.setAttribute("aria-hidden", "true");
  vidrio.appendChild(lienzo);
  const ctx = lienzo.getContext("2d")!;
  const mascara = document.createElement("canvas");
  const mctx = mascara.getContext("2d")!;
  const muestra = document.createElement("canvas");
  muestra.width = 16;
  muestra.height = 20;
  const sctx = muestra.getContext("2d", { willReadFrequently: true })!;

  let dpr = 1;
  let terminado = false;
  let trazos = 0;
  let ultimo: { x: number; y: number } | null = null;
  let movido = 0;
  let activo = false;

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = vidrio.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (lienzo.width !== w || lienzo.height !== h) {
      const copia = document.createElement("canvas");
      copia.width = mascara.width;
      copia.height = mascara.height;
      if (mascara.width) copia.getContext("2d")!.drawImage(mascara, 0, 0);
      lienzo.width = mascara.width = w;
      lienzo.height = mascara.height = h;
      if (copia.width) mctx.drawImage(copia, 0, 0, w, h);
    }
  }

  function pintar() {
    const r = vidrio.getBoundingClientRect();
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(mascara, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    const fd = Math.min(window.devicePixelRatio || 1, 2);
    ctx.drawImage(
      escena.canvas,
      r.left * fd,
      r.top * fd,
      r.width * fd,
      r.height * fd,
      0,
      0,
      lienzo.width,
      lienzo.height,
    );
  }

  function trazo(x: number, y: number) {
    const grosor = Math.max(18, Math.sqrt(lienzo.width * lienzo.height) / dpr / 4.2) * dpr;
    mctx.lineCap = "round";
    mctx.lineJoin = "round";
    mctx.lineWidth = grosor;
    mctx.strokeStyle = "#000";
    mctx.fillStyle = "#000";
    if (ultimo) {
      mctx.beginPath();
      mctx.moveTo(ultimo.x * dpr, ultimo.y * dpr);
      mctx.lineTo(x * dpr, y * dpr);
      mctx.stroke();
    } else {
      mctx.beginPath();
      mctx.arc(x * dpr, y * dpr, grosor / 2, 0, Math.PI * 2);
      mctx.fill();
    }
    ultimo = { x, y };
    if (++trazos % 6 === 0) revisar();
  }

  function cobertura() {
    sctx.clearRect(0, 0, muestra.width, muestra.height);
    sctx.drawImage(mascara, 0, 0, muestra.width, muestra.height);
    const datos = sctx.getImageData(0, 0, muestra.width, muestra.height).data;
    let limpio = 0;
    for (let i = 3; i < datos.length; i += 4) if (datos[i] > 100) limpio++;
    return limpio / (muestra.width * muestra.height);
  }

  function revisar() {
    if (!terminado && cobertura() > 0.55) terminar();
  }

  function terminar() {
    if (terminado) return;
    terminado = true;
    vidrio.classList.add("despejando");
    soltar();
    window.setTimeout(
      () => {
        quitarDibujo();
        lienzo.remove();
        alTerminar();
      },
      reducirMovimiento.matches ? 150 : 650,
    );
  }

  const quitarDibujo = escena.alDibujar(pintar);

  function punto(e: PointerEvent) {
    const r = vidrio.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function presionar(e: PointerEvent) {
    if (terminado || e.button > 0) return;
    medir();
    activo = true;
    movido = 0;
    ultimo = null;
    vidrio.setPointerCapture(e.pointerId);
    vidrio.classList.add("limpiando");
    const p = punto(e);
    trazo(p.x, p.y);
  }

  function mover(e: PointerEvent) {
    if (!activo || terminado) return;
    const p = punto(e);
    if (ultimo) movido += Math.hypot(p.x - ultimo.x, p.y - ultimo.y);
    trazo(p.x, p.y);
  }

  function soltar(e?: PointerEvent) {
    if (!activo) return;
    activo = false;
    ultimo = null;
    vidrio.classList.remove("limpiando");
    if (!terminado) {
      revisar();
      // Un toque sin arrastrar: limpiamos el vidrio por ella.
      // (Si el navegador canceló el gesto para hacer scroll, no.)
      if (!terminado && movido < 10 && e?.type === "pointerup") limpiarSolo();
    }
  }

  /** Limpieza automática: un zigzag como el de un dedo apurado. */
  function limpiarSolo() {
    if (terminado) return;
    medir();
    if (reducirMovimiento.matches) {
      mctx.fillStyle = "#000";
      mctx.fillRect(0, 0, mascara.width, mascara.height);
      terminar();
      return;
    }
    const r = vidrio.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const filas = 4;
    const camino: { x: number; y: number }[] = [];
    for (let i = 0; i <= filas; i++) {
      const y = h * (0.1 + (0.8 * i) / filas);
      camino.push(i % 2 ? { x: w * 0.9, y } : { x: w * 0.1, y });
    }
    const total = 720;
    const inicio = performance.now();
    ultimo = null;
    const paso = (t: number) => {
      // El primer cuadro puede traer una hora anterior a "inicio".
      const k = Math.min(Math.max((t - inicio) / total, 0), 1);
      const pos = k * (camino.length - 1);
      const i = Math.min(Math.floor(pos), camino.length - 2);
      const f = pos - i;
      const a = camino[i];
      const b = camino[i + 1];
      trazo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
      if (k < 1 && !terminado) requestAnimationFrame(paso);
      else terminar();
    };
    requestAnimationFrame(paso);
  }

  vidrio.addEventListener("pointerdown", presionar);
  vidrio.addEventListener("pointermove", mover);
  vidrio.addEventListener("pointerup", soltar);
  vidrio.addEventListener("pointercancel", soltar);
  medir();

  return { limpiarSolo };
}
