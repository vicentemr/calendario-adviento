# Ventana de Adviento

Calendario de adviento navideño. Cada día de diciembre se abre una casilla y aparece un cupón.

## Diseños

| Ruta | Diseño | Entrada | Casillas |
| --- | --- | --- | --- |
| `/` (principal) | Crepúsculo: casa en el bosque, con la pareja trepando un pino | Puerta carmesí | 31 vidrios empañados que se limpian con el dedo |
| `/pino` | Casa verde | Puerta roja de dos hojas | 31 puertitas |
| `/jengibre` | Casita de galleta | Puerta verde con corazón | 31 galletas que se parten |
| `/envoltura` | Casa envuelta de regalo | Se desata el lazo y se abre la puerta | 31 paquetes cuyo papel se enrolla |
| `/ventana` | Ventana empañada | — | 24 vidrios que se limpian con el dedo |

Los cuatro de la casa comparten `src/layouts/Casa.astro`, `src/scripts/casa.ts` y `src/styles/casa.css`; cada uno tiene su página en `src/pages` y su hoja en `src/styles`. Los días 24, 27 y 31 son regalos dorados.

## Editar el contenido

- **Cupones:** `src/data/cupones.ts` — un objeto por día con `titulo`, `descripcion` y `condiciones` (opcional). Los que hay son ejemplos.
- **Nombre, firma, año y nombres de los días especiales:** `src/data/config.ts`.
- **Tamaño y lugar de cada casilla:** `src/data/cuadricula.ts`.

> Antes de entregar: pon `abrirTodo: false` en `src/data/config.ts`. Mientras esté en `true`, todas las casillas se abren sin validar la fecha.

## Desarrollo

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/ (sitio estático)
```

Solo en `npm run dev` puedes simular la fecha y reiniciar lo abierto:

- `http://localhost:4321/?hoy=2026-12-10` — hace como si hoy fuera 10 de diciembre.
- `http://localhost:4321/?hoy=2026-12-10&reset` — además borra lo ya abierto.

En producción siempre se usa la fecha real del celular.

## Publicar

`dist/` es estático: se puede subir a Vercel, Netlify o GitHub Pages sin configuración.
