# Configurar comprobantes personalizados

El proyecto conserva su interfaz. La actualización cambia el evento privado de donación y el workflow de n8n.

El comprobante llega al correo de la cuenta del donante con «Hola [nombre]:». El aviso al equipo es otro correo. La API de Hacienda devuelve el nombre asociado a una cédula; no obtiene el correo ni verifica quién está usando la cuenta.

## 1. Crear la hoja

1. Entrá a https://sheets.google.com y creá un documento llamado **CR Conecta - Donaciones**.
2. Cambiá el nombre de la pestaña inferior a **Donaciones**.
3. Abrí `CABECERAS-GOOGLE-SHEETS.txt`, copiá la única línea completa y pegala en la celda **A1**. Las tabulaciones distribuyen cada título en su columna. No cambies los títulos.
4. Mantené el acceso restringido al equipo autorizado. No publiques la hoja.
5. En la dirección del documento, copiá solamente lo que aparece entre `/d/` y `/edit`. Ese texto es el ID del documento.

Ejemplo: en `https://docs.google.com/spreadsheets/d/ABC123/edit`, el ID sería `ABC123`.

## 2. Importar el workflow

Importá `CR-Conecta-Avisos-y-Comprobantes.json` desde el menú de n8n **Import from File**. Desactivá la versión antigua antes de activar la nueva: ambas usan las mismas rutas de Webhook.

Abrí **Configurar y validar donación**. Al inicio del código cambiá:

```js
const config = {
  remitente: 'tu-correo-autorizado@dominio.com',
  correoEquipo: 'correo-del-equipo@dominio.com',
  spreadsheetId: 'EL_ID_DEL_DOCUMENTO',
  sheetName: 'Donaciones',
  consultarHaciendaSiempre: true
};
```

`remitente` debe estar autorizado por tu proveedor SMTP. El correo del donante se obtiene de su cuenta: no lo escribís en este nodo.

Con `consultarHaciendaSiempre: true`, n8n consulta Hacienda cuando recibe una cédula válida de 9 a 12 dígitos. Si devuelve un nombre lo usa; si hay error, demora, límite de consultas o no hay resultado, usa el nombre de la cuenta. Con `false`, consulta únicamente si falta el nombre registrado, reduciendo las llamadas al servicio.

Hacienda ya tiene la URL y el parámetro configurados en **Consultar Hacienda**. No necesita una clave en este flujo. La cédula no se guarda en Sheets ni aparece en los correos.

## 3. Conectar tus credenciales

En cada uno de estos tres nodos elegí tu credencial **SMTP**:

- **Avisar al equipo** (solicitud aprobada).
- **Enviar aporte y comprobante** (donante).
- **Avisar nuevo aporte al equipo** (donación).

En **Avisar al equipo**, cambiá también los dos correos de ejemplo por el remitente y el correo del equipo; esa rama conserva su configuración independiente.

En estos cuatro nodos elegí la misma credencial **Google Sheets OAuth2** y autorizá la cuenta que tiene acceso al documento:

- **Buscar registro del evento**.
- **Guardar registro**.
- **Actualizar envío al donante**.
- **Actualizar aviso al equipo**.

Si n8n ofrece **Sign in with Google**, usá ese botón. Si tu instalación pide **Client ID** y **Client Secret**, seguí su guía oficial para crear un cliente OAuth, activar Google Sheets API y Google Drive API, y registrar exactamente la **OAuth Redirect URL** que muestra n8n. No pegues credenciales en el código.

Los documentos y la pestaña usan las expresiones que apuntan al nodo de configuración; no hay que seleccionar un documento diferente en cada nodo. **EventId** es la columna de coincidencia.

En ambos Webhook seleccioná la credencial **Header Auth**:

- **Name**: `X-CR-Conecta-Token`.
- **Value**: el valor de `N8N_WEBHOOK_TOKEN` de tu `.env`.

## 4. Probar sin rellenar otra donación

1. Abrí `n8n/EVENTO-DE-PRUEBA.json` y cambiá `recipient.email` por un correo tuyo. Poné el nombre que querés usar en `recipient.name`.
2. Dejá `identification` vacío para probar usando el nombre registrado. Para probar Hacienda, ingresá una cédula autorizada en ese campo.
3. Abrí **Donación registrada** y pulsá **Listen for test event**.
4. Verificá que `N8N_DONATION_WEBHOOK_URL` del `.env` coincide con su **Test URL**.
5. Desde la carpeta del proyecto ejecutá:

```text
npm run n8n:test
```

El comando manda el evento de prueba; no crea una donación en `db.json`. La respuesta HTTP solo confirma que el Webhook aceptó el evento. Revisá el buzón del donante, el correo del equipo y la fila de Sheets para comprobar el resultado final.

La fila debe mostrar `EstadoCorreo: Enviado` y `EstadoEquipo: Enviado`, con sus fechas. «Enviado» significa que SMTP aceptó el correo; no confirma que se leyó ni que llegó a la bandeja principal.

Para probar la protección de reenvíos, volvé a escuchar y ejecutá el mismo comando. Si ambos estados ya son Enviado, no se mandan nuevamente. Para una prueba nueva cambiá **ambos** valores: `data.id` a `DON-PRUEBA2` y `eventId` a `donation.registered:DON-PRUEBA2`.

Para una prueba desde la página, iniciá `npm run server` y `npm run dev`, creá una cuenta de donante con tu correo y registrá un aporte mientras el Webhook escucha. La foto obligatoria y las confirmaciones se mantienen.

## 5. Uso automático

Activá o publicá el workflow según tu versión de n8n. Copiá las **Production URL** de los dos Webhook a `.env`, conservá tu token y reiniciá `npm run server`. Las URL `/webhook-test/` sirven solo mientras hay una prueba escuchando; las URL `/webhook/` se usan en el flujo activo.

## Seguimiento y reintentos

La hoja registra producto, cantidad, destino, provincia, cantón y estado de cada correo. Si la donación es anónima, en la hoja queda Nombre = Anónimo y Correo vacío; el aviso al equipo también oculta el nombre. Solo el correo privado del donante tiene el saludo personalizado.

Los errores SMTP quedan como **Error** con un mensaje de seguimiento. Reenviar el mismo evento completo vuelve a intentar únicamente los correos que no figuran como Enviado. No ejecutes directamente el nodo SMTP para reintentar: eso salta la comprobación del estado. No hay un reintento SMTP automático porque una conexión cortada puede ocurrir después de que el proveedor aceptó el correo.

Sheets reintenta sus operaciones hasta tres veces. Si Sheets no responde antes del envío, el flujo se detiene para evitar mandar un correo sin registro. Si el correo salió pero falla la actualización final, revisá el proveedor antes de reenviar y actualizá el estado si corresponde.

Este control es apropiado para pruebas y reenvíos secuenciales. Google Sheets no ofrece una reserva atómica del evento: dos ejecuciones simultáneas del mismo evento podrían enviar dos correos. No pruebes el mismo ID en paralelo. Un uso de producción con alta concurrencia necesita un registro de envíos en base de datos con clave única y procesamiento exclusivo por evento.

La API de la página guarda la donación antes de avisar a n8n. Si el Webhook está apagado o no responde, la donación permanece guardada, pero no hay una cola automática de avisos en esta entrega. Reenviá el evento usando el ID original después de corregir la conexión.

Por privacidad, el workflow no conserva los datos completos de ejecuciones exitosas, fallidas o manuales en el historial. Durante una prueba con datos ficticios podés activar temporalmente su almacenamiento en Settings si necesitás depurar; luego restaurá esta configuración. No fijes como datos de prueba payloads con información real.

## Qué se verificó en esta entrega

Se probaron con servicios simulados la transmisión desde la sesión, personalización, fallback de Hacienda, escape HTML, anonimato, estados SMTP, repetición del mismo evento y reintento de un solo destinatario. También pasan las pruebas del proyecto, lint y compilación. La importación y los envíos reales requieren tu instancia de n8n y tus credenciales; no se han ejecutado desde esta entrega.

Documentación oficial:

- Hacienda: https://api.hacienda.go.cr/docs/
- HTTP Request: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- Google Sheets: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/sheet-operations/
- Credenciales Google: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/
