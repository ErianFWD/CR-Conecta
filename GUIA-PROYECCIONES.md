# CR Conecta: proyecciones, PDF y seguimiento

## Iniciar

Usá Node.js 24 (versión utilizada para las pruebas). Desde esta carpeta:

```bash
npm install
npm run server
```

En otra terminal:

```bash
npm run dev
```

Abrí http://localhost:5173. El ZIP incluye el `.env` transcrito de la captura, junto a `package.json`. Conserva las dos líneas de `N8N_APPROVAL_WEBHOOK_URL`; dotenv utiliza la última, que contiene el enlace de producción. Los enlaces y el token de n8n se mantuvieron. Los archivos del flujo n8n no se modificaron.

La captura contiene `GROQ_API_KEY=pon-tu-clave-aqui`. Por esa razón, inicialmente las proyecciones usan el cálculo estadístico y su interpretación automática. Para obtener redacción de Groq, reemplazá ese marcador por tu clave válida y reiniciá `npm run server`. El modelo se conserva como en la captura. Si el proveedor falla, continúa disponible la interpretación automática, identificada como tal.

## Dónde está

- Administrador: **Panel de gestión → Resumen → Proyección de campañas y cobertura**.
- Empresa donante: **Panel de gestión → Campañas y empleo**.

## Generar y seguir una meta

1. Elegí categoría, meta en unidades y duración de 1 a 52 semanas.
2. Dejá marcada **Guardar y seguir esta meta desde ahora** para guardar el resultado y comenzar el seguimiento. Desmarcala para una simulación sin seguimiento.
3. Pulsá **Calcular proyección**. La vista previa que se carga automáticamente no crea una meta.
4. Consultá **Seguimiento de metas guardadas**. Cada cálculo guardado es una meta independiente y conserva su informe original.

El avance cuenta nuevas donaciones registradas de la categoría desde el comienzo del seguimiento hasta su vencimiento. Para empresas, cuenta únicamente sus propias donaciones. Excluye las donaciones anteriores, canceladas, de otra categoría o posteriores al cierre. No usa el progreso de campañas anteriores. Se miden unidades registradas, no entregas confirmadas.

- **Meta cumplida:** al llegar a la cantidad indicada aparece una ventana con check SVG verde, sin emoji.
- **Meta no cumplida:** aparece una ventana con icono SVG rojo cuando vence el plazo sin completar la meta.
- Antes del vencimiento, una meta incompleta sigue **En curso**. Una estimación favorable no se confunde con una meta cumplida.

Las metas se guardan en `db.json`, asociadas a la cuenta que las generó. El estado se calcula al consultar los datos. Con la página abierta se revisa cada 15 segundos y al recuperar el foco. Si cerraste la página, los avisos pendientes aparecen cuando volvés a iniciar sesión. **Entendido** guarda la confirmación para evitar repetir el mismo aviso. No son notificaciones del sistema operativo.

El modal usa un diálogo nativo con foco, teclado, fondo bloqueado, texto e icono para no depender solo del color. Se adapta al ancho móvil y hereda el tema y tamaño de letra.

## Subir información en PDF

En **Historial desde PDF**, descargá la plantilla. Prepará un documento con texto seleccionable; cada registro debe ocupar una línea con este formato:

```text
YYYY-MM-DD | Categoría | Cantidad
```

Por ejemplo: una fecha real pasada, `Alimentos sellados` y la cantidad registrada. Se aceptan cantidades decimales con punto o coma. El documento admite encabezados y notas; los registros deben empezar con la fecha. Podés crear el documento en Word o Google Docs y exportarlo como PDF.

La plantilla contiene datos de ejemplo de semanas recientes: reemplazalos por los reales. El modelo utiliza hasta 12 semanas recientes de historial. Un PDF con datos muy antiguos puede producir una estimación de cero por falta de actividad reciente.

1. Subí el archivo con **Seleccionar PDF**.
2. Revisá la cantidad de registros y la tabla de vista previa.
3. Seleccioná la categoría correspondiente y pulsá **Calcular proyección**.

El historial importado sustituye el historial de donaciones para ese cálculo; no se suma a él, no crea donaciones en la plataforma ni dispara n8n. Las solicitudes, campañas e inventario siguen aportando contexto según el rol. Para regresar a los datos de la plataforma, pulsá **Quitar PDF y usar la plataforma** y calculá nuevamente.

Límites: 10 MB, 30 páginas y 2000 registros. Se rechazan fechas inexistentes o futuras, cantidades no positivas, archivos falsos y filas incompletas. Los PDF escaneados necesitan conversión a texto (no incluye OCR). Los PDF con contraseña requieren una copia sin protección. El archivo se lee en el navegador; se envían al servidor las filas validadas y la IA recibe agregados numéricos.

## Descargar las proyecciones

**Descargar PDF** genera un archivo real con categoría, fecha, meta, fuente, confianza, interpretación, recomendaciones, gráfico acumulado, tabla semanal y supuestos. Los informes del historial incluyen también avance real y estado. El CSV existente continúa disponible.

Los informes exportados incluyen el historial utilizado en un apartado separado, que se puede volver a importar. Las cifras futuras del gráfico no se importan como donaciones históricas. No se garantiza el formato de documentos PDF de terceros: usá el formato de filas indicado.

## Pruebas

```bash
npm test
npm run test:coverage
npm run lint
npm run build
```

`npm test` ejecuta Jest, las pruebas anteriores de Node y una prueba de exportación/importación de un PDF real. Para comprobar éxito y fracaso sin esperar varias semanas, usá las pruebas de `ProjectionResultModal`, `ProjectionNotifications`, `server/projectionTracking.test.js` y `server/projectionRoutes.test.js`: usan datos aislados y no alteran tus donaciones.

El detalle de ejecución se encuentra en `RESULTADOS-PRUEBAS.md`.
