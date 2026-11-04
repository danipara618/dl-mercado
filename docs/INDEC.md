# Integración API-INDEC · DL Mercado

## Qué contiene

Ruta `/observatorio` con catálogo de 18 servicios, filtros, gráfico (sólo cuando existe una serie temporal no ambigua), tabla y descarga CSV. El proxy `/api/indec/[servicio]` realiza consultas oficiales con caché de una hora y paginación de 500 registros.

## Configurar el acceso

La API oficial exige autenticación JWT. Registrarse en https://api.indec.gob.ar/, confirmar el correo electrónico y generar un token desde el perfil.

**En Vercel**: Project → Settings → Environment Variables → crear `INDEC_API_TOKEN` (sin prefijo `NEXT_PUBLIC_`). Activar Production, Preview y Development según necesidad; volver a desplegar tras configurar. **No introducir el JWT en un chat, archivo, cliente JS ni repositorio público.**

Para ejecutar localmente, agregar `INDEC_API_TOKEN=...` a `.env.local` sin versionarlo.

## Consideraciones estadísticas

- Los 18 endpoints se listan en `lib/indecCatalogo.ts` y se habilitan explícitamente en el proxy, sin proxy genérico ni token expuesto.
- Cada llamada recupera hasta 500 registros; **no implica la serie histórica completa**. La opción «Cargar otros 500 registros» continúa la paginación desde el siguiente desplazamiento.
- Para visualizar una serie, filtrar hasta que haya un único registro por período. Si hay múltiples filas por período, el gráfico oculta ese punto en vez de promediarlas; la tabla y el CSV mantienen todas las filas originales.
- En caso de HTTP 401/403, revisar el token. HTTP 400 requiere verificar campos y filtros; HTTP 5xx puede ser disponibilidad temporal.
- Este desarrollo aún necesita validarse contra los datos reales de los servicios con una credencial activa (esquemas de campo, denominaciones y orden de las claves). Las definiciones provienen del catálogo oficial; no se inventan cifras.
- El archivo descargado contiene únicamente los registros filtrados que se cargaron en el navegador.
- El catálogo es independiente de los datos históricos hardcodeados del viejo MacroDashboard; **no sustituye esas series hasta contrastar los datos oficiales y garantizar equivalencia de periodicidad, base y unidad**.
- Fuente: INDEC, Catálogo API-INDEC. Sitio no oficial.

## Comprobación

`npm run typecheck` y `npm run build`. Para validar API, abrir `/api/indec/ipc_nacional?limit=5&offset=0` desde la web; sin token debe responder 503 y un mensaje claro.
