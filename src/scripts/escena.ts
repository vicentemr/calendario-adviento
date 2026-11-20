// La escena detrás del vidrio: bosque de pinos en niebla, luces cálidas
// desenfocadas y lluvia. Se dibuja en un canvas fijo que ocupa la pantalla.

type Luz = { x: number; y: number; r: number; fase: number; vel: number };
type Gota = { x: number; y: number; largo: number; vel: number };

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");

function aleatorio(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class Escena {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fondo = document.createElement("canvas");
  private luces: Luz[] = [];
  private gotas: Gota[] = [];
  private dpr = 1;
  private ancho = 0;
  private alto = 0;
  private anim = 0;
  private ultimo = 0;
  private oyentes = new Set<() => void>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.redimensionar();
    let espera = 0;
    window.addEventListener("resize", () => {
      clearTimeout(espera);
      espera = window.setTimeout(() => this.redimensionar(), 120);
    });
    document.addEventListener("visibilitychange", () => this.iniciar());
    reducirMovimiento.addEventListener("change", () => this.iniciar());
    this.iniciar();
  }

  /** Se llama en cada cuadro dibujado (para que el vidrio limpio se actualice). */
  alDibujar(fn: () => void) {
    this.oyentes.add(fn);
    return () => this.oyentes.delete(fn);
  }

  private redimensionar() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ancho = window.innerWidth;
    // Usamos la altura grande de la pantalla para que no "salte" en el celular.
    this.alto = Math.max(window.innerHeight, document.documentElement.clientHeight);
    for (const c of [this.canvas, this.fondo]) {
      c.width = Math.round(this.ancho * this.dpr);
      c.height = Math.round(this.alto * this.dpr);
    }
    this.canvas.style.width = `${this.ancho}px`;
    this.canvas.style.height = `${this.alto}px`;
    this.pintarFondo();
    this.crearLuces();
    this.crearGotas();
    this.dibujar(performance.now());
  }

  private pintarFondo() {
    const c = this.fondo.getContext("2d")!;
    const w = this.fondo.width;
    const h = this.fondo.height;
    const rnd = aleatorio(1224);

    const cielo = c.createLinearGradient(0, 0, 0, h);
    cielo.addColorStop(0, "#1a2b33");
    cielo.addColorStop(0.35, "#2c434c");
    cielo.addColorStop(0.7, "#1a2b31");
    cielo.addColorStop(1, "#0b1418");
    c.fillStyle = cielo;
    c.fillRect(0, 0, w, h);

    // Luna velada por la niebla.
    const lx = w * 0.78;
    const ly = h * 0.14;
    const luna = c.createRadialGradient(lx, ly, 0, lx, ly, w * 0.45);
    luna.addColorStop(0, "rgba(232,238,240,0.35)");
    luna.addColorStop(0.08, "rgba(232,238,240,0.18)");
    luna.addColorStop(1, "rgba(232,238,240,0)");
    c.fillStyle = luna;
    c.fillRect(0, 0, w, h);

    const capas = [
      { base: 0.52, alto: 0.3, color: "rgba(61,85,96,0.55)", n: 22, niebla: 0.22 },
      { base: 0.68, alto: 0.42, color: "rgba(34,52,60,0.85)", n: 16, niebla: 0.16 },
      { base: 0.86, alto: 0.6, color: "#101c21", n: 10, niebla: 0.1 },
      { base: 1.02, alto: 0.75, color: "#0a1215", n: 6, niebla: 0 },
    ];

    for (const capa of capas) {
      const paso = w / capa.n;
      for (let i = -1; i <= capa.n; i++) {
        const x = i * paso + rnd() * paso;
        const alto = h * capa.alto * (0.65 + rnd() * 0.45);
        const ancho = alto * (0.26 + rnd() * 0.08);
        this.pino(c, x, h * capa.base, ancho, alto, capa.color, rnd);
      }
      if (capa.niebla > 0) {
        const y = h * capa.base;
        const n = c.createLinearGradient(0, y - h * 0.24, 0, y + h * 0.12);
        n.addColorStop(0, "rgba(169,188,196,0)");
        n.addColorStop(0.6, `rgba(169,188,196,${capa.niebla})`);
        n.addColorStop(1, "rgba(169,188,196,0)");
        c.fillStyle = n;
        c.fillRect(0, y - h * 0.24, w, h * 0.36);
      }
    }
  }

  /** Silueta de pino: tronco central con pisos de ramas en zigzag. */
  private pino(
    c: CanvasRenderingContext2D,
    x: number,
    base: number,
    ancho: number,
    alto: number,
    color: string,
    rnd: () => number,
  ) {
    const pisos = 9 + Math.floor(rnd() * 5);
    const izq: [number, number][] = [];
    const der: [number, number][] = [];
    for (let i = 0; i <= pisos; i++) {
      const t = i / pisos; // 0 = punta, 1 = base
      const y = base - alto + alto * t;
      const radio = (ancho / 2) * Math.pow(t, 0.9);
      const caida = (alto / pisos) * 0.55;
      const jitter = 1 + (rnd() - 0.5) * 0.35;
      izq.push([x - radio * jitter, y + caida], [x - radio * 0.45, y + caida * 0.3]);
      der.push([x + radio * jitter, y + caida], [x + radio * 0.45, y + caida * 0.3]);
    }
    c.beginPath();
    c.moveTo(x, base - alto - alto * 0.03);
    for (const [px, py] of der) c.lineTo(px, py);
    c.lineTo(x + ancho * 0.05, base + alto);
    c.lineTo(x - ancho * 0.05, base + alto);
    for (let i = izq.length - 1; i >= 0; i--) c.lineTo(izq[i][0], izq[i][1]);
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }

  private crearLuces() {
    const rnd = aleatorio(2412);
    this.luces = [];
    // Dos guirnaldas de luces colgando en curva, desenfocadas por la distancia.
    const guirnaldas = [
      { y: 0.2, caida: 0.07, n: 9, r: 0.05 },
      { y: 0.36, caida: 0.05, n: 7, r: 0.035 },
    ];
    const minimo = Math.min(this.ancho, this.alto);
    for (const g of guirnaldas) {
      for (let i = 0; i < g.n; i++) {
        const t = (i + 0.5) / g.n;
        const x = t * this.ancho + (rnd() - 0.5) * 20;
        const y = (g.y + Math.sin(t * Math.PI) * g.caida) * this.alto;
        this.luces.push({
          x,
          y,
          r: minimo * g.r * (0.7 + rnd() * 0.6),
          fase: rnd() * Math.PI * 2,
          vel: 0.4 + rnd() * 0.8,
        });
      }
    }
  }

  private crearGotas() {
    const rnd = aleatorio(77);
    const n = Math.round((this.ancho * this.alto) / 9000);
    this.gotas = Array.from({ length: n }, () => ({
      x: rnd() * this.ancho,
      y: rnd() * this.alto,
      largo: 10 + rnd() * 18,
      vel: 260 + rnd() * 260,
    }));
  }

  private dibujar(t: number) {
    const c = this.ctx;
    const d = this.dpr;
    const dt = this.ultimo ? Math.min((t - this.ultimo) / 1000, 0.1) : 0;
    this.ultimo = t;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.fondo, 0, 0);
    c.setTransform(d, 0, 0, d, 0, 0);

    c.globalCompositeOperation = "lighter";
    for (const l of this.luces) {
      const brillo = 0.55 + 0.25 * Math.sin(t / 1000 * l.vel + l.fase);
      const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(255,214,150,${0.5 * brillo})`);
      g.addColorStop(0.55, `rgba(255,190,120,${0.28 * brillo})`);
      g.addColorStop(0.8, `rgba(255,170,110,${0.1 * brillo})`);
      g.addColorStop(1, "rgba(255,170,110,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";

    c.strokeStyle = "rgba(200,215,220,0.16)";
    c.lineWidth = 1;
    c.beginPath();
    for (const g of this.gotas) {
      g.y += g.vel * dt;
      g.x -= g.vel * dt * 0.12;
      if (g.y > this.alto) {
        g.y = -g.largo;
        g.x = Math.random() * (this.ancho + 60);
      }
      c.moveTo(g.x, g.y);
      c.lineTo(g.x - g.largo * 0.12, g.y + g.largo);
    }
    c.stroke();

    for (const fn of this.oyentes) fn();
  }

  private iniciar() {
    cancelAnimationFrame(this.anim);
    this.ultimo = 0;
    if (document.hidden) return;
    if (reducirMovimiento.matches) {
      this.dibujar(0);
      // Aún así redibujamos cuando alguien está limpiando un vidrio.
      const bucleQuieto = () => {
        if (this.oyentes.size) for (const fn of this.oyentes) fn();
        this.anim = requestAnimationFrame(bucleQuieto);
      };
      this.anim = requestAnimationFrame(bucleQuieto);
      return;
    }
    const bucle = (t: number) => {
      this.dibujar(t);
      this.anim = requestAnimationFrame(bucle);
    };
    this.anim = requestAnimationFrame(bucle);
  }
}
