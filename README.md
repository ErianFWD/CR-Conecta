# Actualización de revisión

Ver `CAMBIOS-Y-PRUEBAS.md` para los cambios de navegación, registros nacionales, confirmaciones y pruebas. Para iniciar esta entrega ejecutar `npm install`, `npm run server` y `npm run dev` en terminales separadas.

# CR Conecta

Prototipo académico para coordinar solicitudes, donaciones y voluntariado. Toda la información de `db.json` es ficticia; no usar datos personales o casos reales.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Desarrollo local

Desde la carpeta `CR-conecta`:

```powershell
npm install
npm run server
```

En otra terminal:

```powershell
npm run dev
```

La interfaz estará en la dirección que indique Vite (por defecto `http://localhost:5173`). La API corre en `http://localhost:3001`. Para cambiarla, copiá `.env.example` a `.env` y ajustá `VITE_API_URL`; `CLIENT_ORIGIN` configura el origen permitido de la interfaz en el servidor.

Las cuentas de demostración comparten la contraseña `conecta-demo` únicamente en desarrollo local. La pantalla de acceso solicita la contraseña y no usa Google/Gmail: ese flujo sigue siendo una simulación explícitamente identificada como tal.

## Asistente de IA

El chat envía las preguntas a la API Node y de ahí a Groq; la clave nunca se entrega al navegador. Puede responder preguntas abiertas y orientar sobre CR Conecta. El contexto del prototipo no adjunta perfiles, solicitudes privadas ni datos personales. Cuando identifica una sección pública pertinente, puede llevar al usuario a Inicio, Necesidades, Donar, Solicitar ayuda o Acceso. El servidor y la interfaz validan cada destino contra una lista cerrada: no se permite navegar por el asistente a otros sitios web, al panel administrativo ni a perfiles personales. Las acciones de Donar y Solicitar ayuda pueden requerir una sesión. La IA puede equivocarse; no ingreses información personal ni sensible.

El archivo `.env` local ya está creado con un marcador, no con una clave funcional. Reemplazá `pon-tu-clave-aqui` por tu propia clave de Groq, guardá el archivo y reiniciá `npm run server`:

```text
GROQ_API_KEY=tu-clave-real
GROQ_MODEL=qwen/qwen3.8-27b
```

`.env` está ignorado por Git. Nunca pegues la clave en el frontend, en una variable `VITE_*`, en el repositorio ni en capturas. Si el asistente indica que no está configurado, revisá `GROQ_API_KEY` y reiniciá el servidor.

## API propia y autorización

`npm run server` inicia la API Node implementada en `server/`; ya no se expone JSON Server. Las contraseñas configuradas se almacenan como hashes scrypt con sal aleatoria en `server/auth.json`, archivo local ignorado por Git. Las sesiones usan cookies `HttpOnly`, `SameSite=Strict` y vencen después de ocho horas. La API verifica roles y propiedad de cada registro; ocultar botones en la interfaz no cuenta como autorización.

| Operación | Permiso |
|---|---|
| Consultar necesidades aprobadas | Público; se omiten datos internos y beneficiario |
| Ver solicitudes propias | Beneficiario autenticado |
| Consultar todas y evaluar solicitudes | Administrador |
| Crear solicitudes | Beneficiario autenticado; el servidor fija propietario y estado inicial |
| Confirmar entrega | Solo beneficiario dueño de la solicitud aprobada |
| Registrar donaciones | Donante individual o empresa; el destino debe ser una solicitud aprobada |
| Consultar donaciones propias | Donantes |
| Actualizar traslados | Administrador o voluntario asignado |
| Consultar inventario | Administrador |
| Editar datos básicos de perfil | Propietario del perfil o administrador |
| Consultar actividad del sistema | Administrador |

Las validaciones de cantidad, estado, prioridad y excepción se ejecutan en la API, no solo en React. La regla de recurrencia considera solicitudes aprobadas o en revisión de los últimos 60 días. La persistencia local escribe `db.json` de forma serializada y atómica.

## Avisos con n8n

Importá `n8n/CR-Conecta-Avisos-y-Comprobantes.json`. Ahora incluye el aviso de solicitud aprobada, un comprobante personalizado al correo del donante, un aviso separado al equipo, consulta de Hacienda y seguimiento en Google Sheets. Seguí **`n8n/GUIA-CORREOS-Y-SHEETS.md`** para configurar las credenciales, los correos y la hoja. El comprobante registra el aporte; no confirma recepción física ni entrega y no es un certificado fiscal.

La API toma el correo y el nombre de la cuenta autenticada. El evento privado de donación incluye estos datos y una cédula para la consulta de Hacienda, además de provincia y cantón. No incluye contraseñas, fotos ni IDs de usuarios. El aviso al equipo y la hoja ocultan nombre y correo cuando la donación es anónima; el saludo del comprobante es privado.

Configurá las credenciales Header Auth en ambos Webhook, SMTP en los tres nodos de correo y Google Sheets en los cuatro nodos de hoja. Ajustá remitente, correoEquipo y spreadsheetId en **Configurar y validar donación**; la rama de solicitudes conserva sus dos direcciones de correo independientes.

```text
N8N_APPROVAL_WEBHOOK_URL=https://tu-n8n.example/webhook/cr-conecta-solicitud-aprobada
N8N_DONATION_WEBHOOK_URL=https://tu-n8n.example/webhook/cr-conecta-donacion-registrada
N8N_WEBHOOK_TOKEN=un-secreto-aleatorio-largo
```

Reiniciá `npm run server` después de cambiar `.env`. Para pruebas podés usar `npm run n8n:test` tras poner tu correo en `n8n/EVENTO-DE-PRUEBA.json`. Las URL de prueba necesitan un Webhook escuchando; para uso automático necesitás el flujo activo y las URL de producción.

Sheets identifica cada evento y registra por separado los envíos al donante y al equipo. Repetir el mismo evento omite los envíos marcados Enviado y permite reintentar los fallidos. Es un control para ejecuciones secuenciales, no una garantía frente a concurrencia o fallos después de la aceptación SMTP. La API no tiene una cola automática cuando falla la entrega al Webhook. La guía explica el seguimiento y los límites.

La entrega conserva tu `.env` local. No pongás secretos en variables `VITE_*`; conservá tu clave de Groq al integrar estos cambios.

## Panel administrativo

El resumen del administrador reúne indicadores y gráficas de cuentas por rol, donaciones por categoría y estado, inventario, traslados y campañas. También muestra las últimas acciones auditadas. Se registran inicios de sesión correctos, cambios de perfil, creación y actualización de solicitudes, donaciones y entregas de traslados. El historial se guarda en `db.json`, conserva hasta 500 eventos y solo el administrador puede consultarlo; no incluye acciones anteriores a esta función ni visitas o navegación por páginas.

## Solicitudes

Las solicitudes tienen su propia sección en el menú principal, separada del panel de gestión. Entra todo el mundo, pero el servidor ya devuelve información distinta según quién consulta: la administración recibe todas las solicitudes con los campos internos para dictaminarlas, la persona beneficiaria solo las propias, y el resto de los roles únicamente las solicitudes aprobadas y en su forma pública, sin datos personales. La interfaz no agrega ni oculta información por su cuenta: se limita a mostrar la que el servidor le entrega.

Administración, en su resumen, y las empresas donantes, en «Campañas y empleo», pueden generar con IA una proyección semanal para la próxima campaña. Se especifican categoría, meta y duración; el resultado incluye gráfico, explicación y supuestos. La API envía a Groq solamente datos resumidos de campañas y donaciones que corresponden al rol (la empresa solo ve los suyos), sin nombres, perfiles ni información personal. Son escenarios orientativos basados en datos simulados y escasos, no resultados garantizados. Requiere `GROQ_API_KEY` y un `GROQ_MODEL` compatible configurados en `.env`.

## Preparar contraseñas para despliegue

En producción no se acepta la contraseña compartida de demo. Configurá una contraseña distinta y robusta por cuenta desde una terminal interactiva:

```powershell
$env:NODE_ENV = "production"
npm run auth:set-password -- u1
npm run auth:set-password -- u2
```

Repetí el comando para cada ID de cuenta habilitado (`u1` a `u6`). El comando no muestra la contraseña mientras se escribe. Después configurá el servidor detrás de HTTPS y establece, en su entorno:

```text
NODE_ENV=production
CLIENT_ORIGIN=https://tu-dominio.example
PORT=3001
```

El cookie `Secure` se activa en producción. El frontend necesita compilarse con `VITE_API_URL` apuntando a la API y alojarse en el origen permitido. No publiques `server/auth.json` ni copies `.env` al repositorio.

**Límite importante:** esta API y el archivo JSON son una base de prototipo, no una plataforma lista para gestionar casos reales. Las sesiones y el límite de intentos de acceso viven en memoria y se invalidan al reiniciar el servidor; el archivo no es adecuado para varias instancias ni escrituras concurrentes entre procesos. La auditoría actual es básica y no registra visitas a páginas. Antes de uso público o información sensible, sustituí JSON por una base de datos transaccional, guardá sesiones y límites de acceso compartidos y persistentes, ampliá la auditoría con controles de retención, copias de seguridad, monitorización y revisión legal/de privacidad.

## Calidad

```powershell
npm test
npm run lint
npm run build
```

Las pruebas comprueban límites de solicitud, autenticación, acceso por rol, privacidad de necesidades y validación de destinos de donación.

## Foto obligatoria de la donación

El menú principal incluye Donar. Cada aporte nuevo requiere una foto JPG, PNG o WebP de hasta 10 MB. El navegador la convierte a JPEG y reduce su tamaño antes de enviarla. La API valida el formato y tamaño y la guarda en el campo `photo` de la donación en `db.json`. La foto se muestra en la lista de aportes; los registros antiguos siguen disponibles aunque no tengan foto.
