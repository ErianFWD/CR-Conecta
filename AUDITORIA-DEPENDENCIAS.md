# Auditoría de dependencias

Fecha: 6 de octubre de 2026. Consultado con `npm audit --json` contra el registro oficial de npm.

| Momento | Moderadas | Altas | Total |
| --- | ---: | ---: | ---: |
| Antes de corregir | 19 | 1 | 20 |
| Después de corregir | 0 | 0 | 0 |

La alerta alta correspondía a `source-map-js@1.2.1`, dependencia transitiva. Las alertas moderadas provenían principalmente de `js-yaml@3.15.2` y su árbol `argparse` / `sprintf-js`, usados por herramientas de cobertura de Jest.

Se actualizaron las versiones transitorias con `overrides` en `package.json`: `source-map-js` a `^1.2.2` y `js-yaml` a `^4.1.1`. La instalación resolvió `source-map-js@1.2.2` y `js-yaml@4.3.2`. Se regeneró `package-lock.json` y se ejecutaron de nuevo las pruebas y la compilación. La librería que lee YAML en la configuración de cobertura utiliza `load`, compatible con la versión nueva. No se redujo la versión de Jest.

`npm audit` informa vulnerabilidades conocidas de las dependencias del árbol instalado; un resultado de cero no implica que el proyecto entero esté libre de riesgos. Para reproducirlo en tu equipo, ejecutá `npm ci` y luego `npm audit` dentro de `CR-Conecta`.
