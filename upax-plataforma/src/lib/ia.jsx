import { useState } from 'react';

/* Puente con IA gratuita (Pollinations.ai).
   API abierta, sin API key y con CORS habilitado: funciona directo desde el
   navegador en cualquier despliegue, sin costo. Ver README, sección IA. */

export async function pedirIA(prompt, sistema) {
  const messages = [];
  if (sistema) messages.push({ role: 'system', content: sistema });
  messages.push({ role: 'user', content: prompt });

  const r = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages, referrer: 'upax-plataforma' }),
  });
  if (!r.ok) throw new Error('La API respondió ' + r.status);

  const data = await r.json();
  const texto =
    data?.choices?.[0]?.message?.content ??
    (typeof data === 'string' ? data : '');
  const limpio = texto.trim();
  if (!limpio) throw new Error('la IA no devolvió texto');
  return limpio;
}

export const SISTEMA_UPAX =
  'Eres un consultor de mejora continua mexicano trabajando en piso. Respondes en español de México, ' +
  'con tono directo y ejecutivo, sin preámbulo y sin adornos. Hablas de procesos reales, no de teoría. ' +
  'Nunca inventas datos que no te dieron: si falta información, lo dices.';

export function BotonIA({ cargando, onClick, disabled, children, sec }) {
  return (
    <button
      className={sec ? 'ia ia--sec' : 'ia'}
      onClick={onClick}
      disabled={cargando || disabled}
      title={disabled ? 'Faltan datos para pedir la sugerencia' : undefined}
    >
      {cargando ? (
        <>
          <span className="ia__punto" />
          Pensando…
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* Ícono de la marca UPAX BRAIN. */
function IconoBrain() {
  return (
    <svg className="brain__icono" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.6A3 3 0 0 0 6 17.5a3 3 0 0 0 3 3V3.5Zm6 0a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.6A3 3 0 0 1 18 17.5a3 3 0 0 1-3 3V3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 3.5v17" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* Serializa el estado de la herramienta a texto legible para el prompt,
   quitando ruido (ids internos) y campos vacíos. */
function limpiar(valor) {
  if (Array.isArray(valor)) {
    const arr = valor.map(limpiar).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (valor && typeof valor === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(valor)) {
      if (k === 'id') continue;
      const limpio = limpiar(v);
      if (limpio !== undefined) out[k] = limpio;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (valor === '' || valor === null) return undefined;
  return valor;
}

/* Botón «ANÁLISIS POR UPAX BRAIN» reutilizable.
   Lee el estado vivo de la herramienta abierta y pide a la IA una lectura
   ejecutiva. Se monta una sola vez por pestaña (con key propia), así que su
   resultado se limpia solo al cambiar de herramienta. */
export function AnalisisUpaxBrain({ titulo, contexto }) {
  const { cargando, error, correr } = usaIA();
  const [salida, setSalida] = useState(null);

  const datos = limpiar(contexto) ?? {};
  // «Vacío» = el usuario aún no capturó nada en esta herramienta.
  // Los nombres de módulo/herramienta siempre vienen llenos, así que la
  // señal real es el sub-objeto `datos` (el estado de la pestaña).
  const vacio = limpiar(contexto?.datos) === undefined;

  const analizar = () =>
    correr(async () => {
      const prompt =
        'Herramienta analizada: ' + titulo + '\n\n' +
        'Datos capturados por el usuario en esta herramienta (JSON, sin campos vacíos):\n' +
        JSON.stringify(datos, null, 2) + '\n\n' +
        'Da un análisis BREVE como consultor de mejora continua en piso. Responde SIN markdown, ' +
        'con esta estructura exacta:\n' +
        'LECTURA: una sola frase con lo que dicen los datos de fondo.\n' +
        'RIESGO: el foco rojo más importante, en una línea.\n' +
        'ACCIÓN: la siguiente acción concreta y accionable en piso.\n\n' +
        'Máximo 90 palabras en total. Si faltan datos clave, dilo en una frase. ' +
        'No inventes cifras que no estén en los datos.';
      const r = await pedirIA(prompt, SISTEMA_UPAX);
      if (r) setSalida(r);
      return r;
    });

  return (
    <div className="brain">
      <div className="brain__barra">
        <span className="brain__marca">
          <IconoBrain />
          UPAX BRAIN
        </span>
        <button className="brain__boton" onClick={analizar} disabled={cargando || vacio}>
          {cargando ? (
            <>
              <span className="ia__punto" />
              Analizando…
            </>
          ) : (
            'ANÁLISIS POR UPAX BRAIN'
          )}
        </button>
      </div>

      <p className="brain__pista">
        {vacio
          ? 'Captura datos en esta herramienta y UPAX BRAIN los analizará por ti.'
          : 'La IA lee solo lo que capturaste en esta herramienta. No inventa cifras.'}
      </p>

      {error && <p className="ia-error">{error}</p>}

      {salida && <div className="ia-salida brain__salida">{salida}</div>}
    </div>
  );
}

export function usaIA() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const correr = async (fn) => {
    setCargando(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError('No se pudo consultar a la IA: ' + e.message + '. Puedes capturarlo a mano y seguir.');
      return null;
    } finally {
      setCargando(false);
    }
  };

  return { cargando, error, correr };
}
