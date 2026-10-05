# Correcciones de CR Conecta — 2 de octubre de 2026

## Iniciar

1. Extraer el ZIP y abrir la carpeta CR-conecta-main.
2. Ejecutar `npm install` una vez. El ZIP contiene el proyecto completo, sin node_modules.
3. Ejecutar `npm run server` en una terminal.
4. Ejecutar `npm run dev` en otra terminal y abrir la dirección que muestre Vite.
5. Conservar el archivo .env propio y las claves privadas que ya se utilizaban. No subirlas al repositorio.

## Problema visual y organización

Los textos `erian-feature`, `HEAD` y `main` eran restos de una resolución incompleta de conflictos escritos dentro del JSX. Se eliminaron esos textos y el bloque antiguo de solicitudes duplicado en Panel, que referenciaba 11 variables o componentes inexistentes. La gestión de solicitudes se conserva en su página actual, accesible desde el menú.

La estructura sigue siendo componentes → páginas → rutas → App → main → index.html. Los nuevos archivos separan servicios compartidos, campos de formulario, confirmaciones, validación del servidor y estilos adaptables.

## Dispositivos y accesibilidad

- Menú desplegable con icono de tres rayas en pantallas de hasta 1280 px. En computadoras más amplias se muestra la navegación completa.
- Formularios en una columna en pantallas pequeñas, tablas con desplazamiento dentro de su contenedor y modales con altura limitada y desplazamiento vertical.
- Texto en rem: el tamaño de letra cambia sin ampliar todo el body. Las preferencias se restauran desde la primera página y se sincronizan con sus controles.
- Confirmación nativa modal con botones Aceptar/Cancelar, foco confinado por el navegador, Escape para cancelar y colores del tema actual, incluidos modo oscuro y paletas para daltonismo.

## Hacienda y Geo CR

El componente CostaRicaFields se reutiliza en autorregistro, alta de cuentas desde el panel, edición de perfil, donación, solicitud de ayuda, solicitud desde el panel de beneficiario y propuesta de patrocinio de demostración.

- La cédula acepta 9 a 12 dígitos. El botón Consultar Hacienda completa el nombre cuando el servicio lo encuentra; permite corregirlo o escribirlo si no existe. La consulta tributaria no demuestra que quien usa el formulario sea el titular de la cédula.
- Provincia → cantón → distrito. Cambiar la provincia borra cantón y distrito; cambiar el cantón borra distrito. El distrito es opcional.
- El servidor consulta únicamente proveedores definidos, con tiempo máximo de espera, caché y límite de consultas. Hay mensajes de error y botón Reintentar; no se inventan datos si el proveedor no responde.
- Identificación y ubicación se guardan junto con las cuentas, solicitudes y donaciones. La vista pública de solicitudes los excluye. La actualización de comprobantes transmite una cédula y los datos de la cuenta solamente al flujo privado de donación de n8n; ver n8n/GUIA-CORREOS-Y-SHEETS.md.
- Las secciones editoriales de inicio no son registros de personas y mantienen sus campos de título y contenido. La propuesta de patrocinio continúa siendo una demostración local, como indica el formulario.

Documentación consultada:
- https://api.hacienda.go.cr/docs/
- https://github.com/anibalalpizar/api-geo-cr
- https://api-geo-cr.vercel.app/

## Confirmaciones

Las escrituras realizadas mediante el cliente API —registro, publicación, cambios de perfil, dictamen, confirmación de entrega, eliminación y cierre de sesión— esperan Aceptar antes de enviar la solicitud. Cancelar deja los datos intactos. Las consultas de lectura, inicio de sesión y mensajes al asistente no requieren este paso. También se sustituyeron las alertas del navegador de acciones de demostración.

## Verificaciones realizadas

- npm run lint: sin errores.
- npm run build: compilación correcta. Se mantienen advertencias de directivas de dependencias que no impiden compilar.
- npm test: pasan los 12 archivos de pruebas. Incluyen permisos, registro, persistencia de identificación y ubicación, solicitudes, foto obligatoria, IA, n8n y confirmaciones.
- Las pruebas de API ejecutan el handler HTTP real mediante un transporte de prueba interno, con cookies y persistencia; no abren puertos.
- Hacienda y Geo CR se prueban con respuestas controladas y errores simulados. No se pudo comprobar su disponibilidad en vivo desde este entorno.
- No se pudo ejecutar una revisión visual en navegador: no hay Chromium instalado en el entorno.

## Prueba en tu computadora

1. Revisar Inicio en anchos de 320, 375, 768 y 1440 px; abrir y cerrar el menú, navegar y comprobar que el contenido no se desborde.
2. En Registro, consultar una cédula de prueba autorizada; elegir provincia y cantón. Cambiar provincia y comprobar que el cantón se limpia.
3. Registrar una cuenta: Cancelar debe conservar el formulario sin crearla; Aceptar debe guardarla.
4. Crear una solicitud y una donación con foto, comprobando su ubicación y registro.
5. Aprobar una solicitud como administrador; confirmar una entrega; crear y eliminar una sección. Revisar Aceptar/Cancelar antes de cada cambio.
6. En Perfil, activar modo oscuro, cada paleta de daltonismo y letra XL. Abrir la confirmación de cierre de sesión; probar Tab, Shift+Tab y Escape, también en móvil.
7. n8n conserva las configuraciones del ZIP recibido. Para probar, verificar credenciales y URL de prueba/producción según INICIAR-N8N.txt.

## Actualización de comprobantes (5 de octubre de 2026)

Se agregó destinatario desde la cuenta autenticada, Hacienda con nombre de respaldo, correos separados al donante y al equipo, Google Sheets con estado de cada envío, control de reenvío secuencial y protección de donaciones anónimas. Se corrigió el parámetro emailFormat de los nodos SMTP. No hay cambios de estructura ni colores de la interfaz. Guía completa en n8n/GUIA-CORREOS-Y-SHEETS.md.
