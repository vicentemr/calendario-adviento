// Gotas de condensación distintas en cada vidrio (siempre las mismas).
export function gotasPara(dia: number) {
  let s = dia * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  // Cada gota: brillo pequeño arriba a la izquierda, cuerpo oscuro que
  // refracta y una sombra suave abajo. Densidad distinta por vidrio.
  const cantidad = 8 + Math.floor(rnd() * 9);
  const capas: string[] = [];
  const f = (v: number) => v.toFixed(2);
  for (let i = 0; i < cantidad; i++) {
    const x = rnd() * 92 + 4;
    const y = rnd() * 92 + 4;
    // Unas pocas gotas grandes, el resto finas.
    const r = i < 3 ? rnd() * 1.4 + 2.2 : rnd() * 1 + 1;
    capas.push(
      // Brillo: lo que más se ve de una gota.
      `radial-gradient(circle at calc(${f(x)}% - ${f(r * 0.3)}px) calc(${f(y)}% - ${f(r * 0.35)}px), rgba(255,255,255,.9) 0 ${f(r * 0.38)}px, rgba(255,255,255,0) ${f(r * 0.7)}px)`,
      // Cuerpo: refracción suave, más clara arriba que abajo.
      `radial-gradient(circle at ${f(x)}% calc(${f(y)}% + ${f(r * 0.2)}px), rgba(15,26,31,.2) 0 ${f(r * 0.6)}px, rgba(232,238,240,.22) ${f(r)}px, transparent ${f(r + 0.6)}px)`,
      // Sombrita debajo.
      `radial-gradient(circle at ${f(x)}% calc(${f(y)}% + ${f(r * 0.5)}px), rgba(15,26,31,${i < 3 ? ".32" : ".14"}) 0 ${f(r * 0.85)}px, transparent ${f(r + 0.6)}px)`,
    );
  }
  return capas.join(", ");
}
