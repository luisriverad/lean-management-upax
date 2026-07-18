import { Bloque, Campo, Escala, Barra, Cifra, AvisoProceso } from '../lib/ui.jsx';
import { num, moneda } from '../lib/util.js';
/* =========================================================================
   MÓDULO IO · INTELIGENCIA OPERATIVA
   Cinco pestañas encadenadas: el proceso elegido en IO-2 alimenta IO-3,
   IO-4 e IO-5. El estado vive en App y baja por props.
   ========================================================================= */

/* ---------- Piezas comunes ---------- */

const DIMENSIONES = [
  {
    id: 'procesos',
    nombre: 'Procesos',
    reactivos: [
      'Los procesos clave están documentados y se ejecutan igual sin importar quién los haga.',
      'Cada proceso clave tiene un dueño con autoridad real para cambiarlo.',
      'Los cambios al proceso se prueban antes de volverse el estándar.',
    ],
  },
  {
    id: 'datos',
    nombre: 'Datos',
    reactivos: [
      'El dato se captura en el momento en que ocurre el trabajo, no después.',
      'La información vive en un solo lugar y todos leen la misma versión.',
      'Se confía en el dato sin tener que verificarlo por fuera.',
    ],
  },
  {
    id: 'indicadores',
    nombre: 'Indicadores',
    reactivos: [
      'Cada proceso clave tiene indicadores con meta y responsable.',
      'Los indicadores se revisan con ritmo fijo, no solo cuando hay problema.',
      'Un indicador fuera de meta dispara una acción, no una explicación.',
    ],
  },
  {
    id: 'automatizacion',
    nombre: 'Automatización',
    reactivos: [
      'Las tareas repetitivas de alto volumen están automatizadas.',
      'Los sistemas se comunican entre sí sin recaptura manual.',
      'Hay control de excepciones cuando la automatización falla.',
    ],
  },
  {
    id: 'ia',
    nombre: 'Inteligencia Artificial',
    reactivos: [
      'Se usa IA en tareas reales de la operación, no en pruebas aisladas.',
      'Está claro qué decide la IA y qué decide una persona.',
      'El equipo sabe usar IA en su trabajo del día a día.',
    ],
  },
  {
    id: 'ejecucion',
    nombre: 'Ejecución',
    reactivos: [
      'Los acuerdos salen con responsable y fecha, y se les da seguimiento.',
      'Lo que se decide en junta se ejecuta en el plazo comprometido.',
      'Los proyectos de mejora se cierran; no se abandonan a medias.',
    ],
  },
];

const NIVELES = [
  { max: 1.9, nombre: 'Inexistente', lectura: 'La operación depende de personas, no de sistema. Cada resultado se explica por quién estuvo ese día.' },
  { max: 2.9, nombre: 'Incipiente', lectura: 'Hay intentos aislados. Lo que funciona no se sostiene porque nadie lo estandarizó.' },
  { max: 3.9, nombre: 'Definido', lectura: 'El sistema existe y se usa. La brecha ya no es de diseño: es de disciplina y de dato.' },
  { max: 4.6, nombre: 'Gestionado', lectura: 'La operación se dirige con números. El siguiente salto está en automatización e IA aplicada.' },
  { max: 5, nombre: 'Optimizado', lectura: 'El sistema aprende y se corrige solo. El riesgo aquí es la complacencia.' },
];

function nivelDe(score) {
  return NIVELES.find((n) => score <= n.max) ?? NIVELES[0];
}

export function Diagnostico({ estado, set }) {
  const r = estado.diagnostico;

  function calificar(dimId, i, v) {
    set({ ...estado, diagnostico: { ...r, [dimId + ':' + i]: v } });
  }

  const scores = DIMENSIONES.map((d) => {
    const vals = d.reactivos.map((_, i) => r[d.id + ':' + i]).filter((v) => typeof v === 'number');
    const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { ...d, prom, contestados: vals.length };
  });

  const contestados = scores.reduce((a, d) => a + d.contestados, 0);
  const total = DIMENSIONES.reduce((a, d) => a + d.reactivos.length, 0);
  const conDato = scores.filter((d) => d.contestados > 0);
  const global = conDato.length ? conDato.reduce((a, d) => a + d.prom, 0) / conDato.length : 0;
  const nivel = nivelDe(global);
  const debil = conDato.length ? conDato.reduce((a, b) => (b.prom < a.prom ? b : a)) : null;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Diagnóstico de Inteligencia Operativa</h2>
        <p className="tool__intro">
          Califica de 1 a 5 dónde está la operación hoy. 1 es no existe; 3 es existe y se usa; 5 es
          se sostiene solo. Responde con lo que pasa, no con lo que debería pasar.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Nivel global"
          valor={global ? global.toFixed(1) : '—'}
          pie={global ? nivel.nombre : 'Sin calificar'}
          ember
        />
        <Cifra
          label="Avance"
          valor={contestados + '/' + total}
          pie="Reactivos contestados"
        />
        <Cifra
          label="Dimensión más débil"
          valor={debil ? debil.prom.toFixed(1) : '—'}
          pie={debil ? debil.nombre : 'Califica al menos una dimensión'}
        />
      </div>

      {global > 0 && (
        <Bloque titulo="Lectura" meta={nivel.nombre.toUpperCase()}>
          <p className="nota">{nivel.lectura}</p>
        </Bloque>
      )}

      <Bloque titulo="Perfil por dimensión" meta="ESCALA 1 A 5">
        {scores.map((d) => (
          <div className="marcador" key={d.id}>
            <span className="marcador__nombre">{d.nombre}</span>
            <Barra pct={(d.prom / 5) * 100} ember={debil && d.id === debil.id} />
            <span className="marcador__valor">{d.prom ? d.prom.toFixed(1) : '—'}</span>
          </div>
        ))}
      </Bloque>

      {DIMENSIONES.map((d) => (
        <Bloque
          key={d.id}
          titulo={d.nombre}
          meta={(scores.find((s) => s.id === d.id).prom || 0).toFixed(1) + ' / 5.0'}
        >
          {d.reactivos.map((texto, i) => (
            <div className="reactivo" key={i}>
              <span className="reactivo__texto">{texto}</span>
              <Escala valor={r[d.id + ':' + i] ?? null} onChange={(v) => calificar(d.id, i, v)} />
            </div>
          ))}
        </Bloque>
      ))}
    </div>
  );
}

/* =========================================================================
   IO-2 · Selector de Proceso Crítico
   ========================================================================= */

const CRITERIOS = [
  { id: 'impacto', nombre: 'Impacto', pista: 'Cuánto dinero, servicio o riesgo mueve.' },
  { id: 'urgencia', nombre: 'Urgencia', pista: 'Qué tan pronto duele si no se toca.' },
  { id: 'recurrencia', nombre: 'Recurrencia', pista: 'Qué tan seguido ocurre el problema.' },
  { id: 'viabilidad', nombre: 'Viabilidad', pista: 'Qué tan factible es cambiarlo en el programa.' },
];

export function Selector({ estado, set }) {
  const { procesos, pesos, elegido } = estado.selector;

  function editar(id, campo, valor) {
    set({
      ...estado,
      selector: {
        ...estado.selector,
        procesos: procesos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)),
      },
    });
  }

  function agregar() {
    const id = 'p' + Date.now();
    set({
      ...estado,
      selector: {
        ...estado.selector,
        procesos: [...procesos, { id, nombre: '', area: '', impacto: 3, urgencia: 3, recurrencia: 3, viabilidad: 3 }],
      },
    });
  }

  function borrar(id) {
    set({
      ...estado,
      selector: {
        ...estado.selector,
        procesos: procesos.filter((p) => p.id !== id),
        elegido: elegido === id ? null : elegido,
      },
    });
  }

  function pesar(id, v) {
    set({ ...estado, selector: { ...estado.selector, pesos: { ...pesos, [id]: num(v) } } });
  }

  function elegir(id) {
    set({ ...estado, selector: { ...estado.selector, elegido: elegido === id ? null : id } });
  }

  const sumaPesos = CRITERIOS.reduce((a, c) => a + (pesos[c.id] || 0), 0);

  const calculados = procesos
    .map((p) => {
      const score = CRITERIOS.reduce((a, c) => a + (p[c.id] || 0) * (pesos[c.id] || 0), 0);
      return { ...p, score: sumaPesos ? score / sumaPesos : 0 };
    })
    .sort((a, b) => b.score - a.score);

  const lider = calculados[0];

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Selector de Proceso Crítico</h2>
        <p className="tool__intro">
          Un solo proceso se trabaja durante todo el programa. Aquí se elige con criterio, no con
          antojo: califica cada candidato de 1 a 5 en los cuatro criterios y deja que el número
          ordene. El elegido alimenta la ficha maestra, la voz del cliente y el análisis de brecha.
        </p>
      </header>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Proceso</th>
                <th>Área</th>
                {CRITERIOS.map((c) => (
                  <th key={c.id} className="num">
                    {c.nombre}
                  </th>
                ))}
                <th className="num">Score</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {calculados.map((p) => (
                <tr key={p.id} className={elegido === p.id ? 'is-lider' : ''}>
                  <td>
                    <input
                      className="tabla__input"
                      value={p.nombre}
                      placeholder="Nombre del proceso"
                      onChange={(e) => editar(p.id, 'nombre', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="tabla__input"
                      value={p.area}
                      placeholder="Área"
                      onChange={(e) => editar(p.id, 'area', e.target.value)}
                    />
                  </td>
                  {CRITERIOS.map((c) => (
                    <td className="num" key={c.id}>
                      <input
                        className="tabla__input tabla__input--num"
                        type="number"
                        min="1"
                        max="5"
                        value={p[c.id]}
                        onChange={(e) => editar(p.id, c.id, num(e.target.value))}
                      />
                    </td>
                  ))}
                  <td className="num">
                    <span className="dato dato--fuerte">{p.score.toFixed(2)}</span>
                  </td>
                  <td>
                    <button className="boton--sec" onClick={() => elegir(p.id)}>
                      {elegido === p.id ? 'Elegido' : 'Elegir'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="boton--icono"
                      onClick={() => borrar(p.id)}
                      disabled={procesos.length <= 1}
                      title={procesos.length <= 1 ? 'Debe quedar al menos un proceso' : 'Quitar'}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <button className="boton--sec" onClick={agregar}>
            + Agregar proceso
          </button>
        </div>
      </Bloque>

      <Bloque titulo="Peso de cada criterio" meta={'SUMA ' + sumaPesos + '%'}>
        <div className="rejilla">
          {CRITERIOS.map((c) => (
            <div className="campo" key={c.id}>
              <label className="campo__label">{c.nombre}</label>
              <input
                className="campo__input"
                type="number"
                min="0"
                max="100"
                value={pesos[c.id]}
                onChange={(e) => pesar(c.id, e.target.value)}
              />
              <span className="campo__pista">{c.pista}</span>
            </div>
          ))}
        </div>
      </Bloque>

      <div className="tablero">
        <Cifra
          label="Mejor calificado"
          valor={lider && lider.score ? lider.score.toFixed(2) : '—'}
          pie={lider && lider.nombre ? lider.nombre : 'Captura al menos un proceso'}
        />
        <Cifra
          label="Proceso del programa"
          valor={elegido ? '1' : '0'}
          pie={
            elegido
              ? procesos.find((p) => p.id === elegido)?.nombre || 'Sin nombre'
              : 'Aún no eliges'
          }
          ember={!!elegido}
        />
        <Cifra
          label="Suma de pesos"
          valor={sumaPesos + '%'}
          pie={sumaPesos === 100 ? 'Correcto' : 'Ajusta hasta 100% para leer limpio'}
        />
      </div>
    </div>
  );
}

/* =========================================================================
   IO-3 · Ficha Maestra del Proceso
   ========================================================================= */

export function Ficha({ estado, set, proceso }) {
  const f = estado.ficha;

  function campo(k, v) {
    set({ ...estado, ficha: { ...f, [k]: v } });
  }

  function editarInd(id, k, v) {
    set({
      ...estado,
      ficha: { ...f, indicadores: f.indicadores.map((i) => (i.id === id ? { ...i, [k]: v } : i)) },
    });
  }

  function agregarInd() {
    set({
      ...estado,
      ficha: {
        ...f,
        indicadores: [...f.indicadores, { id: 'i' + Date.now(), nombre: '', unidad: '', actual: '', meta: '' }],
      },
    });
  }

  function borrarInd(id) {
    set({ ...estado, ficha: { ...f, indicadores: f.indicadores.filter((i) => i.id !== id) } });
  }

  const ciclo = num(f.tiempoCiclo);
  const espera = num(f.tiempoEspera);
  const eficiencia = ciclo + espera > 0 ? (ciclo / (ciclo + espera)) * 100 : 0;
  const nombre = proceso?.nombre || f.nombre;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Ficha Maestra del Proceso</h2>
        <p className="tool__intro">
          La identidad del proceso en una sola hoja. Si no puedes llenar dónde inicia, dónde termina
          y quién responde por él, no tienes un proceso: tienes una costumbre.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <Bloque titulo="Identidad" meta={proceso ? 'DESDE IO-1' : 'CAPTURA LIBRE'}>
        <div className="rejilla">
          <Campo
            label="Nombre del proceso"
            valor={nombre}
            onChange={(v) => campo('nombre', v)}
            pista={proceso ? 'Viene del proceso elegido en el selector.' : undefined}
          />
          <Campo label="Responsable" valor={f.responsable} onChange={(v) => campo('responsable', v)} pista="Quien puede cambiar el proceso, no quien lo ejecuta." />
          <Campo
            label="Objetivo"
            valor={f.objetivo}
            onChange={(v) => campo('objetivo', v)}
            area
            ancho
            pista="Para qué existe el proceso, en una frase."
          />
          <Campo label="Evento que lo inicia" valor={f.inicio} onChange={(v) => campo('inicio', v)} area pista="El disparador concreto." />
          <Campo label="Entrega final" valor={f.fin} onChange={(v) => campo('fin', v)} area pista="Qué queda cuando el proceso termina." />
          <Campo label="Clientes del proceso" valor={f.clientes} onChange={(v) => campo('clientes', v)} area pista="Interno o externo. Quién recibe la salida." />
          <Campo label="Problemas principales" valor={f.problemas} onChange={(v) => campo('problemas', v)} area pista="Lo que falla hoy, sin diagnosticar todavía." />
        </div>
      </Bloque>

      <Bloque titulo="Volumen y tiempos" meta="DATO DURO">
        <div className="rejilla">
          <Campo label="Volumen" valor={f.volumen} onChange={(v) => campo('volumen', v)} pista="Cantidad de veces que corre." />
          <Campo label="Periodo" valor={f.periodo} onChange={(v) => campo('periodo', v)} pista="Día, semana o mes." />
          <Campo label="Tiempo de ciclo" valor={f.tiempoCiclo} onChange={(v) => campo('tiempoCiclo', v)} pista="Tiempo en que sí se trabaja la pieza o el caso." />
          <Campo label="Tiempo de espera" valor={f.tiempoEspera} onChange={(v) => campo('tiempoEspera', v)} pista="Tiempo en que el trabajo está parado esperando." />
        </div>
      </Bloque>

      <div className="tablero">
        <Cifra
          label="Tiempo total"
          valor={ciclo + espera ? (ciclo + espera).toLocaleString('es-MX') : '—'}
          pie="Ciclo más espera, en la unidad que capturaste"
        />
        <Cifra
          label="Eficiencia de ciclo"
          valor={eficiencia ? eficiencia.toFixed(0) + '%' : '—'}
          pie="Del tiempo total, cuánto es trabajo real"
          ember={eficiencia > 0 && eficiencia < 25}
        />
        <Cifra
          label="Volumen declarado"
          valor={f.volumen || '—'}
          pie={f.periodo ? 'Por ' + f.periodo.toLowerCase() : 'Falta el periodo'}
        />
      </div>

      <Bloque titulo="Indicadores actuales" meta={f.indicadores.length + (f.indicadores.length === 1 ? ' INDICADOR' : ' INDICADORES')}>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Unidad</th>
                <th className="num">Actual</th>
                <th className="num">Meta</th>
                <th className="num">Brecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {f.indicadores.map((i) => {
                const brecha = num(i.meta) - num(i.actual);
                return (
                  <tr key={i.id}>
                    <td>
                      <input className="tabla__input" value={i.nombre} placeholder="Nombre" onChange={(e) => editarInd(i.id, 'nombre', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={i.unidad} placeholder="%, min, pzas" onChange={(e) => editarInd(i.id, 'unidad', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={i.actual} onChange={(e) => editarInd(i.id, 'actual', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={i.meta} onChange={(e) => editarInd(i.id, 'meta', e.target.value)} />
                    </td>
                    <td className="num">
                      <span className="dato">{i.actual !== '' && i.meta !== '' ? brecha.toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrarInd(i.id)} title="Quitar">
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <button className="boton--sec" onClick={agregarInd}>
            + Agregar indicador
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   IO-4 · Voz del Cliente y Definición de Valor
   Value Proposition Canvas (Osterwalder) traducido a la paleta UPAX,
   con la tabla de expectativas debajo.
   ========================================================================= */

const SECCIONES_VPC = {
  customerJobs: {
    es: 'Trabajos del Cliente',
    en: 'Customer Jobs',
    desc: 'Tareas o necesidades que el cliente quiere cumplir.',
    tono: 'ink',
  },
  pains: {
    es: 'Dolores',
    en: 'Pains',
    desc: 'Problemas o dificultades que experimenta hoy.',
    tono: 'stop',
  },
  gains: {
    es: 'Ganancias',
    en: 'Gains',
    desc: 'Beneficios o resultados que desea obtener.',
    tono: 'ok',
  },
  products: {
    es: 'Productos y Servicios',
    en: 'Products & Services',
    desc: 'Lo que ofreces para cubrir esas necesidades.',
    tono: 'ink',
  },
  painRelievers: {
    es: 'Aliviadores de Dolor',
    en: 'Pain Relievers',
    desc: 'Cómo tu oferta resuelve sus problemas.',
    tono: 'stop',
  },
  gainCreators: {
    es: 'Creadores de Ganancia',
    en: 'Gain Creators',
    desc: 'Cómo tu oferta entrega esos beneficios.',
    tono: 'ok',
  },
};

const TONOS = {
  ink: 'var(--upax-ink)',
  stop: 'var(--stop)',
  ok: 'var(--ok)',
};

const itemVacio = () => ({ id: Date.now() + Math.random(), text: '' });

const vpcInicial = () => {
  const s = {};
  Object.keys(SECCIONES_VPC).forEach((k) => {
    s[k] = [itemVacio(), itemVacio(), itemVacio()];
  });
  return s;
};

/* Emblemas: la forma canónica del canvas, como identificador del panel. */

function EmblemaPerfil() {
  return (
    <svg className="vpc__emblema" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 20 L20 2 A18 18 0 0 1 35.6 29 Z" fill="var(--upax-ink)" opacity="0.85" />
      <path d="M20 20 L35.6 29 A18 18 0 0 1 4.4 29 Z" fill="var(--stop)" opacity="0.85" />
      <path d="M20 20 L4.4 29 A18 18 0 0 1 20 2 Z" fill="var(--ok)" opacity="0.85" />
      <circle cx="20" cy="20" r="18" fill="none" stroke="var(--surface-sunken)" strokeWidth="1.5" />
    </svg>
  );
}

function EmblemaMapa() {
  return (
    <svg className="vpc__emblema" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="17" height="17" rx="2" fill="var(--ok)" opacity="0.85" />
      <rect x="21" y="2" width="17" height="17" rx="2" fill="var(--stop)" opacity="0.85" />
      <rect x="2" y="21" width="36" height="17" rx="2" fill="var(--upax-ink)" opacity="0.85" />
    </svg>
  );
}

function SeccionVPC({ llave, data, onUpdate, onAdd, onRemove }) {
  const sec = SECCIONES_VPC[llave];
  const items = data[llave];
  const unico = items.length <= 1;

  return (
    <div className="vpc__seccion" style={{ '--linea-seccion': TONOS[sec.tono] }}>
      <div>
        <div className="vpc__es" style={{ color: TONOS[sec.tono] }}>
          {sec.es}
        </div>
        <div className="vpc__en">({sec.en})</div>
        <p className="vpc__desc">{sec.desc}</p>
      </div>

      {items.map((item) => (
        <div className="vpc__item" key={item.id}>
          <textarea
            rows={2}
            value={item.text}
            placeholder="Escribe aquí…"
            onChange={(e) => onUpdate(llave, item.id, e.target.value)}
          />
          <button
            className="vpc__quitar"
            onClick={() => onRemove(llave, item.id)}
            disabled={unico}
            title={unico ? 'Debe quedar al menos uno' : 'Quitar'}
          >
            ✕
          </button>
        </div>
      ))}

      <button className="vpc__agregar" onClick={() => onAdd(llave)}>
        + Agregar
      </button>
    </div>
  );
}

export function VozCliente({ estado, set, proceso }) {
  const v = estado.voz;
  const data = v.vpc;

  const guardarVpc = (vpc) => set({ ...estado, voz: { ...v, vpc } });

  const onUpdate = (key, id, value) =>
    guardarVpc({ ...data, [key]: data[key].map((i) => (i.id === id ? { ...i, text: value } : i)) });

  const onAdd = (key) => guardarVpc({ ...data, [key]: [...data[key], itemVacio()] });

  const onRemove = (key, id) => {
    if (data[key].length <= 1) return;
    guardarVpc({ ...data, [key]: data[key].filter((i) => i.id !== id) });
  };

  const limpiar = () => guardarVpc(vpcInicial());

  function editarCtq(id, k, val) {
    set({ ...estado, voz: { ...v, ctq: v.ctq.map((c) => (c.id === id ? { ...c, [k]: val } : c)) } });
  }

  function agregarCtq() {
    set({
      ...estado,
      voz: { ...v, ctq: [...v.ctq, { id: 'c' + Date.now(), espera: '', medida: '', meta: '', actual: '' }] },
    });
  }

  function borrarCtq(id) {
    set({ ...estado, voz: { ...v, ctq: v.ctq.filter((c) => c.id !== id) } });
  }

  const cumplen = v.ctq.filter((c) => c.actual !== '' && c.meta !== '' && num(c.actual) >= num(c.meta)).length;
  const conDato = v.ctq.filter((c) => c.actual !== '' && c.meta !== '').length;

  const props = { data, onUpdate, onAdd, onRemove };

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Voz del Cliente y Definición de Valor</h2>
        <p className="tool__intro">
          Valor es lo que el cliente está dispuesto a reconocer. Todo lo demás es costo. El perfil
          del cliente va a la izquierda; el mapa de valor, a la derecha. Cuando las dos mitades
          embonan, hay propuesta de valor. Cuando no, hay actividad.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <Bloque
        titulo={proceso ? 'Canvas de Propuesta de Valor · ' + proceso.nombre : 'Canvas de Propuesta de Valor'}
        meta="VALUE PROPOSITION CANVAS"
      >
        <div className="vpc">
          <div className="vpc__panel">
            <div className="vpc__cabeza">
              <EmblemaPerfil />
              <span className="vpc__rotulo">Perfil del Cliente</span>
            </div>
            <SeccionVPC llave="customerJobs" {...props} />
            <SeccionVPC llave="gains" {...props} />
            <SeccionVPC llave="pains" {...props} />
          </div>

          <div className="vpc__panel">
            <div className="vpc__cabeza">
              <EmblemaMapa />
              <span className="vpc__rotulo">Mapa de Valor</span>
            </div>
            <SeccionVPC llave="gainCreators" {...props} />
            <SeccionVPC llave="painRelievers" {...props} />
            <SeccionVPC llave="products" {...props} />
          </div>
        </div>

        <p className="vpc__pie">
          ← El Mapa de Valor embona con el Perfil del Cliente →
        </p>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <button className="boton--sec" onClick={limpiar}>
            Limpiar canvas
          </button>
        </div>
      </Bloque>

      <Bloque titulo="Qué espera el cliente y cómo se mide" meta={conDato ? cumplen + ' DE ' + conDato + ' CUMPLEN' : 'SIN DATO'}>
        <p className="nota" style={{ marginBottom: 'var(--sp-4)' }}>
          Una expectativa que no se mide es una opinión. Traduce cada espera del canvas a un número
          con meta.
        </p>

        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Lo que espera el cliente</th>
                <th>Cómo se mide</th>
                <th className="num">Meta del cliente</th>
                <th className="num">Hoy</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {v.ctq.map((c) => {
                const hayDato = c.actual !== '' && c.meta !== '';
                const ok = hayDato && num(c.actual) >= num(c.meta);
                return (
                  <tr key={c.id}>
                    <td>
                      <input className="tabla__input" value={c.espera} placeholder="Entrega a tiempo" onChange={(e) => editarCtq(c.id, 'espera', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={c.medida} placeholder="% de órdenes a tiempo" onChange={(e) => editarCtq(c.id, 'medida', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={c.meta} onChange={(e) => editarCtq(c.id, 'meta', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={c.actual} onChange={(e) => editarCtq(c.id, 'actual', e.target.value)} />
                    </td>
                    <td>
                      {hayDato ? (
                        <span className={ok ? 'pill pill--ok' : 'pill pill--stop'}>{ok ? 'Cumple' : 'No cumple'}</span>
                      ) : (
                        <span className="pill pill--neutro">Sin dato</span>
                      )}
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrarCtq(c.id)} title="Quitar">
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <button className="boton--sec" onClick={agregarCtq}>
            + Agregar expectativa
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   IO-5 · Análisis de Brecha Operativa
   Cuatro pasos del Análisis de Brechas de Desempeño, con el
   dimensionamiento cuantitativo dentro del Paso 3.
   ========================================================================= */

const PASOS_BRECHA = [
  {
    id: 'actual',
    titulo: 'Paso 1 (Step 1)',
    descripcion: 'Identificar el estado actual del desempeño de tu departamento.',
    en: 'Identify the current performance state of your department.',
    placeholder: 'Describir métricas actuales, KPIs, resultados recientes, fortalezas y debilidades observadas…',
  },
  {
    id: 'deseado',
    titulo: 'Paso 2 (Step 2)',
    descripcion: 'Identificar dónde quieres que esté el desempeño de tu departamento.',
    en: 'Identify where your performance wants to be with your department.',
    placeholder: 'Definir metas objetivo, benchmarks del sector, estándares deseados, visión de desempeño ideal…',
  },
  {
    id: 'brecha',
    titulo: 'Paso 3 (Step 3)',
    descripcion: 'Identificar la brecha de desempeño en tu departamento.',
    en: 'Identify the performance gap in your department.',
    placeholder: 'Analizar diferencias entre el estado actual y el deseado, causas raíz, áreas de mayor brecha…',
  },
  {
    id: 'mejoras',
    titulo: 'Paso 4 (Step 4)',
    descripcion: 'Diseñar mejoras de desempeño para cerrar las brechas en tu departamento.',
    en: 'Devise performance improvements to close the gaps in your department.',
    placeholder: 'Proponer acciones correctivas, planes de mejora, cronograma, responsables, recursos necesarios…',
  },
];

const DIM_BRECHA = [
  { id: 'tiempo', nombre: 'Tiempo' },
  { id: 'calidad', nombre: 'Calidad' },
  { id: 'costo', nombre: 'Costo' },
  { id: 'productividad', nombre: 'Productividad' },
  { id: 'servicio', nombre: 'Servicio' },
];

function Flujo({ vertical }) {
  return (
    <div className={vertical ? 'flujo flujo--v' : 'flujo'} aria-hidden="true">
      <span className="flujo__linea" />
      <span className="flujo__punta" />
    </div>
  );
}

function Paso({ paso, valor, onChange, children, ancho }) {
  const lleno = valor.trim().length > 0;
  return (
    <div className={['paso', ancho ? 'paso--ancho' : '', lleno ? 'is-lleno' : ''].filter(Boolean).join(' ')}>
      <div className="paso__head">{paso.titulo}</div>
      <div className="paso__desc">
        <p className="paso__es">{paso.descripcion}</p>
        <p className="paso__en">{paso.en}</p>
      </div>
      <textarea
        className="paso__area"
        rows={6}
        value={valor}
        placeholder={paso.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {children && <div className="paso__extra">{children}</div>}
    </div>
  );
}

export function Brecha({ estado, set, proceso }) {
  const b = estado.brecha;

  const campo = (k, v) => set({ ...estado, brecha: { ...b, [k]: v } });

  function editarFila(id, k, v) {
    set({ ...estado, brecha: { ...b, filas: b.filas.map((f) => (f.id === id ? { ...f, [k]: v } : f)) } });
  }

  const filas = b.filas.map((f) => {
    const actual = num(f.actual);
    const deseado = num(f.deseado);
    const hayDato = f.actual !== '' && f.deseado !== '';
    const brechaAbs = Math.abs(deseado - actual);
    const base = Math.max(Math.abs(actual), Math.abs(deseado));
    const pct = base ? (brechaAbs / base) * 100 : 0;
    return { ...f, hayDato, brechaAbs, pct, impacto: num(f.impacto) };
  });

  const maxPct = Math.max(...filas.map((f) => f.pct), 1);
  const impactoTotal = filas.reduce((a, f) => a + f.impacto, 0);
  const conDato = filas.filter((f) => f.hayDato);
  const mayor = conDato.length ? conDato.reduce((a, f) => (f.impacto > a.impacto ? f : a)) : null;

  const llenos = PASOS_BRECHA.filter((p) => (b[p.id] || '').trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Análisis de Brecha Operativa</h2>
        <p className="tool__intro">
          Dónde está el proceso hoy contra dónde debe estar. Los cuatro pasos ordenan el
          razonamiento; la tabla del Paso 3 lo dimensiona. La brecha sin cifra es una queja; con
          cifra, es un caso de negocio.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <div className="avance">
        {PASOS_BRECHA.map((p) => (
          <span
            key={p.id}
            className={(b[p.id] || '').trim() ? 'avance__tramo is-lleno' : 'avance__tramo'}
          />
        ))}
        <span className="avance__cuenta">{llenos}/4</span>
      </div>

      <div className="pasos">
        <Paso paso={PASOS_BRECHA[0]} valor={b.actual} onChange={(v) => campo('actual', v)} />
        <Paso paso={PASOS_BRECHA[1]} valor={b.deseado} onChange={(v) => campo('deseado', v)} />
      </div>

      <Flujo vertical />

      <div className="pasos">
        <Paso paso={PASOS_BRECHA[2]} valor={b.brecha} onChange={(v) => campo('brecha', v)} ancho>
          <div className="tablero">
            <Cifra
              label="Impacto anual de la brecha"
              valor={impactoTotal ? moneda(impactoTotal) : '—'}
              pie="Lo que cuesta no cerrarla"
              ember={impactoTotal > 0}
            />
            <Cifra
              label="Dimensiones con dato"
              valor={conDato.length + '/' + filas.length}
              pie="Sin actual y deseado no hay brecha"
            />
            <Cifra
              label="Mayor costo"
              valor={mayor && mayor.impacto ? moneda(mayor.impacto) : '—'}
              pie={mayor && mayor.impacto ? mayor.nombre : 'Captura el impacto por dimensión'}
            />
          </div>

          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Dimensión</th>
                  <th>Indicador</th>
                  <th>Unidad</th>
                  <th className="num">Actual</th>
                  <th className="num">Deseado</th>
                  <th className="num">Brecha</th>
                  <th>Tamaño</th>
                  <th className="num">Impacto anual</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className="dato dato--fuerte">{f.nombre}</span>
                    </td>
                    <td>
                      <input className="tabla__input" value={f.indicador} placeholder="Indicador" onChange={(e) => editarFila(f.id, 'indicador', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={f.unidad} placeholder="min, %, $" onChange={(e) => editarFila(f.id, 'unidad', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={f.actual} onChange={(e) => editarFila(f.id, 'actual', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={f.deseado} onChange={(e) => editarFila(f.id, 'deseado', e.target.value)} />
                    </td>
                    <td className="num">
                      <span className="dato dato--fuerte">{f.hayDato ? f.brechaAbs.toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td>
                      <Barra pct={(f.pct / maxPct) * 100} ember={mayor && f.id === mayor.id} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={f.impacto || ''} placeholder="0" onChange={(e) => editarFila(f.id, 'impacto', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Paso>
      </div>

      <Flujo vertical />

      <div className="pasos">
        <Paso paso={PASOS_BRECHA[3]} valor={b.mejoras} onChange={(v) => campo('mejoras', v)} ancho />
      </div>

      <Bloque titulo="Cierre" meta="CONCLUSIÓN · DECISIÓN">
        <div className="rejilla">
          <Campo
            label="Qué dice la brecha"
            valor={b.conclusion}
            onChange={(v) => campo('conclusion', v)}
            area
            ancho
            pista="La lectura en una frase, con el número que la sostiene."
          />
          <Campo
            label="Qué se decide"
            valor={b.decision}
            onChange={(v) => campo('decision', v)}
            area
            ancho
            pista="La decisión que se toma hoy, no la lista de buenas intenciones."
          />
        </div>
      </Bloque>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_IO = {
  diagnostico: {},
  selector: {
    pesos: { impacto: 35, urgencia: 25, recurrencia: 20, viabilidad: 20 },
    elegido: null,
    procesos: [{ id: 'p1', nombre: '', area: '', impacto: 3, urgencia: 3, recurrencia: 3, viabilidad: 3 }],
  },
  ficha: {
    nombre: '',
    objetivo: '',
    inicio: '',
    fin: '',
    responsable: '',
    clientes: '',
    volumen: '',
    periodo: '',
    tiempoCiclo: '',
    tiempoEspera: '',
    problemas: '',
    indicadores: [{ id: 'i1', nombre: '', unidad: '', actual: '', meta: '' }],
  },
  voz: {
    vpc: vpcInicial(),
    ctq: [{ id: 'c1', espera: '', medida: '', meta: '', actual: '' }],
  },
  brecha: {
    actual: '',
    deseado: '',
    brecha: '',
    mejoras: '',
    conclusion: '',
    decision: '',
    filas: DIM_BRECHA.map((d) => ({ ...d, indicador: '', unidad: '', actual: '', deseado: '', impacto: '' })),
  },
};
