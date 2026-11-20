// La escena detrás del vidrio: bosque de pinos en niebla, luces cálidas
// desenfocadas y lluvia. Se dibuja en un canvas fijo que ocupa la pantalla.

type Luz = { x: number; y: number; r: number; fase: number; vel: number };
type Gota = { x: number; y: number; largo: number; vel: number };
type Pino = { x: number; base: number; alto: number };

/** Duración de cada subida y bajada de la pareja, en milisegundos. */
const CICLO_PAREJA = 20000;
const suave = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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
  private pinos: Pino[] = [];

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

    this.pinos = [];
    for (const [indice, capa] of capas.entries()) {
      const paso = w / capa.n;
      for (let i = -1; i <= capa.n; i++) {
        const x = i * paso + rnd() * paso;
        const alto = h * capa.alto * (0.65 + rnd() * 0.45);
        const ancho = alto * (0.26 + rnd() * 0.08);
        this.pino(c, x, h * capa.base, ancho, alto, capa.color, rnd);
        // Los pinos cercanos y dentro de la pantalla sirven para trepar.
        if (indice >= 2 && x > w * 0.06 && x < w * 0.94) {
          this.pinos.push({ x: x / this.dpr, base: (h * capa.base) / this.dpr, alto: alto / this.dpr });
        }
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

    this.dibujarPareja(c, t);

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

  /** Pino elegido para la vuelta n: al azar, pero nunca el mismo dos veces seguidas. */
  private pinoDeVuelta(n: number): number {
    const total = this.pinos.length;
    const elegir = (k: number) => Math.floor(aleatorio(k * 7919 + 31)() * total);
    let i = elegir(n);
    if (total > 1 && n > 0 && i === elegir(n - 1)) i = (i + 1) % total;
    return i;
  }

  /**
   * Una pareja en silueta trepa un pino: él sube con ella a la espalda,
   * descansan arriba (sale un corazoncito) y bajan. Cada vuelta, otro pino.
   */
  private dibujarPareja(c: CanvasRenderingContext2D, t: number) {
    if (!this.pinos.length || t <= 0) return;
    const vuelta = Math.floor(t / CICLO_PAREJA);
    const s = (t % CICLO_PAREJA) / 1000; // segundos dentro de la vuelta
    if (s >= 18) return; // descanso entre vueltas

    // Línea de tiempo: aparece, sube, descansa, baja, desaparece.
    let avance: number; // 0 = abajo, 1 = arriba
    let moviendo = true;
    if (s < 1) avance = 0;
    else if (s < 8) avance = suave((s - 1) / 7);
    else if (s < 11) (avance = 1), (moviendo = false);
    else if (s < 17) avance = 1 - suave((s - 11) / 6);
    else avance = 0;
    const opacidad = s < 1 ? s : s > 17 ? 18 - s : 1;

    const pino = this.pinos[this.pinoDeVuelta(vuelta)];
    const abajo = Math.min(pino.base - pino.alto * 0.2, this.alto - 20);
    const arriba = pino.base - pino.alto * 0.9;
    const y = abajo + (arriba - abajo) * avance;
    const escala = Math.max(pino.alto * 0.038, 11);
    const paso = moviendo ? Math.sin(s * Math.PI * 3.2) : 0; // brazos y piernas alternando
    const viento = Math.sin(s * 5.1) * 0.5 + Math.sin(s * 8.3) * 0.25; // ondea pelo, abrigo y bufanda
    // Arriba levantan un poco la cabeza hacia la luna (arriba a la derecha).
    const mirar = !moviendo && s > 8.4 && s < 10.6 ? 1 : 0;

    c.save();
    c.globalAlpha = opacidad;
    c.translate(pino.x, y + (moviendo ? Math.abs(paso) * escala * 0.08 : 0));
    c.scale(escala, escala);
    c.lineCap = "round";
    c.lineJoin = "round";
    // Halo de niebla para que las figuras se lean contra el pino oscuro.
    c.shadowColor = "rgba(190,206,212,0.5)";
    c.shadowBlur = 6;

    const ABRIGO = "#070d10";
    const PIEL_NOCHE = "#0b1317"; // ropa y piel apagadas por la noche, sin caras
    const CHOMPA = "#1c272c";
    const PELO = "#050809";
    const BUFANDA = "#7d1a29";

    const linea = (color: string, ancho: number, ...puntos: [number, number][]) => {
      c.strokeStyle = color;
      c.lineWidth = ancho;
      c.beginPath();
      c.moveTo(puntos[0][0], puntos[0][1]);
      for (const [px, py] of puntos.slice(1)) c.lineTo(px, py);
      c.stroke();
    };
    const forma = (color: string, dibujar: () => void) => {
      c.fillStyle = color;
      c.beginPath();
      dibujar();
      c.closePath();
      c.fill();
    };
    const elipse = (color: string, x: number, yy: number, rx: number, ry: number, giro = 0) =>
      forma(color, () => c.ellipse(x, yy, rx, ry, giro, 0, Math.PI * 2));

    // ── Él, de espaldas, trepando con abrigo largo ──
    // Piernas (pantalón oscuro) asomando bajo el abrigo.
    linea(ABRIGO, 0.26, [-0.18, -0.2], [-0.55, 0.35 - paso * 0.25], [-0.3, 0.85]);
    linea(ABRIGO, 0.26, [0.18, -0.2], [0.55, 0.35 + paso * 0.25], [0.3, 0.85]);
    // Brazos estirados hacia el tronco, alternando.
    linea(ABRIGO, 0.26, [-0.36, -1.75], [-0.6, -2.25 + paso * 0.2], [-0.42, -2.75 + paso * 0.3]);
    linea(ABRIGO, 0.26, [0.36, -1.75], [0.6, -2.25 - paso * 0.2], [0.42, -2.75 - paso * 0.3]);
    // Abrigo largo: hombros anchos y faldones que el viento abre.
    forma(ABRIGO, () => {
      c.moveTo(-0.45, -1.85);
      c.quadraticCurveTo(0, -2.0, 0.45, -1.85);
      c.lineTo(0.5, -0.9);
      c.quadraticCurveTo(0.62 + viento * 0.12, -0.2, 0.72 + viento * 0.22, 0.25);
      c.lineTo(0.05, 0.05);
      c.lineTo(-0.62 + viento * 0.18, 0.28);
      c.quadraticCurveTo(-0.55 + viento * 0.1, -0.2, -0.5, -0.9);
    });
    // Cuello del abrigo levantado.
    forma(ABRIGO, () => {
      c.moveTo(-0.3, -1.9);
      c.lineTo(-0.24, -2.18);
      c.lineTo(0.24, -2.18);
      c.lineTo(0.3, -1.9);
    });
    // Cabeza de espaldas con pelo despeinado por el viento.
    c.save();
    c.translate(0, -2.32);
    c.rotate(mirar * -0.18);
    elipse(PIEL_NOCHE, 0, 0, 0.26, 0.3);
    forma(PELO, () => {
      c.moveTo(-0.3, 0.05);
      c.quadraticCurveTo(-0.34, -0.36, 0, -0.36);
      c.lineTo(0.08, -0.48 + viento * 0.04);
      c.lineTo(0.14, -0.35);
      c.lineTo(0.3, -0.42 + viento * 0.05);
      c.quadraticCurveTo(0.34, -0.15, 0.28, 0.05);
      c.quadraticCurveTo(0, -0.08, -0.3, 0.05);
    });
    c.restore();

    // ── Ella, en su espalda ──
    // Piernas rodeando su cintura (botas al final).
    linea(CHOMPA, 0.2, [0.22, -1.0], [0.72, -0.82], [0.55, -0.38]);
    linea(CHOMPA, 0.2, [-0.22, -1.0], [-0.7, -0.8], [-0.52, -0.36]);
    elipse(ABRIGO, 0.55, -0.32, 0.13, 0.09);
    elipse(ABRIGO, -0.52, -0.3, 0.13, 0.09);
    // Chompa tejida, holgada.
    forma(CHOMPA, () => {
      c.moveTo(-0.28, -1.95);
      c.quadraticCurveTo(0.12, -2.08, 0.5, -1.92);
      c.quadraticCurveTo(0.6, -1.4, 0.48, -0.95);
      c.quadraticCurveTo(0.1, -0.85, -0.3, -0.95);
      c.quadraticCurveTo(-0.38, -1.45, -0.28, -1.95);
    });
    // Brazos abrazados a su cuello.
    linea(CHOMPA, 0.17, [0.42, -1.8], [0.05, -2.0], [-0.32, -1.98]);
    linea(CHOMPA, 0.15, [-0.22, -1.78], [-0.38, -1.95]);
    // Pelo largo suelto que cae por la espalda y ondea.
    forma(PELO, () => {
      c.moveTo(-0.08, -2.62);
      c.quadraticCurveTo(0.55, -2.75, 0.62, -2.2);
      c.quadraticCurveTo(0.7 + viento * 0.15, -1.6, 0.58 + viento * 0.3, -1.2);
      c.quadraticCurveTo(0.42 + viento * 0.2, -1.45, 0.3, -1.4);
      c.quadraticCurveTo(0.05 + viento * 0.25, -1.55, -0.18 + viento * 0.35, -1.35);
      c.quadraticCurveTo(-0.2, -1.9, -0.08, -2.62);
    });
    // Cabeza (de espaldas, solo pelo).
    c.save();
    c.translate(0.24, -2.42);
    c.rotate(mirar * -0.22);
    elipse(PELO, 0, 0, 0.27, 0.3);
    c.restore();
    // Bufanda roja larga: vuelta al cuello y una cola que flamea con el viento.
    linea(BUFANDA, 0.14, [-0.18, -2.08], [0.18, -2.14], [0.52, -2.06]);
    forma(BUFANDA, () => {
      const x0 = -0.15;
      const y0 = -2.06;
      c.moveTo(x0, y0 - 0.06);
      for (let i = 1; i <= 6; i++) {
        const k = i / 6;
        const ola = Math.sin(s * 6 - k * 4) * 0.12 * k;
        c.lineTo(x0 - k * (1.1 + viento * 0.25), y0 + k * 0.35 + ola - 0.07);
      }
      for (let i = 6; i >= 0; i--) {
        const k = i / 6;
        const ola = Math.sin(s * 6 - k * 4) * 0.12 * k;
        c.lineTo(x0 - k * (1.1 + viento * 0.25), y0 + k * 0.35 + ola + 0.07 + k * 0.03);
      }
    });

    // Arriba, mientras descansan, sube un corazoncito.
    if (s >= 8.2 && s < 11) {
      const k = (s - 8.2) / 2.8;
      c.shadowBlur = 0;
      c.globalAlpha = opacidad * Math.sin(k * Math.PI);
      c.translate(0.15, -3.3 - k * 1.6);
      c.scale(0.5, 0.5);
      c.fillStyle = "#c23a4c";
      c.beginPath();
      c.moveTo(0, 0.9);
      c.bezierCurveTo(-1.4, 0, -1, -1.1, 0, -0.45);
      c.bezierCurveTo(1, -1.1, 1.4, 0, 0, 0.9);
      c.fill();
    }
    c.restore();
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
