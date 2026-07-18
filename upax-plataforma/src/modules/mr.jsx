import { Fragment } from 'react';
import { Bloque, Campo, Barra, Cifra, AvisoProceso } from '../lib/ui.jsx';
import { num, moneda } from '../lib/util.js';
/* =========================================================================
   MÓDULO MR · MAPEO Y REDISEÑO
     MR-1 Mapa actual ─→ MR-2 Swimlane, MR-3 Tiempos, MR-4 Cuellos,
                          MR-5 Transferencias, MR-6 Futuro ─→ MR-7 Comparador
   El mapa puede heredar el inventario capturado en DP-2.
   ========================================================================= */

const TIPOS_PASO = [
  { id: 'actividad', nombre: 'Actividad' },
  { id: 'decision', nombre: 'Decisión' },
  { id: 'espera', nombre: 'Espera' },
];

const ACCIONES = [
  { id: 'conservar', corto: 'Conservar', chip: 'chip--conservar' },
  { id: 'simplificar', corto: 'Simplificar', chip: 'chip--simplificar' },
  { id: 'fusionar', corto: 'Fusionar', chip: 'chip--fusionar' },
  { id: 'eliminar', corto: 'Eliminar', chip: 'chip--eliminar' },
];

const nuevoPaso = () => ({
  id: 'ps' + Date.now() + Math.random().toString(16).slice(2, 6),
  nombre: '',
  tipo: 'actividad',
  responsable: '',
  tProceso: '',
  tEspera: '',
  cola: '',
  transferencia: false,
  autorizacion: false,
  veredicto: null, // 'conservar' | 'eliminar'
  motivo: '',
  accion: 'conservar',
  tProcesoFuturo: '',
  tEsperaFuturo: '',
});

const pasosVivos = (pasos) => pasos.filter((p) => p.nombre.trim());

function totales(pasos) {
  const v = pasosVivos(pasos);
  const proc = v.reduce((a, p) => a + num(p.tProceso), 0);
  const esp = v.reduce((a, p) => a + num(p.tEspera), 0);
  return { pasos: v.length, proc, esp, total: proc + esp, eficiencia: proc + esp ? (proc / (proc + esp)) * 100 : 0 };
}

function totalesFuturo(pasos) {
  const v = pasosVivos(pasos).filter((p) => p.accion !== 'eliminar');
  const proc = v.reduce((a, p) => a + (p.tProcesoFuturo !== '' ? num(p.tProcesoFuturo) : num(p.tProceso)), 0);
  const esp = v.reduce((a, p) => a + (p.tEsperaFuturo !== '' ? num(p.tEsperaFuturo) : num(p.tEspera)), 0);
  return {
    pasos: v.length,
    proc,
    esp,
    total: proc + esp,
    eficiencia: proc + esp ? (proc / (proc + esp)) * 100 : 0,
    transferencias: v.filter((p) => p.transferencia).length,
    autorizaciones: v.filter((p) => p.autorizacion).length,
  };
}

/* =========================================================================
   MR-1 · Mapa del Proceso Actual
   ========================================================================= */

export function Mapa({ estado, set, proceso, otros }) {
  const pasos = estado.pasos;

  const editar = (id, k, v) => set({ ...estado, pasos: pasos.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });
  const agregar = () => set({ ...estado, pasos: [...pasos, nuevoPaso()] });
  const borrar = (id) => {
    if (pasos.length <= 1) return;
    set({ ...estado, pasos: pasos.filter((p) => p.id !== id) });
  };
  const mover = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= pasos.length) return;
    const copia = [...pasos];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    set({ ...estado, pasos: copia });
  };

  const actividadesDp = otros.dp.actividades.filter((a) => a.nombre.trim());

  const importar = () => {
    const nuevos = actividadesDp.map((a) => ({
      ...nuevoPaso(),
      id: 'ps' + a.id,
      nombre: a.nombre,
      responsable: a.responsable,
      tProceso: a.minutos,
      tipo: 'actividad',
    }));
    const vacios = pasosVivos(pasos).length === 0;
    set({ ...estado, pasos: vacios ? nuevos : [...pasos, ...nuevos] });
  };

  const t = totales(pasos);
  const transferencias = pasosVivos(pasos).filter((p) => p.transferencia).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Mapa del Proceso Actual</h2>
        <p className="tool__intro">
          La secuencia real, en el orden en que ocurre: actividades, decisiones, esperas, quién
          responde por cada paso y dónde el trabajo cambia de manos. Todo lo demás en este módulo se
          calcula desde aquí.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <div className="tablero">
        <Cifra label="Pasos" valor={t.pasos || '—'} pie="La secuencia completa" />
        <Cifra
          label="Tiempo total"
          valor={t.total ? t.total.toLocaleString('es-MX') + ' min' : '—'}
          pie={t.proc ? t.proc.toLocaleString('es-MX') + ' de proceso · ' + t.esp.toLocaleString('es-MX') + ' de espera' : 'Captura tiempos'}
        />
        <Cifra
          label="Transferencias"
          valor={transferencias || '—'}
          pie="Veces que el trabajo cambia de manos"
          ember={transferencias > 3}
        />
      </div>

      {actividadesDp.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-2</span>
          <span style={{ flex: 1 }}>
            Hay {actividadesDp.length} actividad(es) en el inventario. Puedes traerlas como punto de
            partida en lugar de recapturarlas.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer del inventario
          </button>
        </div>
      )}

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Paso</th>
                <th>Tipo</th>
                <th>Responsable</th>
                <th className="num">Proceso</th>
                <th className="num">Espera</th>
                <th>Transfiere</th>
                <th>Autoriza</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pasos.map((p, i) => (
                <tr key={p.id}>
                  <td className="num">
                    <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                  </td>
                  <td>
                    <input className="tabla__input" value={p.nombre} placeholder="Qué ocurre" onChange={(e) => editar(p.id, 'nombre', e.target.value)} />
                  </td>
                  <td>
                    <select className="tabla__select" value={p.tipo} onChange={(e) => editar(p.id, 'tipo', e.target.value)}>
                      {TIPOS_PASO.map((t2) => (
                        <option key={t2.id} value={t2.id}>
                          {t2.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="tabla__input" value={p.responsable} placeholder="Área o persona" onChange={(e) => editar(p.id, 'responsable', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={p.tProceso} onChange={(e) => editar(p.id, 'tProceso', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={p.tEspera} onChange={(e) => editar(p.id, 'tEspera', e.target.value)} />
                  </td>
                  <td>
                    <input type="checkbox" checked={p.transferencia} onChange={(e) => editar(p.id, 'transferencia', e.target.checked)} />
                  </td>
                  <td>
                    <input type="checkbox" checked={p.autorizacion} onChange={(e) => editar(p.id, 'autorizacion', e.target.checked)} />
                  </td>
                  <td>
                    <div className="chips">
                      <button className="chip" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir">
                        ↑
                      </button>
                      <button className="chip" onClick={() => mover(i, 1)} disabled={i === pasos.length - 1} title="Bajar">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(p.id)} disabled={pasos.length <= 1} title="Quitar">
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
            + Agregar paso
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   MR-2 · Diagrama Swimlane
   ========================================================================= */

export function Swimlane({ estado }) {
  const pasos = pasosVivos(estado.pasos);
  const carriles = [];
  pasos.forEach((p) => {
    const r = p.responsable.trim() || 'Sin responsable';
    if (!carriles.includes(r)) carriles.push(r);
  });

  const saltos = pasos.filter((p, i) => i > 0 && (p.responsable.trim() || 'Sin responsable') !== (pasos[i - 1].responsable.trim() || 'Sin responsable')).length;
  const sinDueno = pasos.filter((p) => !p.responsable.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Diagrama Swimlane</h2>
        <p className="tool__intro">
          El proceso repartido por carriles: cada renglón es un área o responsable y cada columna, un
          paso de la secuencia. Los saltos entre carriles son donde el trabajo cambia de manos, y
          donde suele perderse.
        </p>
      </header>

      {pasos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-1</span>
          <span>No hay pasos capturados. Levanta el mapa del proceso actual y el diagrama se dibuja solo.</span>
        </div>
      )}

      {pasos.length > 0 && (
        <>
          <div className="tablero">
            <Cifra label="Carriles" valor={carriles.length} pie="Áreas o responsables involucrados" />
            <Cifra
              label="Saltos entre carriles"
              valor={saltos || '—'}
              pie="Cada salto es un punto de riesgo"
              ember={saltos > 3}
            />
            <Cifra
              label="Pasos sin dueño"
              valor={sinDueno || '0'}
              pie={sinDueno ? 'Asígnalos en el mapa' : 'Todos con responsable'}
              ember={sinDueno > 0}
            />
          </div>

          <Bloque titulo="Quién hace qué" meta={pasos.length + ' PASOS · ' + carriles.length + ' CARRILES'}>
            <div className="swim">
              <div
                className="swim__grid"
                style={{ gridTemplateColumns: '150px repeat(' + pasos.length + ', 150px)' }}
              >
                <div className="swim__cabecera">Carril</div>
                {pasos.map((p, i) => (
                  <div className="swim__col" key={'h' + p.id}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                ))}

                {carriles.map((c, fila) => (
                  <Fragment key={c}>
                    <div className="swim__carril">{c}</div>
                    {pasos.map((p, i) => {
                      const suyo = (p.responsable.trim() || 'Sin responsable') === c;
                      const previo = i > 0 ? pasos[i - 1].responsable.trim() || 'Sin responsable' : null;
                      const salto = suyo && previo !== null && previo !== c;
                      return (
                        <div
                          className={fila % 2 ? 'swim__celda swim__celda--alt' : 'swim__celda'}
                          key={c + p.id}
                        >
                          {suyo && (
                            <div
                              className={[
                                'swim__paso',
                                p.tipo === 'decision' ? 'swim__paso--decision' : '',
                                p.tipo === 'espera' ? 'swim__paso--espera' : '',
                                salto ? 'swim__paso--salto' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <span className="swim__num">{String(i + 1).padStart(2, '0')}</span>
                              <span className="swim__nombre">{p.nombre}</span>
                              <span className="swim__tiempo">
                                {num(p.tProceso) ? num(p.tProceso) + ' min' : ''}
                                {num(p.tEspera) ? ' · +' + num(p.tEspera) + ' esp' : ''}
                              </span>
                              {salto && <span className="swim__salto">HANDOFF</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="leyenda">
              <span className="leyenda__item">
                <span className="leyenda__punto" style={{ background: 'var(--upax-ink)' }} /> Actividad
              </span>
              <span className="leyenda__item">
                <span className="leyenda__punto" style={{ background: 'var(--warn)' }} /> Decisión
              </span>
              <span className="leyenda__item">
                <span className="leyenda__punto" style={{ background: 'var(--stop)' }} /> Espera
              </span>
              <span className="leyenda__item">
                <span className="leyenda__punto" style={{ background: 'var(--upax-ember)' }} /> Cambio de carril
              </span>
            </div>
          </Bloque>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   MR-3 · Análisis de Tiempos
   ========================================================================= */

export function Tiempos({ estado }) {
  const pasos = pasosVivos(estado.pasos);
  const t = totales(estado.pasos);
  const maxTotal = Math.max(...pasos.map((p) => num(p.tProceso) + num(p.tEspera)), 1);
  const masLento = pasos.length
    ? pasos.reduce((a, p) => (num(p.tProceso) + num(p.tEspera) > num(a.tProceso) + num(a.tEspera) ? p : a))
    : null;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Análisis de Tiempos</h2>
        <p className="tool__intro">
          Tiempo de proceso es cuando alguien está trabajando la pieza. Tiempo de espera es cuando
          no. En la mayoría de los procesos la espera es la que manda, y es la barata de atacar
          porque no requiere gente ni equipo: requiere decisión.
        </p>
      </header>

      {pasos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-1</span>
          <span>Sin pasos capturados no hay tiempos que analizar.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Tiempo de proceso"
          valor={t.proc ? t.proc.toLocaleString('es-MX') + ' min' : '—'}
          pie="Trabajo efectivo"
        />
        <Cifra
          label="Tiempo de espera"
          valor={t.esp ? t.esp.toLocaleString('es-MX') + ' min' : '—'}
          pie="Trabajo detenido"
          ember={t.esp > t.proc}
        />
        <Cifra
          label="Eficiencia de ciclo"
          valor={t.total ? t.eficiencia.toFixed(0) + '%' : '—'}
          pie={t.total ? 'Total: ' + t.total.toLocaleString('es-MX') + ' min' : 'Captura tiempos en el mapa'}
        />
      </div>

      {t.total > 0 && (
        <Bloque titulo="Reparto del tiempo total" meta={t.total.toLocaleString('es-MX') + ' MIN'}>
          <div className="reparto">
            <div className="reparto__parte reparto__parte--va" style={{ width: (t.proc / t.total) * 100 + '%' }} />
            <div className="reparto__parte reparto__parte--nva" style={{ width: (t.esp / t.total) * 100 + '%' }} />
          </div>
          <div className="leyenda">
            <span className="leyenda__item">
              <span className="leyenda__punto" style={{ background: 'var(--ok)' }} /> Proceso:{' '}
              {((t.proc / t.total) * 100).toFixed(0)}%
            </span>
            <span className="leyenda__item">
              <span className="leyenda__punto" style={{ background: 'var(--stop)' }} /> Espera:{' '}
              {((t.esp / t.total) * 100).toFixed(0)}%
            </span>
          </div>
        </Bloque>
      )}

      {pasos.length > 0 && (
        <Bloque titulo="Tiempo por paso" meta={masLento ? 'MÁS LENTO: ' + masLento.nombre.toUpperCase().slice(0, 24) : ''}>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Paso</th>
                  <th>Responsable</th>
                  <th className="num">Proceso</th>
                  <th className="num">Espera</th>
                  <th className="num">Total</th>
                  <th>Peso</th>
                </tr>
              </thead>
              <tbody>
                {pasos.map((p, i) => {
                  const tot = num(p.tProceso) + num(p.tEspera);
                  return (
                    <tr key={p.id} className={masLento && p.id === masLento.id && tot > 0 ? 'is-lider' : ''}>
                      <td className="num">
                        <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                      </td>
                      <td>{p.nombre}</td>
                      <td>
                        <span className="dato">{p.responsable || '—'}</span>
                      </td>
                      <td className="num">
                        <span className="dato">{p.tProceso || '—'}</span>
                      </td>
                      <td className="num">
                        <span className="dato">{p.tEspera || '—'}</span>
                      </td>
                      <td className="num">
                        <span className="dato dato--fuerte">{tot || '—'}</span>
                      </td>
                      <td>
                        <Barra pct={(tot / maxTotal) * 100} ember={masLento && p.id === masLento.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   MR-4 · Detección de Cuellos de Botella
   ========================================================================= */

export function Cuellos({ estado, set }) {
  const pasos = pasosVivos(estado.pasos);

  const editar = (id, k, v) =>
    set({ ...estado, pasos: estado.pasos.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });

  const demanda = num(estado.demandaDia);

  const filas = pasos.map((p) => {
    const capacidad = num(p.tProceso) ? (num(estado.horasDia) * 60) / num(p.tProceso) : 0;
    const saturacion = capacidad ? (demanda / capacidad) * 100 : 0;
    return { ...p, capacidad, saturacion, cola: num(p.cola) };
  });

  const restriccion = filas.length ? filas.reduce((a, f) => (f.saturacion > a.saturacion ? f : a)) : null;
  const saturados = filas.filter((f) => f.saturacion > 100).length;
  const maxCola = Math.max(...filas.map((f) => f.cola), 1);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Detección de Cuellos de Botella</h2>
        <p className="tool__intro">
          La capacidad del proceso es la del paso más saturado, no la del promedio. Captura la
          demanda diaria y las horas disponibles; el sistema calcula cuánto puede procesar cada paso
          y cuál está por encima de su límite. Mejorar cualquier paso que no sea la restricción no
          aumenta la salida.
        </p>
      </header>

      {pasos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-1</span>
          <span>Sin pasos capturados no hay dónde buscar la restricción.</span>
        </div>
      )}

      <Bloque titulo="Parámetros" meta="BASE DEL CÁLCULO">
        <div className="rejilla">
          <Campo
            label="Demanda diaria"
            valor={estado.demandaDia}
            onChange={(v) => set({ ...estado, demandaDia: v })}
            pista="Unidades, casos u órdenes que entran al día."
          />
          <Campo
            label="Horas disponibles al día"
            valor={estado.horasDia}
            onChange={(v) => set({ ...estado, horasDia: v })}
            pista="Horas efectivas de trabajo por paso."
          />
        </div>
      </Bloque>

      <div className="tablero">
        <Cifra
          label="La restricción"
          valor={restriccion && restriccion.saturacion ? restriccion.saturacion.toFixed(0) + '%' : '—'}
          pie={restriccion && restriccion.saturacion ? restriccion.nombre : 'Captura demanda y tiempos'}
          ember={restriccion && restriccion.saturacion > 100}
        />
        <Cifra
          label="Pasos por encima del límite"
          valor={saturados || '0'}
          pie={saturados ? 'Acumulan trabajo todos los días' : 'Ninguno rebasa su capacidad'}
          ember={saturados > 0}
        />
        <Cifra
          label="Capacidad del proceso"
          valor={restriccion && restriccion.capacidad ? Math.floor(restriccion.capacidad).toLocaleString('es-MX') : '—'}
          pie="Lo que puede entregar al día, no más"
        />
      </div>

      <Bloque titulo="Saturación por paso" meta="DEMANDA VS CAPACIDAD">
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Paso</th>
                <th>Responsable</th>
                <th className="num">Min/unidad</th>
                <th className="num">Capacidad/día</th>
                <th className="num">Saturación</th>
                <th>Nivel</th>
                <th className="num">Acumulación</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.id} className={restriccion && f.id === restriccion.id && f.saturacion > 0 ? 'is-lider' : ''}>
                  <td className="num">
                    <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                  </td>
                  <td>{f.nombre}</td>
                  <td>
                    <span className="dato">{f.responsable || '—'}</span>
                  </td>
                  <td className="num">
                    <span className="dato">{f.tProceso || '—'}</span>
                  </td>
                  <td className="num">
                    <span className="dato">{f.capacidad ? Math.floor(f.capacidad).toLocaleString('es-MX') : '—'}</span>
                  </td>
                  <td className="num">
                    <span className="dato dato--fuerte">{f.saturacion ? f.saturacion.toFixed(0) + '%' : '—'}</span>
                  </td>
                  <td>
                    {f.saturacion ? (
                      <span
                        className={
                          f.saturacion > 100 ? 'pill pill--stop' : f.saturacion > 85 ? 'pill pill--warn' : 'pill pill--ok'
                        }
                      >
                        {f.saturacion > 100 ? 'Rebasado' : f.saturacion > 85 ? 'Al límite' : 'Holgado'}
                      </span>
                    ) : (
                      <span className="pill pill--neutro">Sin dato</span>
                    )}
                  </td>
                  <td className="num">
                    <input
                      className="tabla__input tabla__input--num"
                      value={f.cola || ''}
                      placeholder="0"
                      onChange={(e) => editar(f.id, 'cola', e.target.value)}
                      title="Unidades esperando delante de este paso"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          La acumulación se captura en piso: cuántas unidades están formadas delante del paso. Donde
          crece la fila, ahí está el cuello, aunque el cálculo diga otra cosa.
        </p>
      </Bloque>

      {filas.some((f) => f.cola > 0) && (
        <Bloque titulo="Dónde se acumula el trabajo" meta="CONTEO EN PISO">
          {filas
            .filter((f) => f.cola > 0)
            .map((f) => (
              <div className="marcador" key={f.id}>
                <span className="marcador__nombre">{f.nombre}</span>
                <Barra pct={(f.cola / maxCola) * 100} ember={f.cola === maxCola} />
                <span className="marcador__valor">{f.cola}</span>
              </div>
            ))}
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   MR-5 · Análisis de Transferencias y Autorizaciones
   ========================================================================= */

export function Transferencias({ estado, set }) {
  const pasos = pasosVivos(estado.pasos);
  const marcados = pasos.filter((p) => p.transferencia || p.autorizacion);

  const editar = (id, k, v) =>
    set({ ...estado, pasos: estado.pasos.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });

  const juzgados = marcados.filter((p) => p.veredicto).length;
  const eliminables = marcados.filter((p) => p.veredicto === 'eliminar');
  const tiempoLiberado = eliminables.reduce((a, p) => a + num(p.tProceso) + num(p.tEspera), 0);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Análisis de Transferencias y Autorizaciones</h2>
        <p className="tool__intro">
          Cada firma nació para resolver un problema, casi siempre uno que ya no existe. Cada
          transferencia agrega espera, riesgo de error y dilución de responsabilidad. La prueba es
          simple: si nadie recuerda qué se ha detenido gracias a esa firma en el último año, la firma
          sobra.
        </p>
      </header>

      {marcados.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-1</span>
          <span>Ningún paso está marcado como transferencia ni como autorización. Márcalos en el mapa del proceso actual.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Puntos de control"
          valor={marcados.length || '—'}
          pie={
            marcados.length
              ? marcados.filter((p) => p.transferencia).length + ' transferencias · ' + marcados.filter((p) => p.autorizacion).length + ' autorizaciones'
              : 'Márcalos en el mapa'
          }
        />
        <Cifra label="Juzgados" valor={juzgados + '/' + marcados.length} pie="Con veredicto asignado" />
        <Cifra
          label="Tiempo que se libera"
          valor={tiempoLiberado ? tiempoLiberado.toLocaleString('es-MX') + ' min' : '—'}
          pie={eliminables.length ? eliminables.length + ' paso(s) por eliminar' : 'Nada marcado para eliminar'}
          ember={tiempoLiberado > 0}
        />
      </div>

      {marcados.map((p, i) => (
        <Bloque
          key={p.id}
          titulo={p.nombre}
          meta={[p.transferencia ? 'TRANSFERENCIA' : null, p.autorizacion ? 'AUTORIZACIÓN' : null].filter(Boolean).join(' · ')}
        >
          <div className="reactivo">
            <span className="reactivo__texto">
              {p.responsable ? p.responsable + ' · ' : ''}
              {num(p.tProceso) + num(p.tEspera)} min entre proceso y espera. ¿Qué se ha detenido aquí
              en el último año?
            </span>
            <div className="chips">
              <button
                className={p.veredicto === 'conservar' ? 'chip chip--conservar is-activo' : 'chip'}
                onClick={() => editar(p.id, 'veredicto', p.veredicto === 'conservar' ? null : 'conservar')}
              >
                Conservar
              </button>
              <button
                className={p.veredicto === 'eliminar' ? 'chip chip--eliminar is-activo' : 'chip'}
                onClick={() => editar(p.id, 'veredicto', p.veredicto === 'eliminar' ? null : 'eliminar')}
              >
                Eliminar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 'var(--sp-4)' }}>
            <Campo
              label={p.veredicto === 'eliminar' ? 'Por qué sobra' : 'Qué detiene este control'}
              valor={p.motivo}
              onChange={(v) => editar(p.id, 'motivo', v)}
              area
              ancho
              pista="Un caso concreto del último año. Si no hay caso, no hay control: hay costumbre."
            />
          </div>
        </Bloque>
      ))}
    </div>
  );
}

/* =========================================================================
   MR-6 · Diseño del Proceso Futuro
   ========================================================================= */

export function Futuro({ estado, set }) {
  const pasos = pasosVivos(estado.pasos);

  const editar = (id, k, v) =>
    set({ ...estado, pasos: estado.pasos.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });

  const traerVeredictos = () =>
    set({
      ...estado,
      pasos: estado.pasos.map((p) =>
        p.veredicto === 'eliminar' ? { ...p, accion: 'eliminar' } : p
      ),
    });

  const act = totales(estado.pasos);
  const fut = totalesFuturo(estado.pasos);
  const eliminados = pasos.filter((p) => p.accion === 'eliminar').length;
  const pendientes = pasos.filter((p) => p.veredicto === 'eliminar' && p.accion !== 'eliminar').length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Diseño del Proceso Futuro</h2>
        <p className="tool__intro">
          El rediseño no empieza con tecnología: empieza quitando. Sobre cada paso del proceso actual
          se decide una acción, y los tiempos nuevos se capturan solo donde cambian. Lo que no se
          toca, se queda como está.
        </p>
      </header>

      {pasos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-1</span>
          <span>Sin proceso actual no hay proceso futuro que diseñar.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Pasos que quedan"
          valor={pasos.length ? fut.pasos + ' de ' + act.pasos : '—'}
          pie={eliminados ? eliminados + ' paso(s) eliminados' : 'Nada eliminado todavía'}
          ember={eliminados > 0}
        />
        <Cifra
          label="Tiempo total futuro"
          valor={fut.total ? fut.total.toLocaleString('es-MX') + ' min' : '—'}
          pie={act.total ? 'Actual: ' + act.total.toLocaleString('es-MX') + ' min' : 'Captura tiempos'}
        />
        <Cifra
          label="Eficiencia de ciclo"
          valor={fut.total ? fut.eficiencia.toFixed(0) + '%' : '—'}
          pie={act.total ? 'Actual: ' + act.eficiencia.toFixed(0) + '%' : 'Sin base de comparación'}
        />
      </div>

      {pendientes > 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-5</span>
          <span style={{ flex: 1 }}>
            Hay {pendientes} control(es) que juzgaste eliminables y que aquí siguen vivos.
          </span>
          <button className="boton--sec" onClick={traerVeredictos}>
            Aplicar veredictos
          </button>
        </div>
      )}

      <Bloque titulo="Qué se hace con cada paso" meta="ACCIÓN Y TIEMPO NUEVO">
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Paso</th>
                <th>Acción</th>
                <th className="num">Proceso hoy</th>
                <th className="num">Proceso futuro</th>
                <th className="num">Espera hoy</th>
                <th className="num">Espera futura</th>
              </tr>
            </thead>
            <tbody>
              {pasos.map((p, i) => {
                const muerto = p.accion === 'eliminar';
                return (
                  <tr key={p.id} className={muerto ? 'fila-muerta' : ''}>
                    <td className="num">
                      <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                    </td>
                    <td>{p.nombre}</td>
                    <td>
                      <div className="chips">
                        {ACCIONES.map((a) => (
                          <button
                            key={a.id}
                            className={['chip', a.chip, p.accion === a.id ? 'is-activo' : ''].filter(Boolean).join(' ')}
                            onClick={() => editar(p.id, 'accion', a.id)}
                          >
                            {a.corto}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="num">
                      <span className="dato">{p.tProceso || '—'}</span>
                    </td>
                    <td className="num">
                      <input
                        className="tabla__input tabla__input--num"
                        value={muerto ? '' : p.tProcesoFuturo}
                        placeholder={muerto ? '—' : p.tProceso || '0'}
                        disabled={muerto}
                        onChange={(e) => editar(p.id, 'tProcesoFuturo', e.target.value)}
                      />
                    </td>
                    <td className="num">
                      <span className="dato">{p.tEspera || '—'}</span>
                    </td>
                    <td className="num">
                      <input
                        className="tabla__input tabla__input--num"
                        value={muerto ? '' : p.tEsperaFuturo}
                        placeholder={muerto ? '—' : p.tEspera || '0'}
                        disabled={muerto}
                        onChange={(e) => editar(p.id, 'tEsperaFuturo', e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Si dejas vacío el tiempo futuro, se conserva el actual. Los pasos eliminados no cuentan en
          ningún total.
        </p>
      </Bloque>

      <Bloque titulo="Cómo queda el flujo" meta="PROPUESTA">
        <Campo
          label="Descripción del proceso futuro"
          valor={estado.descripcionFuturo}
          onChange={(v) => set({ ...estado, descripcionFuturo: v })}
          area
          ancho
          pista="En qué cambia la forma de trabajar, en lenguaje de piso."
        />
      </Bloque>
    </div>
  );
}

/* =========================================================================
   MR-7 · Comparador Estado Actual vs. Estado Futuro
   ========================================================================= */

export function Comparador({ estado, set }) {
  const act = totales(estado.pasos);
  const fut = totalesFuturo(estado.pasos);
  const vivos = pasosVivos(estado.pasos);
  const c = estado.comparador;

  const campo = (k, v) => set({ ...estado, comparador: { ...c, [k]: v } });

  const costoHora = num(c.costoHora);
  const corridas = num(c.corridasMes);

  const costoAct = ((act.total / 60) * costoHora * corridas) || 0;
  const costoFut = ((fut.total / 60) * costoHora * corridas) || 0;

  const filas = [
    { nombre: 'Número de pasos', a: act.pasos, f: fut.pasos, unidad: '', menorEsMejor: true },
    { nombre: 'Tiempo de proceso', a: act.proc, f: fut.proc, unidad: ' min', menorEsMejor: true },
    { nombre: 'Tiempo de espera', a: act.esp, f: fut.esp, unidad: ' min', menorEsMejor: true },
    { nombre: 'Tiempo total', a: act.total, f: fut.total, unidad: ' min', menorEsMejor: true },
    {
      nombre: 'Transferencias',
      a: vivos.filter((p) => p.transferencia).length,
      f: fut.transferencias,
      unidad: '',
      menorEsMejor: true,
    },
    {
      nombre: 'Autorizaciones',
      a: vivos.filter((p) => p.autorizacion).length,
      f: fut.autorizaciones,
      unidad: '',
      menorEsMejor: true,
    },
    { nombre: 'Errores', a: num(c.erroresActual), f: num(c.erroresFuturo), unidad: '%', menorEsMejor: true },
    { nombre: 'Retrabajo', a: num(c.retrabajoActual), f: num(c.retrabajoFuturo), unidad: '%', menorEsMejor: true },
    { nombre: 'Costo al mes', a: costoAct, f: costoFut, unidad: '$', menorEsMejor: true },
  ];

  const fmt = (v, u) => {
    if (!v) return '—';
    if (u === '$') return moneda(v);
    if (u === '%') return v + '%';
    return v.toLocaleString('es-MX') + u;
  };

  const ahorroAnual = (costoAct - costoFut) * 12;
  const reduccionTiempo = act.total ? ((act.total - fut.total) / act.total) * 100 : 0;
  const reduccionPasos = act.pasos ? ((act.pasos - fut.pasos) / act.pasos) * 100 : 0;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Comparador Estado Actual vs. Estado Futuro</h2>
        <p className="tool__intro">
          La cuenta del rediseño, en una sola pantalla. Pasos, tiempos, transferencias y costo salen
          del mapa y del diseño futuro. Errores y retrabajo se capturan aquí, porque son promesa: hay
          que sostenerlas después con medición.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Ahorro anual estimado"
          valor={ahorroAnual ? moneda(ahorroAnual) : '—'}
          pie="Diferencia de costo, doce meses"
          ember={ahorroAnual > 0}
        />
        <Cifra
          label="Reducción de tiempo"
          valor={reduccionTiempo ? reduccionTiempo.toFixed(0) + '%' : '—'}
          pie={act.total ? act.total.toLocaleString('es-MX') + ' → ' + fut.total.toLocaleString('es-MX') + ' min' : 'Captura tiempos'}
        />
        <Cifra
          label="Reducción de pasos"
          valor={reduccionPasos ? reduccionPasos.toFixed(0) + '%' : '—'}
          pie={act.pasos ? act.pasos + ' → ' + fut.pasos + ' pasos' : 'Captura el mapa'}
        />
      </div>

      <Bloque titulo="Parámetros y promesas" meta="CAPTURA MANUAL">
        <div className="rejilla">
          <Campo label="Costo hora-hombre" valor={c.costoHora} onChange={(v) => campo('costoHora', v)} pista="Para valuar el tiempo del proceso." />
          <Campo label="Corridas al mes" valor={c.corridasMes} onChange={(v) => campo('corridasMes', v)} pista="Cuántas veces corre el proceso." />
          <Campo label="Errores hoy (%)" valor={c.erroresActual} onChange={(v) => campo('erroresActual', v)} pista="Medido, no estimado." />
          <Campo label="Errores esperados (%)" valor={c.erroresFuturo} onChange={(v) => campo('erroresFuturo', v)} pista="La promesa que se va a medir." />
          <Campo label="Retrabajo hoy (%)" valor={c.retrabajoActual} onChange={(v) => campo('retrabajoActual', v)} />
          <Campo label="Retrabajo esperado (%)" valor={c.retrabajoFuturo} onChange={(v) => campo('retrabajoFuturo', v)} />
        </div>
      </Bloque>

      <Bloque titulo="Actual contra futuro" meta="LA CUENTA">
        <div className="comp comp--head">
          <span>Concepto</span>
          <span style={{ textAlign: 'right' }}>Hoy</span>
          <span style={{ textAlign: 'right' }}>Futuro</span>
          <span style={{ textAlign: 'right' }}>Cambio</span>
          <span style={{ textAlign: 'right' }}>Reducción</span>
        </div>

        {filas.map((f) => {
          const delta = f.f - f.a;
          const pct = f.a ? (delta / f.a) * 100 : 0;
          const mejora = delta < 0;
          return (
            <div className="comp" key={f.nombre}>
              <span className="comp__nombre">{f.nombre}</span>
              <span className="comp__valor">{fmt(f.a, f.unidad)}</span>
              <span className={mejora ? 'comp__valor comp__valor--futuro' : 'comp__valor'}>{fmt(f.f, f.unidad)}</span>
              <span className={['comp__delta', delta ? (mejora ? 'comp__delta--baja' : 'comp__delta--sube') : ''].filter(Boolean).join(' ')}>
                {delta ? (delta > 0 ? '+' : '') + fmt(Math.abs(delta), f.unidad).replace('—', '0') : '—'}
              </span>
              <span className={['comp__delta', pct ? (mejora ? 'comp__delta--baja' : 'comp__delta--sube') : ''].filter(Boolean).join(' ')}>
                {pct ? pct.toFixed(0) + '%' : '—'}
              </span>
            </div>
          );
        })}
      </Bloque>

      <Bloque titulo="Cierre" meta="CONCLUSIÓN · DECISIÓN">
        <div className="rejilla">
          <Campo
            label="Qué dice la comparación"
            valor={c.conclusion}
            onChange={(v) => campo('conclusion', v)}
            area
            ancho
            pista="La lectura en una frase, con el número que la sostiene."
          />
          <Campo
            label="Qué se decide"
            valor={c.decision}
            onChange={(v) => campo('decision', v)}
            area
            ancho
            pista="Qué se implementa, quién responde y para cuándo."
          />
        </div>
      </Bloque>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_MR = {
  pasos: [nuevoPaso()],
  demandaDia: '',
  horasDia: '8',
  descripcionFuturo: '',
  comparador: {
    costoHora: '',
    corridasMes: '',
    erroresActual: '',
    erroresFuturo: '',
    retrabajoActual: '',
    retrabajoFuturo: '',
    conclusion: '',
    decision: '',
  },
};
