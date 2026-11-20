# Ventana de Adviento

Calendario de adviento navideño: una ventana empañada de 24 vidrios. Cada día de diciembre (1–24) se habilita un vidrio; se limpia con el dedo y aparece un cupón.

## Editar el contenido

- **Cupones:** `src/data/cupones.ts` — un objeto por día con `titulo`, `descripcion` y `condiciones` (opcional). Los que hay son ejemplos.
- **Nombre, firma y año:** `src/data/config.ts`.

## Desarrollo

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/ (sitio estático)
```

Solo en `npm run dev` puedes simular la fecha y reiniciar lo abierto:

- `http://localhost:4321/?hoy=2026-12-10` — hace como si hoy fuera 10 de diciembre.
- `http://localhost:4321/?hoy=2026-12-10&reset` — además borra los vidrios ya abiertos.

En producción siempre se usa la fecha real del celular.

## Publicar

`dist/` es estático: se puede subir a Vercel, Netlify o GitHub Pages sin configuración.
