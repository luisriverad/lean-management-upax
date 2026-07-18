import { useState } from 'react';
import { Bloque, Campo, Barra, Cifra, AvisoProceso } from '../lib/ui.jsx';
import { num, moneda } from '../lib/util.js';
import { pedirIA, SISTEMA_UPAX, BotonIA, usaIA } from '../lib/ia.jsx';
import { CONCEPTOS_COSTO } from './dp.jsx';
import { potencialDe, capacidadDe, cargaDe } from './pc.jsx';
/* =========================================================================
   MÓDULO IE · INDICADORES E INTELIGENCIA EMPRESARIAL
   Catálogo único de KPIs. Todas las pestañas leen del mismo catálogo:
     IE-1 Árbol · IE-2 Ficha · IE-3 Base y meta · IE-4 Scorecard
     IE-5 Lecturas y tendencia ─→ IE-6 Alertas ─→ IE-7 Motor
   ========================================================================= */

const CATEGORIAS_KPI = [
  { id: 'tiempo', nombre: 'Tiempo', pista: 'Ciclo, entrega, respuesta.' },
  { id: 'calidad', nombre: 'Calidad', pista: 'Errores, rechazos, retrabajo.' },
  { id: 'costo', nombre: 'Costo', pista: 'Costo unitario, desperdicio, gasto.' },
  { id: 'productividad', nombre: 'Productividad', pista: 'Salida por hora o por persona.' },
  { id: 'servicio', nombre: 'Servicio', pista: 'Cumplimiento, quejas, satisfacción.' },
];

const FRECUENCIAS = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Trimestral'];

const nuevoObjetivo = () => ({ id: 'ob' + Date.now() + Math.random().toString(16).slice(2, 6), nombre: '' });

const nuevoKpi = () => ({
  id: 'kp' + Date.now() + Math.random().toString(16).slice(2, 6),
  nombre: '',
  objetivoId: '',
  categoria: 'tiempo',
  unidad: '',
  formula: '',
  fuente: '',
  frecuencia: 'Mensual',
  responsable: '',
  lineaBase: '',
  meta: '',
  direccion: 'baja',
  tolerancia: '10',
  plazo: '',
  lecturas: [],
});

const kpisVivos = (estado) => estado.kpis.filter((k) => k.nombre.trim());

function ultimaLectura(k) {
  if (!k.lecturas.length) return null;
  return k.lecturas[k.lecturas.length - 1];
}

/* Semáforo: verde cumple meta, amarillo dentro de tolerancia, rojo fuera. */
function semaforo(k, valor) {
  const meta = num(k.meta);
  if (valor === null || valor === undefined || !k.meta.trim()) return { tono: null, texto: 'Sin meta', pill: 'pill--neutro' };
  const tol = (num(k.tolerancia) / 100) * Math.abs(meta || 1);
  if (k.direccion === 'sube') {
    if (valor >= meta) return { tono: 'ok', texto: 'En meta', pill: 'pill--ok' };
    if (valor >= meta - tol) return { tono: 'warn', texto: 'Al límite', pill: 'pill--warn' };
    return { tono: 'stop', texto: 'Fuera', pill: 'pill--stop' };
  }
  if (valor <= meta) return { tono: 'ok', texto: 'En meta', pill: 'pill--ok' };
  if (valor <= meta + tol) return { tono: 'warn', texto: 'Al límite', pill: 'pill--warn' };
  return { tono: 'stop', texto: 'Fuera', pill: 'pill--stop' };
}

function tendenciaDe(k) {
  const l = k.lecturas.filter((x) => x.valor !== '');
  if (l.length < 2) return { dir: 0, pct: 0, racha: 0 };
  const ult = num(l[l.length - 1].valor);
  const prev = num(l[l.length - 2].valor);
  const pct = prev ? ((ult - prev) / Math.abs(prev)) * 100 : 0;
  const mejora = k.direccion === 'sube' ? ult > prev : ult < prev;
  const igual = ult === prev;

  let racha = 1;
  for (let i = l.length - 1; i > 0; i--) {
    const a = num(l[i].valor);
    const b = num(l[i - 1].valor);
    const m = k.direccion === 'sube' ? a > b : a < b;
    const primero = k.direccion === 'sube' ? num(l[l.length - 1].valor) > num(l[l.length - 2].valor) : num(l[l.length - 1].valor) < num(l[l.length - 2].valor);
    if (a === b || m !== primero) break;
    racha++;
  }
  return { dir: igual ? 0 : mejora ? 1 : -1, pct, racha: racha - 1 };
}

/* =========================================================================
   IE-1 · Árbol de Indicadores
   ========================================================================= */

export function Arbol({ estado, set, proceso }) {
  const objs = estado.objetivos;

  const editarObj = (id, v) => set({ ...estado, objetivos: objs.map((o) => (o.id === id ? { ...o, nombre: v } : o)) });
  const agregarObj = () => set({ ...estado, objetivos: [...objs, nuevoObjetivo()] });
  const borrarObj = (id) => {
    if (objs.length <= 1) return;
    set({ ...estado, objetivos: objs.filter((o) => o.id !== id) });
  };

  const kpis = kpisVivos(estado);
  const objsVivos = objs.filter((o) => o.nombre.trim());
  const huerfanos = kpis.filter((k) => !k.objetivoId || !objsVivos.find((o) => o.id === k.objetivoId));
  const sinKpi = objsVivos.filter((o) => !kpis.some((k) => k.objetivoId === o.id));

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Árbol de Indicadores</h2>
        <p className="tool__intro">
          Cada indicador cuelga de un objetivo, y cada objetivo se sostiene con indicadores. Si un
          objetivo no tiene ninguno, es un deseo. Si un indicador no cuelga de ningún objetivo, se
          mide por costumbre y alguien está gastando tiempo en llenarlo para nada.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <div className="tablero">
        <Cifra label="Objetivos" valor={objsVivos.length || '—'} pie={kpis.length + ' indicadores en total'} ember={objsVivos.length > 0} />
        <Cifra
          label="Objetivos sin indicador"
          valor={sinKpi.length || '0'}
          pie={sinKpi.length ? 'No se pueden verificar' : 'Todos medibles'}
          ember={sinKpi.length > 0}
        />
        <Cifra
          label="Indicadores huérfanos"
          valor={huerfanos.length || '0'}
          pie={huerfanos.length ? 'Se miden sin objetivo detrás' : 'Todos conectados'}
          ember={huerfanos.length > 0}
        />
      </div>

      <Bloque titulo="Objetivos" meta="NIVEL 1">
        <div className="rejilla">
          {objs.map((o) => (
            <div className="campo" key={o.id}>
              <label className="campo__label">Objetivo</label>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <input className="campo__input" value={o.nombre} placeholder="Qué se busca lograr" onChange={(e) => editarObj(o.id, e.target.value)} />
                <button className="boton--icono" onClick={() => borrarObj(o.id)} disabled={objs.length <= 1} title="Quitar">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="boton--sec" style={{ marginTop: 'var(--sp-3)' }} onClick={agregarObj}>
          + Agregar objetivo
        </button>
        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Los indicadores se dan de alta en la ficha técnica y ahí se asignan a un objetivo.
        </p>
      </Bloque>

      {objsVivos.length > 0 && (
        <Bloque titulo={proceso ? 'Árbol · ' + proceso.nombre : 'Árbol'} meta="OBJETIVO → INDICADORES">
          <div className="arbol">
            {objsVivos.map((o) => {
              const hojas = kpis.filter((k) => k.objetivoId === o.id);
              return (
                <div className="arbol__rama" key={o.id}>
                  <div className="arbol__obj">
                    <span className="arbol__nivel">Objetivo</span>
                    <span className="score__nombre">{o.nombre}</span>
                    <span className="arbol__nivel">{hojas.length} indicador(es)</span>
                  </div>
                  <div className="arbol__hojas">
                    {hojas.length ? (
                      hojas.map((k) => (
                        <span className="hoja" key={k.id}>
                          {k.nombre}
                          <span className="hoja__cat">{CATEGORIAS_KPI.find((c) => c.id === k.categoria).nombre}</span>
                        </span>
                      ))
                    ) : (
                      <span className="arbol__vacio">Sin indicadores: este objetivo no se puede verificar.</span>
                    )}
                  </div>
                </div>
              );
            })}

            {huerfanos.length > 0 && (
              <div className="arbol__rama">
                <div className="arbol__obj" style={{ borderRightColor: 'var(--stop)' }}>
                  <span className="arbol__nivel">Sin objetivo</span>
                  <span className="score__nombre">Indicadores huérfanos</span>
                  <span className="arbol__nivel">{huerfanos.length} indicador(es)</span>
                </div>
                <div className="arbol__hojas">
                  {huerfanos.map((k) => (
                    <span className="hoja" key={k.id} style={{ borderLeftColor: 'var(--stop)' }}>
                      {k.nombre}
                      <span className="hoja__cat">{CATEGORIAS_KPI.find((c) => c.id === k.categoria).nombre}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   IE-2 · Ficha Técnica de KPI
   ========================================================================= */

export function FichaKpi({ estado, set }) {
  const ks = estado.kpis;
  const [sel, setSel] = useState(ks[0] ? ks[0].id : null);

  const editar = (id, k, v) => set({ ...estado, kpis: ks.map((x) => (x.id === id ? { ...x, [k]: v } : x)) });
  const agregar = () => {
    const nk = nuevoKpi();
    set({ ...estado, kpis: [...ks, nk] });
    setSel(nk.id);
  };
  const borrar = (id) => {
    if (ks.length <= 1) return;
    set({ ...estado, kpis: ks.filter((x) => x.id !== id) });
    if (sel === id) setSel(ks[0].id);
  };

  const objsVivos = estado.objetivos.filter((o) => o.nombre.trim());
  const kpi = ks.find((k) => k.id === sel) || ks[0];
  const vivos = kpisVivos(estado);
  const completos = vivos.filter((k) => k.formula.trim() && k.fuente.trim() && k.responsable.trim() && k.meta.trim());
  const sinFuente = vivos.filter((k) => !k.fuente.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Ficha Técnica de KPI</h2>
        <p className="tool__intro">
          Un indicador sin ficha se discute en cada junta: que si se mide distinto, que si el dato
          salió de otro lado. La ficha cierra esa discusión. Fórmula y fuente son las dos que nadie
          quiere escribir y las dos que evitan el problema.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Indicadores" valor={vivos.length || '—'} pie={completos.length + ' con ficha completa'} ember={vivos.length > 0} />
        <Cifra
          label="Sin fuente de dato"
          valor={sinFuente || '0'}
          pie={sinFuente ? 'Nadie sabe de dónde sale el número' : 'Todos con fuente definida'}
          ember={sinFuente > 0}
        />
        <Cifra
          label="Fichas completas"
          valor={vivos.length ? completos.length + '/' + vivos.length : '—'}
          pie="Fórmula, fuente, responsable y meta"
        />
      </div>

      <Bloque titulo="Catálogo" meta={vivos.length + ' INDICADORES'}>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Categoría</th>
                <th>Objetivo</th>
                <th>Unidad</th>
                <th>Responsable</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ks.map((k) => (
                <tr key={k.id} className={kpi && k.id === kpi.id ? 'is-lider' : ''}>
                  <td>
                    <input className="tabla__input" value={k.nombre} placeholder="Nombre del KPI" onChange={(e) => editar(k.id, 'nombre', e.target.value)} />
                  </td>
                  <td>
                    <select className="tabla__select" value={k.categoria} onChange={(e) => editar(k.id, 'categoria', e.target.value)}>
                      {CATEGORIAS_KPI.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select className="tabla__select" value={k.objetivoId} onChange={(e) => editar(k.id, 'objetivoId', e.target.value)}>
                      <option value="">Sin objetivo</option>
                      {objsVivos.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="tabla__input" value={k.unidad} placeholder="min, %, $" onChange={(e) => editar(k.id, 'unidad', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={k.responsable} placeholder="Quién responde" onChange={(e) => editar(k.id, 'responsable', e.target.value)} />
                  </td>
                  <td>
                    <button className="chip" onClick={() => setSel(k.id)}>
                      Ficha
                    </button>
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(k.id)} disabled={ks.length <= 1} title="Quitar">
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
            + Agregar indicador
          </button>
        </div>
      </Bloque>

      {kpi && (
        <Bloque titulo={kpi.nombre || 'Ficha del indicador'} meta="FICHA TÉCNICA">
          <div className="rejilla">
            <Campo label="Fórmula" valor={kpi.formula} onChange={(v) => editar(kpi.id, 'formula', v)} area ancho pista="Numerador y denominador, sin ambigüedad. Ejemplo: facturas rechazadas ÷ facturas emitidas × 100." />
            <Campo label="Fuente del dato" valor={kpi.fuente} onChange={(v) => editar(kpi.id, 'fuente', v)} pista="Sistema, reporte o registro exacto de donde sale." />
            <div className="campo">
              <label className="campo__label">Frecuencia</label>
              <select className="campo__input" value={kpi.frecuencia} onChange={(e) => editar(kpi.id, 'frecuencia', e.target.value)}>
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <span className="campo__pista">Cada cuándo se toma la lectura.</span>
            </div>
            <div className="campo">
              <label className="campo__label">Mejor cuando</label>
              <select className="campo__input" value={kpi.direccion} onChange={(e) => editar(kpi.id, 'direccion', e.target.value)}>
                <option value="baja">Baja (menos es mejor)</option>
                <option value="sube">Sube (más es mejor)</option>
              </select>
              <span className="campo__pista">Define cómo se lee el semáforo y la tendencia.</span>
            </div>
            <Campo label="Meta" valor={kpi.meta} onChange={(v) => editar(kpi.id, 'meta', v)} pista="El número que se persigue." />
            <Campo label="Tolerancia (%)" valor={kpi.tolerancia} onChange={(v) => editar(kpi.id, 'tolerancia', v)} pista="Cuánto se puede desviar antes de pasar a rojo." />
            <Campo label="Línea base" valor={kpi.lineaBase} onChange={(v) => editar(kpi.id, 'lineaBase', v)} pista="Dónde está hoy, antes de mejorar." />
            <Campo label="Plazo de la meta" valor={kpi.plazo} onChange={(v) => editar(kpi.id, 'plazo', v)} pista="Para cuándo se espera llegar." />
          </div>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   IE-3 · Línea Base y Meta
   ========================================================================= */

export function BaseMeta({ estado, set }) {
  const ks = estado.kpis;
  const editar = (id, k, v) => set({ ...estado, kpis: ks.map((x) => (x.id === id ? { ...x, [k]: v } : x)) });

  const vivos = kpisVivos(estado);

  const filas = vivos.map((k) => {
    const base = num(k.lineaBase);
    const meta = num(k.meta);
    const tieneAmbos = k.lineaBase.trim() !== '' && k.meta.trim() !== '';
    const brecha = tieneAmbos ? meta - base : 0;
    const brechaPct = tieneAmbos && base ? (Math.abs(brecha) / Math.abs(base)) * 100 : 0;
    const ult = ultimaLectura(k);
    const avance =
      tieneAmbos && ult && brecha !== 0 ? ((num(ult.valor) - base) / brecha) * 100 : 0;
    return { ...k, base, meta, tieneAmbos, brecha, brechaPct, avance, ult };
  });

  const conMeta = filas.filter((f) => f.tieneAmbos);
  const sinBase = vivos.filter((k) => !k.lineaBase.trim()).length;
  const brechaMayor = conMeta.length ? conMeta.reduce((a, f) => (f.brechaPct > a.brechaPct ? f : a)) : null;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Línea Base y Meta</h2>
        <p className="tool__intro">
          Sin línea base no hay mejora que demostrar: solo una cifra suelta que nadie sabe si es
          buena. Aquí se fija de dónde se parte, a dónde se va y qué tan lejos está. La brecha es la
          que se convierte en proyecto.
        </p>
      </header>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">IE-2</span>
          <span>No hay indicadores en el catálogo. Dálos de alta en la ficha técnica.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra label="Con meta definida" valor={vivos.length ? conMeta.length + '/' + vivos.length : '—'} pie="Base y meta capturadas" ember={conMeta.length > 0} />
        <Cifra
          label="Sin línea base"
          valor={sinBase || '0'}
          pie={sinBase ? 'No se podrá demostrar la mejora' : 'Todos con punto de partida'}
          ember={sinBase > 0}
        />
        <Cifra
          label="Brecha mayor"
          valor={brechaMayor && brechaMayor.brechaPct ? brechaMayor.brechaPct.toFixed(0) + '%' : '—'}
          pie={brechaMayor && brechaMayor.brechaPct ? brechaMayor.nombre : 'Captura base y meta'}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Unidad</th>
                <th className="num">Línea base</th>
                <th className="num">Meta</th>
                <th className="num">Brecha</th>
                <th className="num">Brecha %</th>
                <th>Plazo</th>
                <th className="num">Avance</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className={brechaMayor && f.id === brechaMayor.id && f.brechaPct ? 'is-lider' : ''}>
                  <td>
                    <span className="dato dato--fuerte">{f.nombre}</span>
                  </td>
                  <td>
                    <span className="dato">{f.unidad || '—'}</span>
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={f.lineaBase} onChange={(e) => editar(f.id, 'lineaBase', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={f.meta} onChange={(e) => editar(f.id, 'meta', e.target.value)} />
                  </td>
                  <td className="num">
                    <span className="dato">{f.tieneAmbos ? (f.brecha > 0 ? '+' : '') + f.brecha.toLocaleString('es-MX') : '—'}</span>
                  </td>
                  <td className="num">
                    <span className="dato dato--fuerte">{f.brechaPct ? f.brechaPct.toFixed(0) + '%' : '—'}</span>
                  </td>
                  <td>
                    <input className="tabla__input" value={f.plazo} placeholder="Cuándo" onChange={(e) => editar(f.id, 'plazo', e.target.value)} />
                  </td>
                  <td className="num">
                    <span className="dato">{f.ult && f.avance ? Math.max(0, Math.min(100, f.avance)).toFixed(0) + '%' : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          El avance se calcula con la última lectura capturada en tendencias: qué parte del camino
          entre la base y la meta ya se recorrió.
        </p>
      </Bloque>

      {conMeta.some((f) => f.ult) && (
        <Bloque titulo="Avance hacia la meta" meta="DE LA BASE AL OBJETIVO">
          {conMeta
            .filter((f) => f.ult)
            .map((f) => (
              <div className="marcador" key={f.id}>
                <span className="marcador__nombre">{f.nombre}</span>
                <Barra
                  pct={Math.max(0, Math.min(100, f.avance))}
                  tono={f.avance >= 100 ? 'ok' : f.avance >= 50 ? null : 'warn'}
                />
                <span className="marcador__valor">{Math.max(0, Math.min(100, f.avance)).toFixed(0) + '%'}</span>
              </div>
            ))}
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   IE-4 · Scorecard Operativo
   ========================================================================= */

function TarjetaKpi({ k }) {
  const ult = ultimaLectura(k);
  const valor = ult ? num(ult.valor) : null;
  const s = semaforo(k, valor);
  const t = tendenciaDe(k);

  return (
    <div className={['tarjeta-kpi', s.tono ? 'tarjeta-kpi--' + s.tono : ''].filter(Boolean).join(' ')}>
      <span className="tarjeta-kpi__nombre">{k.nombre}</span>
      <span className="tarjeta-kpi__valor">
        {valor !== null ? valor.toLocaleString('es-MX') : '—'}
        <span className="tarjeta-kpi__meta"> {k.unidad}</span>
      </span>
      <span className="tarjeta-kpi__meta">
        {k.meta.trim() ? 'Meta: ' + k.meta + ' ' + k.unidad : 'Sin meta'}
        {ult ? ' · ' + ult.periodo : ''}
      </span>
      <div className="tarjeta-kpi__pie">
        <span className={'pill ' + s.pill}>{s.texto}</span>
        {t.dir !== 0 && (
          <span className={'flecha ' + (t.dir > 0 ? 'flecha--ok' : 'flecha--stop')}>
            {t.dir > 0 ? '▲' : '▼'} {Math.abs(t.pct).toFixed(0)}%
          </span>
        )}
        {t.dir === 0 && ult && <span className="flecha flecha--neutro">=</span>}
      </div>
    </div>
  );
}

export function Scorecard({ estado, proceso }) {
  const vivos = kpisVivos(estado);
  const conLectura = vivos.filter((k) => ultimaLectura(k));

  const estados = conLectura.map((k) => semaforo(k, num(ultimaLectura(k).valor)));
  const enMeta = estados.filter((s) => s.tono === 'ok').length;
  const fuera = estados.filter((s) => s.tono === 'stop').length;
  const salud = conLectura.length ? (enMeta / conLectura.length) * 100 : 0;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Scorecard Operativo</h2>
        <p className="tool__intro">
          Las cinco dimensiones en una pantalla: tiempo, calidad, costo, productividad y servicio. Si
          todas están en verde y el negocio no mejora, los indicadores están mal elegidos. Si una
          mejora siempre a costa de otra, ahí hay una decisión que nadie ha tomado.
        </p>
      </header>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">IE-2</span>
          <span>Sin indicadores en el catálogo no hay scorecard.</span>
        </div>
      )}

      {vivos.length > 0 && conLectura.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">IE-5</span>
          <span>Hay indicadores pero ninguna lectura. Captura los valores en tendencias y el scorecard se enciende.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Salud del scorecard"
          valor={conLectura.length ? salud.toFixed(0) + '%' : '—'}
          pie={conLectura.length ? enMeta + ' de ' + conLectura.length + ' indicadores en meta' : 'Captura lecturas'}
          ember={salud >= 80}
        />
        <Cifra
          label="Fuera de meta"
          valor={fuera || '0'}
          pie={fuera ? 'Requieren explicación y acción' : 'Ninguno en rojo'}
          ember={fuera > 0}
        />
        <Cifra
          label="Sin lectura"
          valor={vivos.length - conLectura.length || '0'}
          pie={vivos.length - conLectura.length ? 'Indicadores dados de alta que nadie mide' : 'Todos con dato'}
          ember={vivos.length - conLectura.length > 0}
        />
      </div>

      <Bloque titulo={proceso ? 'Scorecard · ' + proceso.nombre : 'Scorecard'} meta="CINCO DIMENSIONES">
        {CATEGORIAS_KPI.map((c) => {
          const grupo = vivos.filter((k) => k.categoria === c.id);
          return (
            <div className="score__grupo" key={c.id}>
              <div className="score__cabeza">
                <span className="score__nombre">{c.nombre}</span>
                <span className="sipoc__pista" style={{ margin: 0, flex: 1 }}>
                  {c.pista}
                </span>
                <span className="sipoc__cuenta">{grupo.length}</span>
              </div>
              {grupo.length ? (
                <div className="score__rejilla">
                  {grupo.map((k) => (
                    <TarjetaKpi k={k} key={k.id} />
                  ))}
                </div>
              ) : (
                <p className="nota">Sin indicadores en esta dimensión. Suele ser la que después duele.</p>
              )}
            </div>
          );
        })}
      </Bloque>
    </div>
  );
}

/* =========================================================================
   IE-5 · Análisis de Tendencias y Desviaciones
   ========================================================================= */

function Sparkline({ k }) {
  const l = k.lecturas.filter((x) => x.valor !== '');
  if (l.length < 2) return null;

  const vals = l.map((x) => num(x.valor));
  const meta = k.meta.trim() ? num(k.meta) : null;
  const todos = meta !== null ? [...vals, meta] : vals;
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const rango = max - min || 1;
  const W = 100;
  const H = 40;

  const x = (i) => (i / (l.length - 1)) * W;
  const y = (v) => H - ((v - min) / rango) * H;

  const puntos = vals.map((v, i) => x(i) + ',' + y(v)).join(' ');

  return (
    <svg className="spark" viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none">
      {meta !== null && <line className="spark__meta" x1="0" y1={y(meta)} x2={W} y2={y(meta)} vectorEffect="non-scaling-stroke" />}
      <polyline className="spark__linea" points={puntos} vectorEffect="non-scaling-stroke" />
      <circle className="spark__punto" cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Tendencias({ estado, set }) {
  const ks = estado.kpis;
  const vivos = kpisVivos(estado);
  const [sel, setSel] = useState(vivos[0] ? vivos[0].id : null);

  const kpi = vivos.find((k) => k.id === sel) || vivos[0];

  const setLecturas = (id, lecturas) => set({ ...estado, kpis: ks.map((k) => (k.id === id ? { ...k, lecturas } : k)) });

  const agregarLectura = () => {
    if (!kpi) return;
    setLecturas(kpi.id, [...kpi.lecturas, { id: 'le' + Date.now() + Math.random().toString(16).slice(2, 6), periodo: '', valor: '' }]);
  };
  const editarLectura = (lid, campo, v) =>
    setLecturas(kpi.id, kpi.lecturas.map((l) => (l.id === lid ? { ...l, [campo]: v } : l)));
  const borrarLectura = (lid) => setLecturas(kpi.id, kpi.lecturas.filter((l) => l.id !== lid));

  const resumen = vivos.map((k) => {
    const t = tendenciaDe(k);
    const ult = ultimaLectura(k);
    const s = semaforo(k, ult ? num(ult.valor) : null);
    const desv = ult && k.meta.trim() && num(k.meta) ? ((num(ult.valor) - num(k.meta)) / Math.abs(num(k.meta))) * 100 : 0;
    return { ...k, t, ult, s, desv };
  });

  const empeorando = resumen.filter((r) => r.t.dir < 0).length;
  const rachas = resumen.filter((r) => r.t.dir < 0 && r.t.racha >= 2);
  const desvMayor = resumen.filter((r) => r.ult).length
    ? resumen.filter((r) => r.ult).reduce((a, r) => (Math.abs(r.desv) > Math.abs(a.desv) ? r : a))
    : null;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Análisis de Tendencias y Desviaciones</h2>
        <p className="tool__intro">
          Un dato aislado no dice nada; la serie sí. Lo que importa no es si este mes falló, sino si
          lleva tres seguidos yéndose para el mismo lado. Eso ya no es variación normal: es un patrón,
          y los patrones tienen causa.
        </p>
      </header>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">IE-2</span>
          <span>Sin indicadores no hay series que analizar.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Empeorando"
          valor={empeorando || '0'}
          pie={empeorando ? 'Contra el periodo anterior' : 'Ninguno va para atrás'}
          ember={empeorando > 0}
        />
        <Cifra
          label="Patrón sostenido"
          valor={rachas.length || '0'}
          pie={rachas.length ? rachas.length + ' con tres periodos o más empeorando' : 'Sin rachas negativas'}
          ember={rachas.length > 0}
        />
        <Cifra
          label="Desviación mayor"
          valor={desvMayor && desvMayor.desv ? (desvMayor.desv > 0 ? '+' : '') + desvMayor.desv.toFixed(0) + '%' : '—'}
          pie={desvMayor && desvMayor.desv ? desvMayor.nombre + ' contra su meta' : 'Captura lecturas y metas'}
        />
      </div>

      {vivos.length > 0 && (
        <Bloque titulo="Panorama" meta="TODOS LOS INDICADORES">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th className="num">Último</th>
                  <th className="num">Meta</th>
                  <th className="num">Desviación</th>
                  <th>Semáforo</th>
                  <th className="num">Tendencia</th>
                  <th style={{ minWidth: 110 }}>Serie</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((r) => (
                  <tr key={r.id} className={kpi && r.id === kpi.id ? 'is-lider' : ''}>
                    <td>
                      <span className="dato dato--fuerte">{r.nombre}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{r.ult ? r.ult.valor : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{r.meta || '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{r.desv ? (r.desv > 0 ? '+' : '') + r.desv.toFixed(0) + '%' : '—'}</span>
                    </td>
                    <td>
                      <span className={'pill ' + r.s.pill}>{r.s.texto}</span>
                    </td>
                    <td className="num">
                      {r.t.dir !== 0 ? (
                        <span className={'flecha ' + (r.t.dir > 0 ? 'flecha--ok' : 'flecha--stop')}>
                          {r.t.dir > 0 ? '▲' : '▼'} {Math.abs(r.t.pct).toFixed(0)}%
                          {r.t.racha >= 2 ? ' ×' + (r.t.racha + 1) : ''}
                        </span>
                      ) : (
                        <span className="flecha flecha--neutro">—</span>
                      )}
                    </td>
                    <td>
                      <Sparkline k={r} />
                    </td>
                    <td>
                      <button className="chip" onClick={() => setSel(r.id)}>
                        Lecturas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
            La línea punteada de cada serie es la meta. El "×3" junto a la flecha significa tres
            periodos seguidos moviéndose en la misma dirección.
          </p>
        </Bloque>
      )}

      {kpi && (
        <Bloque
          titulo={'Lecturas · ' + (kpi.nombre || 'Indicador')}
          meta={kpi.frecuencia.toUpperCase() + (kpi.unidad ? ' · ' + kpi.unidad.toUpperCase() : '')}
        >
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th className="num">Valor</th>
                  <th className="num">Contra meta</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {kpi.lecturas.map((l) => {
                  const v = l.valor !== '' ? num(l.valor) : null;
                  const s = semaforo(kpi, v);
                  const d = v !== null && kpi.meta.trim() && num(kpi.meta) ? ((v - num(kpi.meta)) / Math.abs(num(kpi.meta))) * 100 : 0;
                  return (
                    <tr key={l.id}>
                      <td>
                        <input className="tabla__input" value={l.periodo} placeholder="Ene, S12, 2026-03…" onChange={(e) => editarLectura(l.id, 'periodo', e.target.value)} />
                      </td>
                      <td className="num">
                        <input className="tabla__input tabla__input--num" value={l.valor} onChange={(e) => editarLectura(l.id, 'valor', e.target.value)} />
                      </td>
                      <td className="num">
                        <span className="dato">{d ? (d > 0 ? '+' : '') + d.toFixed(0) + '%' : '—'}</span>
                      </td>
                      <td>
                        <span className={'pill ' + s.pill}>{s.texto}</span>
                      </td>
                      <td>
                        <button className="boton--icono" onClick={() => borrarLectura(l.id)} title="Quitar">
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {kpi.lecturas.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <span className="a3__vacio">Sin lecturas. Agrega al menos tres para poder leer una tendencia.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 'var(--sp-4)' }}>
            <button className="boton--sec" onClick={agregarLectura}>
              + Agregar lectura
            </button>
          </div>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   IE-6 · Alertas Inteligentes
   ========================================================================= */

function generarAlertas(estado) {
  const cfg = estado.alertas;
  const umbral = num(cfg.umbralDesviacion);
  const periodos = num(cfg.periodosRacha) || 3;
  const out = [];

  kpisVivos(estado).forEach((k) => {
    const ult = ultimaLectura(k);
    const t = tendenciaDe(k);
    const s = ult ? semaforo(k, num(ult.valor)) : null;

    if (!ult) {
      if (cfg.avisarSinLectura) {
        out.push({
          id: k.id + '-sin',
          sev: 'baja',
          kpi: k.nombre,
          texto: 'Indicador dado de alta sin ninguna lectura. O se mide, o se da de baja del catálogo.',
          dato: '—',
        });
      }
      return;
    }

    if (s && s.tono === 'stop') {
      const desv = k.meta.trim() && num(k.meta) ? ((num(ult.valor) - num(k.meta)) / Math.abs(num(k.meta))) * 100 : 0;
      out.push({
        id: k.id + '-fuera',
        sev: 'alta',
        kpi: k.nombre,
        texto: 'Fuera de meta en ' + ult.periodo + '. Meta ' + k.meta + ' ' + k.unidad + ', lectura ' + ult.valor + ' ' + k.unidad + '.',
        dato: (desv > 0 ? '+' : '') + desv.toFixed(0) + '%',
      });
    }

    if (umbral && Math.abs(t.pct) >= umbral && t.dir < 0) {
      out.push({
        id: k.id + '-salto',
        sev: 'alta',
        kpi: k.nombre,
        texto: 'Se movió ' + Math.abs(t.pct).toFixed(0) + '% contra el periodo anterior, por encima del umbral de ' + umbral + '%.',
        dato: '▼ ' + Math.abs(t.pct).toFixed(0) + '%',
      });
    }

    if (t.dir < 0 && t.racha + 1 >= periodos) {
      out.push({
        id: k.id + '-racha',
        sev: 'media',
        kpi: k.nombre,
        texto: (t.racha + 1) + ' periodos seguidos empeorando. Eso ya no es variación: es patrón, y tiene causa.',
        dato: '×' + (t.racha + 1),
      });
    }

    if (s && s.tono === 'warn') {
      out.push({
        id: k.id + '-limite',
        sev: 'media',
        kpi: k.nombre,
        texto: 'Dentro de la tolerancia pero fuera de meta. Todavía se corrige barato.',
        dato: ult.valor + ' ' + k.unidad,
      });
    }

    if (!k.responsable.trim()) {
      out.push({
        id: k.id + '-dueno',
        sev: 'baja',
        kpi: k.nombre,
        texto: 'Sin responsable asignado. Cuando se desvíe, no habrá a quién preguntarle.',
        dato: '—',
      });
    }
  });

  const orden = { alta: 0, media: 1, baja: 2 };
  return out.sort((a, b) => orden[a.sev] - orden[b.sev]);
}

export function Alertas({ estado, set }) {
  const cfg = estado.alertas;
  const campo = (k, v) => set({ ...estado, alertas: { ...cfg, [k]: v } });

  const alertas = generarAlertas(estado);
  const altas = alertas.filter((a) => a.sev === 'alta').length;
  const medias = alertas.filter((a) => a.sev === 'media').length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Alertas Inteligentes</h2>
        <p className="tool__intro">
          Las alertas no se capturan: se generan solas con lo que ya está en el catálogo y en las
          series. La regla de oro es no alertar de más: si todo alerta, nada alerta, y la gente
          aprende a ignorar el tablero en una semana.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Alertas activas"
          valor={alertas.length || '0'}
          pie={alertas.length ? altas + ' altas · ' + medias + ' medias' : 'Todo dentro de parámetros'}
          ember={altas > 0}
        />
        <Cifra
          label="Requieren acción hoy"
          valor={altas || '0'}
          pie={altas ? 'Fuera de meta o con salto brusco' : 'Ninguna urgente'}
          ember={altas > 0}
        />
        <Cifra
          label="Umbral configurado"
          valor={cfg.umbralDesviacion ? cfg.umbralDesviacion + '%' : '—'}
          pie={'Racha de ' + (cfg.periodosRacha || 3) + ' periodos'}
        />
      </div>

      <Bloque titulo="Reglas" meta="CUÁNDO AVISAR">
        <div className="rejilla">
          <Campo
            label="Umbral de desviación (%)"
            valor={cfg.umbralDesviacion}
            onChange={(v) => campo('umbralDesviacion', v)}
            pista="Salto contra el periodo anterior que dispara alerta alta."
          />
          <Campo
            label="Periodos para declarar patrón"
            valor={cfg.periodosRacha}
            onChange={(v) => campo('periodosRacha', v)}
            pista="Cuántas lecturas seguidas en la misma dirección se consideran tendencia."
          />
          <div className="campo">
            <label className="campo__label">Avisar indicadores sin lectura</label>
            <select className="campo__input" value={cfg.avisarSinLectura ? 'si' : 'no'} onChange={(e) => campo('avisarSinLectura', e.target.value === 'si')}>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
            <span className="campo__pista">Detecta indicadores que se dieron de alta y nadie mide.</span>
          </div>
        </div>
      </Bloque>

      <Bloque titulo="Qué está pasando" meta={alertas.length + ' ALERTA(S)'}>
        {alertas.length === 0 ? (
          <p className="nota">
            Sin alertas. Puede ser que todo esté en orden, o que falten lecturas y metas para que el
            sistema tenga algo contra qué comparar.
          </p>
        ) : (
          alertas.map((a) => (
            <div className={'alerta alerta--' + a.sev} key={a.id}>
              <span className="alerta__sev">{a.sev}</span>
              <div className="alerta__cuerpo">
                <span className="alerta__kpi">{a.kpi}</span>
                <span className="alerta__texto">{a.texto}</span>
              </div>
              <span className="alerta__dato">{a.dato}</span>
            </div>
          ))
        )}
      </Bloque>
    </div>
  );
}

/* =========================================================================
   IE-7 · Motor de Recomendaciones
   ========================================================================= */

function hallazgosDe(estado, otros) {
  const out = [];

  const alertas = generarAlertas(estado);
  const altas = alertas.filter((a) => a.sev === 'alta');
  if (altas.length) {
    out.push({
      sev: 'alta',
      titulo: altas.length + ' indicador(es) fuera de meta o con salto brusco',
      detalle: altas.map((a) => a.kpi).join(' · '),
      fuente: 'IE-6',
    });
  }

  const costo = otros.dp.costo;
  const costoHora = num(costo.costoHora);
  const totalMes = CONCEPTOS_COSTO.reduce((a, k) => {
    const d = costo.conceptos[k.id];
    const unit = k.base === 'costoHora' ? costoHora : num(d.unitario);
    return a + num(d.cantidad) * unit;
  }, 0);
  if (totalMes) {
    out.push({
      sev: 'alta',
      titulo: 'El desperdicio cuesta ' + moneda(totalMes * 12) + ' al año',
      detalle: 'Cuantificado en el diagnóstico de procesos. Es el presupuesto que ya se está gastando sin decidirlo.',
      fuente: 'DP-6',
    });
  }

  const pasos = otros.mr.pasos.filter((p) => p.nombre.trim());
  const demanda = num(otros.mr.demandaDia);
  if (pasos.length && demanda) {
    const conSat = pasos.map((p) => {
      const cap = num(p.tProceso) ? (num(otros.mr.horasDia) * 60) / num(p.tProceso) : 0;
      return { ...p, sat: cap ? (demanda / cap) * 100 : 0 };
    });
    const peor = conSat.reduce((a, p) => (p.sat > a.sat ? p : a));
    if (peor.sat > 100) {
      out.push({
        sev: 'alta',
        titulo: 'La restricción está en "' + peor.nombre + '" al ' + peor.sat.toFixed(0) + '%',
        detalle: 'Mejorar cualquier otro paso no aumenta la salida del proceso. Ahí va el esfuerzo.',
        fuente: 'MR-4',
      });
    }
  }

  const liberables = otros.pc.automatizables
    .filter((a) => a.actividad.trim())
    .reduce((a, x) => a + (num(x.horasMes) * potencialDe(x)) / 100, 0);
  if (liberables > 0) {
    out.push({
      sev: 'media',
      titulo: liberables.toFixed(0) + ' horas al mes son automatizables',
      detalle: 'Capacidad que hoy se gasta en trabajo que no requiere criterio humano.',
      fuente: 'PC-6',
    });
  }

  const sobrecargados = otros.pc.recursos.filter((r) => {
    if (!r.nombre.trim()) return false;
    const cap = capacidadDe(r).efectiva;
    return cap && cargaDe(otros.pc, r.id) / cap > 1;
  });
  if (sobrecargados.length) {
    out.push({
      sev: 'media',
      titulo: sobrecargados.length + ' recurso(s) trabajando por encima de su capacidad',
      detalle: sobrecargados.map((r) => r.nombre).join(' · ') + '. Revisa primero reasignación, después contratación.',
      fuente: 'PC-3',
    });
  }

  const prioridad = otros.dp.problemas.filter((p) => p.problema.trim() && p.impacto >= 4 && p.frecuencia >= 4);
  if (prioridad.length) {
    out.push({
      sev: 'media',
      titulo: prioridad.length + ' problema(s) frecuentes y de alto impacto sin resolver',
      detalle: prioridad.map((p) => p.problema).join(' · '),
      fuente: 'DP-5',
    });
  }

  const confirmadas = otros.rp.validacion.filter((v) => v.hipotesis.trim() && v.veredicto === 'confirmada');
  const conControl = otros.es.pokayoke.filter((p) => p.error.trim() && p.estado === 'implementado');
  if (confirmadas.length && conControl.length < confirmadas.length) {
    out.push({
      sev: 'media',
      titulo: confirmadas.length - conControl.length + ' causa(s) confirmadas sin control implementado',
      detalle: 'Se sabe qué falla y por qué, pero nada impide que vuelva a pasar.',
      fuente: 'RP-5 · ES-6',
    });
  }

  const vivos = kpisVivos(estado);
  const sinLectura = vivos.filter((k) => !ultimaLectura(k));
  if (sinLectura.length) {
    out.push({
      sev: 'baja',
      titulo: sinLectura.length + ' indicador(es) sin una sola lectura',
      detalle: 'Un tablero incompleto genera decisiones parciales.',
      fuente: 'IE-5',
    });
  }

  const orden = { alta: 0, media: 1, baja: 2 };
  return out.sort((a, b) => orden[a.sev] - orden[b.sev]);
}

export function Motor({ estado, set, proceso, otros }) {
  const { cargando, error, correr } = usaIA();
  const hallazgos = hallazgosDe(estado, otros);

  const pedir = () =>
    correr(async () => {
      const contexto = hallazgos.map((h) => '- [' + h.fuente + '] ' + h.titulo + ': ' + h.detalle).join('\n');
      const prompt =
        'Proceso analizado: ' + (proceso ? proceso.nombre : 'sin definir') + '\n\n' +
        'Hallazgos del sistema:\n' + contexto + '\n\n' +
        'Escribe una recomendación ejecutiva para el dueño de la empresa con esta estructura exacta, sin markdown:\n' +
        'CONCLUSIÓN: una sola frase con la lectura de fondo, apoyada en el número más fuerte.\n' +
        'DECISIÓN: las tres acciones que sí se hacen, en orden, cada una con responsable sugerido y plazo.\n' +
        'ELIMINACIÓN: qué se deja de hacer o se quita para liberar el tiempo de esas tres.\n\n' +
        'Máximo 180 palabras en total. No inventes cifras que no estén en los hallazgos.';
      const r = await pedirIA(prompt, SISTEMA_UPAX);
      if (r) set({ ...estado, recomendacion: r });
      return r;
    });

  const altas = hallazgos.filter((h) => h.sev === 'alta').length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Motor de Recomendaciones</h2>
        <p className="tool__intro">
          El cierre del sistema. Lee lo capturado en los siete módulos —costo del desperdicio,
          restricción, capacidad automatizable, causas sin control, indicadores fuera de meta— y lo
          convierte en hallazgos ordenados por prioridad. Después la IA los traduce en decisión.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Hallazgos"
          valor={hallazgos.length || '—'}
          pie={hallazgos.length ? altas + ' de atención inmediata' : 'Captura datos en los módulos anteriores'}
          ember={altas > 0}
        />
        <Cifra
          label="Módulos con dato"
          valor={new Set(hallazgos.map((h) => h.fuente.split(' · ')[0].split('-')[0])).size + '/7'}
          pie="De dónde salen los hallazgos"
        />
        <Cifra
          label="Recomendación"
          valor={estado.recomendacion ? 'Lista' : '—'}
          pie={estado.recomendacion ? 'Generada con el contexto completo' : 'Genera la recomendación abajo'}
        />
      </div>

      <Bloque titulo="Hallazgos" meta="DE TODO EL SISTEMA">
        {hallazgos.length === 0 ? (
          <p className="nota">
            Todavía no hay suficiente dato capturado. El motor lee del diagnóstico de procesos, el
            mapeo, la capacidad, la resolución de problemas, la estandarización y los indicadores. En
            cuanto haya cifras en cualquiera de esos, aquí aparecen los hallazgos.
          </p>
        ) : (
          hallazgos.map((h, i) => (
            <div className="hallazgo" key={i}>
              <span className={'hallazgo__orden' + (h.sev === 'alta' ? ' hallazgo__orden--alta' : '')}>{String(i + 1).padStart(2, '0')}</span>
              <div className="hallazgo__cuerpo">
                <div className="hallazgo__titulo">{h.titulo}</div>
                <div className="hallazgo__detalle">{h.detalle}</div>
                <span className="hallazgo__fuente">{h.fuente}</span>
              </div>
            </div>
          ))
        )}
      </Bloque>

      <Bloque titulo="Recomendación ejecutiva" meta="CONCLUSIÓN · DECISIÓN · ELIMINACIÓN">
        <p className="nota" style={{ marginBottom: 'var(--sp-4)' }}>
          La IA lee los hallazgos de arriba y solo esos. No inventa cifras: si algo no está
          capturado, no aparece en la recomendación.
        </p>

        <BotonIA cargando={cargando} onClick={pedir} disabled={hallazgos.length === 0}>
          Generar recomendación
        </BotonIA>

        {error && <p className="ia-error">{error}</p>}

        {estado.recomendacion && (
          <div className="ia-salida" style={{ marginTop: 'var(--sp-4)' }}>
            {estado.recomendacion}
          </div>
        )}
      </Bloque>

      <Bloque titulo="Qué se decide" meta="LA PALABRA DEL DUEÑO">
        <div className="rejilla">
          <Campo
            label="Decisión tomada"
            valor={estado.decision}
            onChange={(v) => set({ ...estado, decision: v })}
            area
            ancho
            pista="Lo que de verdad se va a hacer, con nombre y fecha. La recomendación es de la máquina; la decisión es tuya."
          />
        </div>
      </Bloque>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_IE = {
  objetivos: [nuevoObjetivo()],
  kpis: [nuevoKpi()],
  alertas: { umbralDesviacion: '15', periodosRacha: '3', avisarSinLectura: true },
  recomendacion: '',
  decision: '',
};
