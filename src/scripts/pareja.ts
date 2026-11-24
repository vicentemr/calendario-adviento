// La pareja a color: él trepa abrazado al tronco y ella va en su espalda,
// asomada sobre su hombro. Se dibuja en unidades: el tronco está en x = 0 y las
// caderas de él a la altura y = 0 (hacia arriba es negativo).

import type { EstadoPareja } from "./escena";

type C = CanvasRenderingContext2D;
type P = [number, number];

// Ropa y colores. Un poco apagados, porque es de noche.
const PIEL = "#e6bd99";
const PIEL_SOMBRA = "#cf9f7c";
const CASACA = "#c3c1bd";
const CASACA_SOMBRA = "#9a9996";
const CASACA_LINEA = "#63625f";
const POLO = "#4d5f7c";
const POLO_LINEA = "#33435c";
const PANTALON = "#263a6b";
const PANTALON_SOMBRA = "#1a294f";
const ZAPATO = "#20242c";
const PELO_EL = "#432a20";
const PELO_EL_LUZ = "#5f3d2e";
const VERDE = "#1f5a46";
const VERDE_SOMBRA = "#143d30";
const NEGRO = "#171b20";
const NEGRO_LUZ = "#2a3038";
const PELO_ELLA = "#4a2b21";
const PELO_ELLA_LUZ = "#6b4232";
const PELO_ELLA_SOMBRA = "#341d16";
const TINTA = "#2a1a14";

const mezcla = (a: number, b: number, k: number) => a + (b - a) * k;

function trazo(c: C, color: string, ancho: number, ...p: P[]) {
  c.strokeStyle = color;
  c.lineWidth = ancho;
  c.beginPath();
  c.moveTo(p[0][0], p[0][1]);
  for (const [x, y] of p.slice(1)) c.lineTo(x, y);
  c.stroke();
}

/** Brazo o pierna: curva que pasa por el codo o la rodilla. */
function miembro(c: C, color: string, ancho: number, a: P, codo: P, b: P) {
  c.strokeStyle = color;
  c.lineWidth = ancho;
  c.beginPath();
  c.moveTo(a[0], a[1]);
  // Punto de control para que la curva roce el codo.
  c.quadraticCurveTo(codo[0] * 2 - (a[0] + b[0]) / 2, codo[1] * 2 - (a[1] + b[1]) / 2, b[0], b[1]);
  c.stroke();
}

function forma(c: C, color: string, dibujar: () => void) {
  c.fillStyle = color;
  c.beginPath();
  dibujar();
  c.closePath();
  c.fill();
}

function elipse(c: C, color: string, x: number, y: number, rx: number, ry = rx, giro = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, giro, 0, Math.PI * 2);
  c.fill();
}

export function dibujarParejaColor(c: C, e: EstadoPareja) {
  const { paso, viento, s } = e;
  const juntos = e.descanso; // 0 = trepando, 1 = descansando arriba
  const parpadeo = s % 3.3 < 0.13 ? 0.12 : 1;
  const balanceo = paso * 0.045;
  c.lineCap = "round";
  c.lineJoin = "round";

  c.save();
  // Se inclinan apenas hacia el tronco.
  c.rotate(-0.07 + balanceo * 0.5);

  // ── Ella: pelo y cuerpo, detrás de él ──
  const hx = 1.22 - juntos * 0.1;
  const hy = -2.92 + balanceo * 0.6 + juntos * 0.06;
  forma(c, PELO_ELLA_SOMBRA, () => {
    c.moveTo(hx - 0.44, hy - 0.1);
    c.bezierCurveTo(hx - 0.2, hy - 0.75, hx + 0.6, hy - 0.6, hx + 0.56, hy + 0.1);
    c.bezierCurveTo(hx + 0.62, hy + 0.5, hx + 0.95 + viento * 0.12, hy + 0.7, hx + 0.86 + viento * 0.25, hy + 1.28);
    c.bezierCurveTo(hx + 0.6, hy + 1.2, hx + 0.4, hy + 1.35, hx + 0.1, hy + 1.1);
    c.lineTo(hx - 0.4, hy + 0.6);
  });
  // Pierna de atrás, colgando y meciéndose.
  const mece = Math.sin(s * 3.4) * 0.07;
  miembro(c, NEGRO, 0.36, [1.45, -1.05], [1.92, -0.72], [1.78 + mece, -0.12]);
  elipse(c, ZAPATO, 1.72 + mece, 0.06, 0.25, 0.16, 0.15);
  // Torso con la chompa verde.
  forma(c, VERDE, () => {
    c.moveTo(0.92, -2.42);
    c.quadraticCurveTo(1.5, -2.6, 1.82, -2.2);
    c.quadraticCurveTo(1.95, -1.6, 1.72, -1.0);
    c.lineTo(1.0, -1.0);
  });
  forma(c, VERDE_SOMBRA, () => {
    c.moveTo(1.52, -2.0);
    c.quadraticCurveTo(1.66, -1.5, 1.5, -1.0);
    c.lineTo(1.0, -1.0);
    c.lineTo(1.0, -2.0);
  });
  elipse(c, NEGRO, 1.4, -1.02, 0.4, 0.28);

  // ── Él: pierna y brazo del fondo ──
  miembro(c, PANTALON_SOMBRA, 0.4, [0.62, -0.12], [0.34, 0.24 - paso * 0.16], [0.22, 0.72 - paso * 0.14]);
  elipse(c, ZAPATO, 0.16, 0.84 - paso * 0.14, 0.27, 0.16, -0.25);
  const manoA: P = [-0.02, -2.28 + paso * 0.24];
  miembro(c, CASACA_SOMBRA, 0.36, [0.42, -1.62], [0.06, -1.78 + paso * 0.08], [manoA[0] + 0.06, manoA[1] + 0.2]);
  elipse(c, PIEL, manoA[0], manoA[1], 0.17, 0.18);
  elipse(c, PIEL_SOMBRA, manoA[0] - 0.08, manoA[1] + 0.02, 0.06, 0.12);

  // ── Él: torso con casaca ──
  miembro(c, PANTALON, 0.43, [0.94, -0.12], [0.94, 0.38 + paso * 0.12], [0.6, 0.74 + paso * 0.16]);
  elipse(c, ZAPATO, 0.52, 0.88 + paso * 0.16, 0.28, 0.16, -0.2);
  forma(c, PANTALON, () => {
    c.moveTo(0.36, -0.42);
    c.lineTo(1.2, -0.42);
    c.lineTo(1.16, 0.06);
    c.lineTo(0.42, 0.06);
  });
  forma(c, CASACA, () => {
    c.moveTo(0.34, -1.78);
    c.quadraticCurveTo(0.78, -1.98, 1.22, -1.76);
    c.quadraticCurveTo(1.32, -1.0, 1.28, -0.26);
    c.lineTo(0.3, -0.26);
    c.quadraticCurveTo(0.24, -1.0, 0.34, -1.78);
  });
  forma(c, CASACA_SOMBRA, () => {
    c.moveTo(1.08, -1.8);
    c.quadraticCurveTo(1.32, -1.0, 1.28, -0.26);
    c.lineTo(1.08, -0.26);
    c.quadraticCurveTo(1.16, -1.0, 1.08, -1.8);
  });
  // Polo azul y su botonera.
  forma(c, POLO, () => {
    c.moveTo(0.6, -1.86);
    c.lineTo(0.94, -1.86);
    c.lineTo(0.88, -0.26);
    c.lineTo(0.62, -0.26);
  });
  trazo(c, POLO_LINEA, 0.04, [0.76, -1.6], [0.75, -0.3]);
  forma(c, POLO_LINEA, () => {
    c.moveTo(0.58, -1.88);
    c.lineTo(0.77, -1.6);
    c.lineTo(0.96, -1.88);
  });
  // Solapas, botones y bolsillos.
  for (const [borde, punta, cuello] of [
    [0.62, 0.4, 0.5],
    [0.9, 1.1, 1.03],
  ]) {
    forma(c, CASACA, () => {
      c.moveTo(cuello, -1.9);
      c.lineTo(punta, -1.5);
      c.lineTo(borde, -1.08);
    });
    trazo(c, CASACA_LINEA, 0.04, [cuello, -1.88], [punta, -1.5], [borde, -1.08]);
  }
  trazo(c, CASACA_LINEA, 0.04, [0.62, -1.08], [0.62, -0.28]);
  trazo(c, CASACA_LINEA, 0.04, [0.9, -1.08], [0.88, -0.28]);
  for (const y of [-0.92, -0.62]) {
    elipse(c, CASACA_LINEA, 0.5, y, 0.045);
    elipse(c, CASACA_LINEA, 1.02, y, 0.045);
  }
  trazo(c, CASACA_LINEA, 0.045, [0.36, -0.72], [0.4, -0.46]);
  trazo(c, CASACA_LINEA, 0.045, [1.17, -0.72], [1.13, -0.46]);

  // Pierna de ella que lo rodea por la cintura.
  miembro(c, NEGRO, 0.35, [1.42, -0.92], [1.2, -0.44], [0.74, -0.26]);
  trazo(c, NEGRO_LUZ, 0.05, [1.36, -0.72], [1.16, -0.46]);
  elipse(c, ZAPATO, 0.58, -0.22, 0.24, 0.15, -0.2);

  // Brazo de adelante de él.
  const manoB: P = [0.06, -0.98 - paso * 0.22];
  miembro(c, CASACA, 0.33, [1.18, -1.52], [1.08, -0.92], [manoB[0] + 0.32, manoB[1] + 0.06]);
  trazo(c, CASACA_LINEA, 0.04, [manoB[0] + 0.3, manoB[1] - 0.1], [manoB[0] + 0.32, manoB[1] + 0.22]);
  elipse(c, PIEL, manoB[0] + 0.06, manoB[1], 0.18, 0.17);

  // ── Él: cabeza ──
  c.save();
  c.translate(0.74, -2.18 + balanceo);
  c.rotate(mezcla(-0.05, 0.16, juntos));
  trazo(c, PIEL_SOMBRA, 0.28, [0.02, 0.2], [0.02, 0.38]);
  elipse(c, PELO_EL, 0.06, -0.06, 0.43, 0.44);
  elipse(c, PIEL, -0.34 + 0.72, 0.06, 0.08, 0.11); // oreja
  forma(c, PIEL, () => {
    c.moveTo(-0.38, -0.2);
    c.bezierCurveTo(-0.4, 0.2, -0.3, 0.42, -0.02, 0.44);
    c.bezierCurveTo(0.28, 0.42, 0.36, 0.2, 0.34, -0.2);
  });
  // Pelo peinado hacia arriba.
  forma(c, PELO_EL, () => {
    c.moveTo(-0.42, -0.04);
    c.bezierCurveTo(-0.46, -0.2, -0.5, -0.36, -0.4, -0.46);
    c.lineTo(-0.36, -0.6 + viento * 0.03);
    c.lineTo(-0.2, -0.56);
    c.lineTo(-0.08, -0.7 + viento * 0.04);
    c.lineTo(0.06, -0.58);
    c.lineTo(0.24, -0.66 + viento * 0.03);
    c.lineTo(0.3, -0.5);
    c.bezierCurveTo(0.48, -0.42, 0.48, -0.2, 0.4, 0.02);
    c.lineTo(0.33, -0.14);
    c.quadraticCurveTo(0.1, -0.28, -0.1, -0.2);
    c.quadraticCurveTo(-0.28, -0.14, -0.36, -0.2);
  });
  trazo(c, PELO_EL_LUZ, 0.05, [-0.28, -0.34], [-0.2, -0.48]);
  trazo(c, PELO_EL_LUZ, 0.05, [-0.06, -0.36], [0, -0.52]);
  trazo(c, PELO_EL_LUZ, 0.05, [0.16, -0.36], [0.2, -0.5]);
  // Cejas marcadas, que se relajan cuando descansan.
  const ceja = mezcla(0.025, -0.02, juntos);
  trazo(c, TINTA, 0.07, [-0.3, -0.06 - ceja * 0.4], [-0.12, -0.04 + ceja]);
  trazo(c, TINTA, 0.07, [0.06, -0.04 + ceja], [0.25, -0.06 - ceja * 0.4]);
  // Mira el tronco al trepar y hacia ella al descansar.
  const ojoEl = mezcla(-0.02, 0.04, juntos);
  elipse(c, TINTA, -0.19 + ojoEl, 0.09 - juntos * 0.03, 0.05, 0.065 * parpadeo);
  elipse(c, TINTA, 0.15 + ojoEl, 0.09 - juntos * 0.03, 0.05, 0.065 * parpadeo);
  c.strokeStyle = TINTA;
  c.lineWidth = 0.045;
  c.beginPath();
  c.moveTo(-0.12, 0.28);
  c.quadraticCurveTo(0, 0.28 + juntos * 0.1, 0.12, 0.27 - juntos * 0.02);
  c.stroke();
  c.restore();

  // ── Ella: brazos abrazándolo ──
  miembro(c, VERDE, 0.31, [1.66, -2.14], [1.58, -1.78], [1.2, -1.74]);
  trazo(c, VERDE_SOMBRA, 0.04, [1.22, -1.88], [1.2, -1.62]);
  elipse(c, PIEL, 1.1, -1.72, 0.15, 0.14);
  elipse(c, VERDE, 0.36, -1.82, 0.17, 0.14, -0.4);
  elipse(c, PIEL, 0.44, -1.68, 0.13, 0.13);

  // ── Ella: cabeza, asomada sobre el hombro ──
  c.save();
  c.translate(hx, hy);
  c.rotate(mezcla(0.06, -0.2, juntos) + balanceo * 0.8);
  forma(c, PIEL, () => {
    c.moveTo(-0.34, -0.2);
    c.bezierCurveTo(-0.38, 0.2, -0.26, 0.42, -0.02, 0.42);
    c.bezierCurveTo(0.24, 0.42, 0.34, 0.2, 0.32, -0.2);
  });
  // Pelo largo, con raya al costado y ondas.
  forma(c, PELO_ELLA, () => {
    c.moveTo(-0.06, -0.3);
    c.bezierCurveTo(-0.24, -0.22, -0.3, -0.04, -0.3, 0.16);
    c.bezierCurveTo(-0.28, 0.36, -0.42, 0.44, -0.36, 0.66);
    c.bezierCurveTo(-0.52, 0.6, -0.54, 0.4, -0.48, 0.2);
    c.bezierCurveTo(-0.54, -0.4, -0.3, -0.62, 0.04, -0.62);
    c.bezierCurveTo(0.44, -0.62, 0.56, -0.3, 0.52, 0.04);
    c.bezierCurveTo(0.5, 0.34, 0.74 + viento * 0.08, 0.5, 0.62 + viento * 0.14, 0.86);
    c.bezierCurveTo(0.66 + viento * 0.2, 1.1, 0.46 + viento * 0.16, 1.22, 0.36 + viento * 0.18, 1.26);
    c.bezierCurveTo(0.44, 0.96, 0.22, 0.82, 0.32, 0.5);
    c.bezierCurveTo(0.38, 0.2, 0.34, -0.12, -0.06, -0.3);
  });
  c.strokeStyle = PELO_ELLA_LUZ;
  c.lineWidth = 0.055;
  c.beginPath();
  c.moveTo(0.04, -0.46);
  c.bezierCurveTo(0.38, -0.4, 0.42, -0.1, 0.42, 0.16);
  c.bezierCurveTo(0.42, 0.46, 0.58 + viento * 0.08, 0.54, 0.48 + viento * 0.14, 0.94);
  c.moveTo(-0.14, -0.46);
  c.bezierCurveTo(-0.36, -0.36, -0.4, -0.1, -0.4, 0.2);
  c.stroke();
  // Cara: mira hacia abajo, a él.
  trazo(c, TINTA, 0.045, [-0.24, -0.03], [-0.1, -0.06]);
  trazo(c, TINTA, 0.045, [0.08, -0.06], [0.21, -0.03]);
  const ojoElla = mezcla(-0.03, -0.06, juntos);
  if (juntos > 0.6) {
    // Contenta: ojitos cerrados.
    c.strokeStyle = TINTA;
    c.lineWidth = 0.05;
    for (const x of [-0.17, 0.14]) {
      c.beginPath();
      c.arc(x, 0.12, 0.07, Math.PI, 0);
      c.stroke();
    }
  } else {
    elipse(c, TINTA, -0.15 + ojoElla, 0.1, 0.048, 0.062 * parpadeo);
    elipse(c, TINTA, 0.17 + ojoElla, 0.1, 0.048, 0.062 * parpadeo);
  }
  c.globalAlpha = 0.45;
  elipse(c, "#d9816f", -0.23, 0.21, 0.07, 0.045);
  elipse(c, "#d9816f", 0.21, 0.21, 0.07, 0.045);
  c.globalAlpha = 1;
  c.strokeStyle = "#8d3d38";
  c.lineWidth = 0.05;
  c.beginPath();
  c.moveTo(-0.1, 0.25);
  c.quadraticCurveTo(-0.01, 0.31 + juntos * 0.04, 0.1, 0.24);
  c.stroke();
  c.restore();

  c.restore();
}
