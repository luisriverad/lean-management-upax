# UPAX · Plataforma de Análisis Operativo y Mejora Continua

Ocho módulos, cincuenta y cuatro herramientas encadenadas. Lo que se captura en un módulo alimenta al siguiente: el proceso crítico que se elige en el módulo 1 recorre los ocho, y el motor de recomendaciones del módulo 7 lee todo lo capturado antes.

## Arrancar

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`.

Otros comandos:

```bash
npm run build      # compila a dist/
npm run preview    # sirve dist/ para revisar el build
```

## Estructura

```
src/
  main.jsx              punto de entrada
  App.jsx               shell: login, menú, hub y registro de módulos
  app.css               sistema de diseño completo
  assets/
    upax-logotipo.png   logotipo
  lib/
    ui.jsx              Bloque, Campo, Escala, Barra, Cifra, AvisoProceso, MiniLista
    util.js             num, moneda, nuevoItem
    ia.jsx              pedirIA, SISTEMA_UPAX, BotonIA, usaIA
    aspa.js             paths del aspa vectorizada (las 4 palas del ciclo PHVA)
  modules/
    io.jsx              1 · Inteligencia Operativa
    dp.jsx              2 · Diagnóstico de Procesos
    mr.jsx              3 · Mapeo y Rediseño
    pc.jsx              4 · Productividad y Capacidad
    rp.jsx              5 · Resolución de Problemas
    es.jsx              6 · Estandarización
    ie.jsx              7 · Indicadores e Inteligencia Empresarial
    ej.jsx              8 · Ejecución y Seguimiento
```

## Cómo está armado

**El registro manda.** En `App.jsx` hay un arreglo `MODULOS`. De ahí salen solos el menú lateral, las ocho tarjetas del hub y las pestañas de cada módulo. Para mover el orden o cambiar un nombre, se toca ese arreglo y nada más.

**Cada pestaña es un componente** que recibe cuatro props:

| Prop | Qué trae |
|---|---|
| `estado` | el estado de su propio módulo |
| `set` | para actualizarlo |
| `proceso` | el proceso crítico elegido en el módulo 1 |
| `otros` | lectura de los ocho módulos, para el encadenamiento |

**El estado vive en `App.jsx`**, uno por módulo (`io`, `dp`, `mr`, `pc`, `rp`, `es`, `ie`, `ej`). Cada módulo exporta su forma inicial: `ESTADO_IO`, `ESTADO_DP`, etc.

**Los cálculos no se guardan.** Todo lo derivado —scores, semáforos, saturaciones, costos— se recalcula en cada render a partir de lo capturado. Solo se guarda lo que el usuario escribe.

## Agregar una pestaña

1. Escribe el componente en el módulo que le toque, con la firma `function MiTool({ estado, set, proceso, otros })`.
2. Expórtalo: `export function MiTool(...)`.
3. Impórtalo en `App.jsx` y agrégalo al arreglo `pestanas` de su módulo:

```jsx
{ id: 'mi-tool', nombre: 'Nombre visible', componente: MiTool }
```

## IA · UPAX BRAIN

**Todas** las herramientas tienen el botón naranja **ANÁLISIS POR UPAX BRAIN** (componente `AnalisisUpaxBrain` en `src/lib/ia.jsx`, montado una vez en el shell): lee el estado vivo de la pestaña abierta y pide a la IA un análisis breve (LECTURA · RIESGO · ACCIÓN). Además, `5 · Resolución de Problemas → Cinco Porqués` y `7 · Indicadores → Motor de Recomendaciones` tienen llamadas de IA propias más específicas.

Todo llama a la IA desde `src/lib/ia.jsx`, usando **IA gratuita** vía [Pollinations.ai](https://pollinations.ai):

- **Sin API key** y **sin costo**: la API es abierta y tiene CORS habilitado, así que funciona directo desde el navegador en cualquier despliegue.
- Endpoint: `POST https://text.pollinations.ai/openai` con mensajes en formato OpenAI. La respuesta llega en `data.choices[0].message.content`.
- No hay `.env` ni secretos que configurar.

Nota: al ser un servicio gratuito y compartido, puede tardar o fallar de vez en cuando. Todas las herramientas funcionan sin IA (captura manual) y el panel de UPAX BRAIN avisa cuando la llamada falla. Si más adelante quieres un modelo de pago dedicado, basta con cambiar la función `pedirIA` en `src/lib/ia.jsx`.

## Diseño

| | |
|---|---|
| Slate | `#323644` |
| Naranja | `#E44611` |
| Fondo | `#EEF0F3` |
| Superficie | `#FFFFFF` |
| Títulos | Poppins |
| Interfaz | Inter |
| Datos | IBM Plex Mono |

Las tres fuentes se cargan desde Google Fonts en `index.html`. Modo claro únicamente.

Todo el diseño está en `src/app.css` con variables CSS. Para cambiar la paleta completa se tocan las variables de `:root` y nada más.

---

Powered by AXON B2B
