import { Bloque, Campo, Barra, Cifra } from '../lib/ui.jsx';
import { num, moneda } from '../lib/util.js';
import { potencialDe } from './pc.jsx';
/* =========================================================================
   MÓDULO EJ · EJECUCIÓN Y SEGUIMIENTO
     DP-7 · RP-6 · PC-7 ─→ EJ-1 Portafolio ─→ EJ-2 Acciones ─┬─→ EJ-3 Tablero
     EJ-5 Bloqueos ──────────────────────────────────────────┴─→ EJ-4 Semáforo
     MR-7 · PC-7 ─→ EJ-6 Beneficios          EJ-1 ─→ EJ-7 Plan 90 días
   ========================================================================= */

const nuevaIniciativa = () => ({
  id: 'ini' + Date.now() + Math.random().toString(16).slice(2, 6),
  nombre: '',
  origen: '',
  impacto: 3,
  urgencia: 3,
  viabilidad: 3,
  dueno: '',
  inicio: '',
  fin: '',
  bloque: '30',
});

const nuevaAccionEj = () => ({
  id: 'ac' + Date.now() + Math.random().toString(16).slice(2, 6),
  iniciativaId: '',
  accion: '',
  responsable: '',
  fecha: '',
  recursos: '',
  resultado: '',
  estado: 'pendiente',
});

const nuevoBloqueo = () => ({
  id: 'bl' + Date.now() + Math.random().toString(16).slice(2, 6),
  iniciativaId: '',
  obstaculo: '',
  causa: '',
  responsable: '',
  fechaLimite: '',
  estado: 'abierto',
});

const ESTADOS_ACCION = [
  { id: 'pendiente', nombre: 'Pendiente', pill: 'pill--neutro' },
  { id: 'proceso', nombre: 'En proceso', pill: 'pill--warn' },
  { id: 'hecha', nombre: 'Hecha', pill: 'pill--ok' },
];

const CRITERIOS_EJ = [
  { id: 'impacto', nombre: 'Impacto', pista: 'Cuánto mueve el resultado.' },
  { id: 'urgencia', nombre: 'Urgencia', pista: 'Qué tan pronto se necesita.' },
  { id: 'viabilidad', nombre: 'Viabilidad', pista: 'Qué tan factible con lo que hay.' },
];

const iniciativasVivas = (estado) => estado.iniciativas.filter((i) => i.nombre.trim());
const accionesDe = (estado, iniId) => estado.acciones.filter((a) => a.iniciativaId === iniId && a.accion.trim());
const bloqueosDe = (estado, iniId) => estado.bloqueos.filter((b) => b.iniciativaId === iniId && b.obstaculo.trim() && b.estado === 'abierto');

const HOY = new Date();

function esVencida(fecha) {
  if (!fecha || !fecha.trim()) return false;
  const d = new Date(fecha);
  return !isNaN(d) && d < HOY;
}

function avanceDe(estado, iniId) {
  const acts = accionesDe(estado, iniId);
  if (!acts.length) return { pct: 0, hechas: 0, total: 0, atrasadas: 0 };
  const hechas = acts.filter((a) => a.estado === 'hecha').length;
  const atrasadas = acts.filter((a) => a.estado !== 'hecha' && esVencida(a.fecha)).length;
  return { pct: (hechas / acts.length) * 100, hechas, total: acts.length, atrasadas };
}

/* Semáforo: avance real contra el avance que tocaba por calendario. */
function estadoIniciativa(estado, ini) {
  const av = avanceDe(estado, ini.id);
  const bloq = bloqueosDe(estado, ini.id);
  const bloqVencido = bloq.some((b) => esVencida(b.fechaLimite));

  let esperado = null;
  if (ini.inicio.trim() && ini.fin.trim()) {
    const i = new Date(ini.inicio);
    const f = new Date(ini.fin);
    if (!isNaN(i) && !isNaN(f) && f > i) {
      const total = f - i;
      const corrido = HOY - i;
      esperado = Math.max(0, Math.min(100, (corrido / total) * 100));
    }
  }

  if (bloqVencido) return { tono: 'stop', texto: 'Detenida', av, esperado, bloq: bloq.length };
  if (av.total === 0) return { tono: 'warn', texto: 'Sin plan', av, esperado, bloq: bloq.length };
  if (av.pct >= 100) return { tono: 'ok', texto: 'Terminada', av, esperado, bloq: bloq.length };
  if (bloq.length) return { tono: 'stop', texto: 'Bloqueada', av, esperado, bloq: bloq.length };
  if (av.atrasadas > 0) return { tono: 'stop', texto: 'Atrasada', av, esperado, bloq: bloq.length };
  if (esperado !== null && av.pct < esperado - 15) return { tono: 'warn', texto: 'Rezagada', av, esperado, bloq: bloq.length };
  return { tono: 'ok', texto: 'En tiempo', av, esperado, bloq: bloq.length };
}

/* =========================================================================
   EJ-1 · Portafolio de Iniciativas
   ========================================================================= */

export function Portafolio({ estado, set, otros }) {
  const is = estado.iniciativas;
  const pesos = estado.pesosEj;

  const editar = (id, k, v) => set({ ...estado, iniciativas: is.map((i) => (i.id === id ? { ...i, [k]: v } : i)) });
  const agregar = () => set({ ...estado, iniciativas: [...is, nuevaIniciativa()] });
  const borrar = (id) => {
    if (is.length <= 1) return;
    set({ ...estado, iniciativas: is.filter((i) => i.id !== id) });
  };
  const pesar = (id, v) => set({ ...estado, pesosEj: { ...pesos, [id]: num(v) } });

  /* Candidatas de los módulos anteriores */
  const candidatas = [];
  otros.dp.problemas
    .filter((p) => p.problema.trim())
    .forEach((p) => candidatas.push({ nombre: p.problema, origen: 'DP-7', impacto: p.impacto, urgencia: p.urgencia, viabilidad: p.facilidad, dueno: p.responsable }));
  otros.rp.soluciones
    .filter((s) => s.nombre.trim())
    .forEach((s) => candidatas.push({ nombre: s.nombre, origen: 'RP-6', impacto: s.impacto, urgencia: 3, viabilidad: s.viabilidad, dueno: '' }));
  otros.pc.automatizables
    .filter((a) => a.actividad.trim() && potencialDe(a) >= 55)
    .forEach((a) => candidatas.push({ nombre: 'Automatizar: ' + a.actividad, origen: 'PC-6', impacto: 4, urgencia: 3, viabilidad: Math.round(potencialDe(a) / 20), dueno: '' }));

  const yaEstan = is.map((i) => i.nombre.trim());
  const faltan = candidatas.filter((c) => !yaEstan.includes(c.nombre.trim()));

  const importar = () => {
    const nuevas = faltan.map((c) => ({ ...nuevaIniciativa(), ...c, viabilidad: Math.max(1, Math.min(5, c.viabilidad || 3)) }));
    const vacio = iniciativasVivas(estado).length === 0;
    set({ ...estado, iniciativas: vacio ? nuevas : [...is, ...nuevas] });
  };

  const suma = CRITERIOS_EJ.reduce((a, c) => a + (pesos[c.id] || 0), 0);
  const orden = iniciativasVivas(estado)
    .map((i) => {
      const s = CRITERIOS_EJ.reduce((a, c) => a + num(i[c.id]) * (pesos[c.id] || 0), 0);
      return { ...i, score: suma ? s / suma : 0 };
    })
    .sort((a, b) => b.score - a.score);

  const sinDueno = orden.filter((i) => !i.dueno.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Portafolio de Iniciativas</h2>
        <p className="tool__intro">
          Todo lo que se quiere mejorar, en una sola lista y con un solo criterio. Aquí es donde se
          descubre que hay veintitantos proyectos abiertos y capacidad para tres. El portafolio no
          sirve para arrancar más cosas: sirve para decidir cuáles no.
        </p>
      </header>

      {faltan.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-7 · RP-6 · PC-6</span>
          <span style={{ flex: 1 }}>
            Hay {faltan.length} candidata(s) en los módulos anteriores que todavía no están en el
            portafolio.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer candidatas
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra label="Iniciativas" valor={orden.length || '—'} pie={orden.length > 5 ? 'Van más de cinco: revisa capacidad real' : 'En el portafolio'} ember={orden.length > 5} />
        <Cifra
          label="La primera"
          valor={orden.length && orden[0].score ? orden[0].score.toFixed(2) : '—'}
          pie={orden.length ? orden[0].nombre : 'Captura iniciativas'}
        />
        <Cifra
          label="Sin dueño"
          valor={sinDueno || '0'}
          pie={sinDueno ? 'Una iniciativa sin dueño no avanza' : 'Todas con responsable'}
          ember={sinDueno > 0}
        />
      </div>

      <Bloque titulo="Peso de cada criterio" meta={'SUMA ' + suma + '%'}>
        <div className="rejilla">
          {CRITERIOS_EJ.map((c) => (
            <div className="campo" key={c.id}>
              <label className="campo__label">{c.nombre}</label>
              <input className="campo__input" type="number" min="0" max="100" value={pesos[c.id]} onChange={(e) => pesar(c.id, e.target.value)} />
              <span className="campo__pista">{c.pista}</span>
            </div>
          ))}
        </div>
      </Bloque>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Iniciativa</th>
                <th>Origen</th>
                {CRITERIOS_EJ.map((c) => (
                  <th className="num" key={c.id}>
                    {c.nombre}
                  </th>
                ))}
                <th className="num">Score</th>
                <th>Dueño</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {is.map((i) => {
                const o = orden.find((x) => x.id === i.id);
                const pos = orden.findIndex((x) => x.id === i.id);
                return (
                  <tr key={i.id} className={o && pos < 3 ? 'is-lider' : ''}>
                    <td className="num">
                      <span className="dato">{o ? String(pos + 1).padStart(2, '0') : '—'}</span>
                    </td>
                    <td>
                      <input className="tabla__input" value={i.nombre} placeholder="Qué se va a mejorar" onChange={(e) => editar(i.id, 'nombre', e.target.value)} />
                    </td>
                    <td>
                      <span className="dato">{i.origen || '—'}</span>
                    </td>
                    {CRITERIOS_EJ.map((c) => (
                      <td className="num" key={c.id}>
                        <input className="tabla__input tabla__input--num" type="number" min="1" max="5" value={i[c.id]} onChange={(e) => editar(i.id, c.id, num(e.target.value))} />
                      </td>
                    ))}
                    <td className="num">
                      <span className="dato dato--fuerte">{o ? o.score.toFixed(2) : '—'}</span>
                    </td>
                    <td>
                      <input className="tabla__input" value={i.dueno} placeholder="Quién" onChange={(e) => editar(i.id, 'dueno', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={i.inicio} placeholder="AAAA-MM-DD" onChange={(e) => editar(i.id, 'inicio', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={i.fin} placeholder="AAAA-MM-DD" onChange={(e) => editar(i.id, 'fin', e.target.value)} />
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(i.id)} disabled={is.length <= 1} title="Quitar">
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
          <button className="boton--sec" onClick={agregar}>
            + Agregar iniciativa
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   EJ-2 · Plan de Acción
   ========================================================================= */

export function PlanAccion({ estado, set, otros }) {
  const as = estado.acciones;
  const vivas = iniciativasVivas(estado);

  const editar = (id, k, v) => set({ ...estado, acciones: as.map((a) => (a.id === id ? { ...a, [k]: v } : a)) });
  const agregar = () => set({ ...estado, acciones: [...as, nuevaAccionEj()] });
  const borrar = (id) => {
    if (as.length <= 1) return;
    set({ ...estado, acciones: as.filter((a) => a.id !== id) });
  };

  const delA3 = otros.rp.a3.plan.filter((p) => p.que.trim());
  const yaEstan = as.map((a) => a.accion.trim());
  const faltan = delA3.filter((p) => !yaEstan.includes(p.que.trim()));

  const importar = () => {
    const nuevas = faltan.map((p) => ({
      ...nuevaAccionEj(),
      id: 'ac' + p.id,
      accion: p.que,
      responsable: p.quien,
      fecha: p.cuando,
      iniciativaId: vivas.length ? vivas[0].id : '',
    }));
    const vacio = as.filter((a) => a.accion.trim()).length === 0;
    set({ ...estado, acciones: vacio ? nuevas : [...as, ...nuevas] });
  };

  const llenas = as.filter((a) => a.accion.trim());
  const sinFecha = llenas.filter((a) => !a.fecha.trim()).length;
  const sinIniciativa = llenas.filter((a) => !a.iniciativaId).length;
  const vencidas = llenas.filter((a) => a.estado !== 'hecha' && esVencida(a.fecha)).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Plan de Acción</h2>
        <p className="tool__intro">
          Acción, responsable y fecha. Sin las tres, no es plan: es intención. Una acción de la que
          responden dos personas no la hace ninguna, y una sin fecha se hace cuando ya no importe.
        </p>
      </header>

      {faltan.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">RP-7</span>
          <span style={{ flex: 1 }}>
            El A3 tiene {faltan.length} acción(es) que no están aquí.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer del A3
          </button>
        </div>
      )}

      {vivas.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">EJ-1</span>
          <span>No hay iniciativas en el portafolio. Captúralas primero para poder colgar acciones de ellas.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra label="Acciones" valor={llenas.length || '—'} pie={llenas.filter((a) => a.estado === 'hecha').length + ' terminadas'} ember={llenas.length > 0} />
        <Cifra
          label="Vencidas"
          valor={vencidas || '0'}
          pie={vencidas ? 'Pasó la fecha y no están hechas' : 'Ninguna fuera de fecha'}
          ember={vencidas > 0}
        />
        <Cifra
          label="Sin fecha o sin iniciativa"
          valor={sinFecha + sinIniciativa || '0'}
          pie={sinFecha + sinIniciativa ? sinFecha + ' sin fecha · ' + sinIniciativa + ' sueltas' : 'Todas completas'}
          ember={sinFecha + sinIniciativa > 0}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Iniciativa</th>
                <th>Acción</th>
                <th>Responsable</th>
                <th>Fecha compromiso</th>
                <th>Recursos</th>
                <th>Resultado esperado</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {as.map((a) => {
                const tarde = a.estado !== 'hecha' && esVencida(a.fecha);
                return (
                  <tr key={a.id} className={tarde ? 'is-lider' : ''}>
                    <td>
                      <select className="tabla__select" value={a.iniciativaId} onChange={(e) => editar(a.id, 'iniciativaId', e.target.value)}>
                        <option value="">Sin asignar</option>
                        {vivas.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="tabla__input" value={a.accion} placeholder="Qué se hace" onChange={(e) => editar(a.id, 'accion', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={a.responsable} placeholder="Una persona" onChange={(e) => editar(a.id, 'responsable', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={a.fecha} placeholder="AAAA-MM-DD" onChange={(e) => editar(a.id, 'fecha', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={a.recursos} placeholder="Qué se necesita" onChange={(e) => editar(a.id, 'recursos', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={a.resultado} placeholder="Cómo se ve terminado" onChange={(e) => editar(a.id, 'resultado', e.target.value)} />
                    </td>
                    <td>
                      <select className="tabla__select" value={a.estado} onChange={(e) => editar(a.id, 'estado', e.target.value)}>
                        {ESTADOS_ACCION.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(a.id)} disabled={as.length <= 1} title="Quitar">
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
          <button className="boton--sec" onClick={agregar}>
            + Agregar acción
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   EJ-3 · Tablero de Ejecución
   ========================================================================= */

export function Tablero({ estado }) {
  const vivas = iniciativasVivas(estado);

  const fichas = vivas.map((i) => {
    const e = estadoIniciativa(estado, i);
    const acts = accionesDe(estado, i.id);
    const proxima = acts
      .filter((a) => a.estado !== 'hecha' && a.fecha.trim())
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
    return { ...i, e, proxima, acts };
  });

  const avanceGlobal = fichas.length ? fichas.reduce((a, f) => a + f.e.av.pct, 0) / fichas.length : 0;
  const atrasadas = fichas.filter((f) => f.e.av.atrasadas > 0).length;
  const bloqueadas = fichas.filter((f) => f.e.bloq > 0).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Tablero de Ejecución</h2>
        <p className="tool__intro">
          Dónde va cada iniciativa, sin adornos. El avance no se declara: se calcula con las acciones
          que de verdad están terminadas. Y el estado se compara contra el calendario, no contra la
          sensación de que se va bien.
        </p>
      </header>

      {vivas.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">EJ-1</span>
          <span>Sin iniciativas no hay nada que seguir.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Avance global"
          valor={fichas.length ? avanceGlobal.toFixed(0) + '%' : '—'}
          pie={fichas.length ? 'Promedio de ' + fichas.length + ' iniciativa(s)' : 'Captura iniciativas'}
          ember={avanceGlobal > 0}
        />
        <Cifra
          label="Con acciones atrasadas"
          valor={atrasadas || '0'}
          pie={atrasadas ? 'Fecha vencida y sin terminar' : 'Ninguna con atrasos'}
          ember={atrasadas > 0}
        />
        <Cifra
          label="Bloqueadas"
          valor={bloqueadas || '0'}
          pie={bloqueadas ? 'No avanzan hasta destrabarlas' : 'Sin bloqueos activos'}
          ember={bloqueadas > 0}
        />
      </div>

      {fichas.length > 0 && (
        <Bloque titulo="Iniciativas en curso" meta={fichas.length + ' EN EL TABLERO'}>
          <div className="tablero-ej">
            {fichas.map((f) => (
              <div className={'tarjeta-ini tarjeta-ini--' + (f.e.tono || 'warn')} key={f.id}>
                <div className="tarjeta-ini__head">
                  <span className="tarjeta-ini__nombre">{f.nombre}</span>
                  <span className={'pill pill--' + (f.e.tono === 'ok' ? 'ok' : f.e.tono === 'warn' ? 'warn' : 'stop')}>{f.e.texto}</span>
                </div>

                <span className="tarjeta-ini__dueno">{f.dueno || 'Sin dueño'}</span>

                <div className="tarjeta-ini__avance">
                  <span className="tarjeta-ini__pct">{f.e.av.pct.toFixed(0)}%</span>
                  <Barra pct={f.e.av.pct} tono={f.e.tono} />
                </div>

                <div className="tarjeta-ini__linea">
                  <span>
                    {f.e.av.hechas}/{f.e.av.total} acciones
                  </span>
                  {f.e.esperado !== null && <span>Tocaba: {f.e.esperado.toFixed(0)}%</span>}
                </div>

                {(f.e.av.atrasadas > 0 || f.e.bloq > 0) && (
                  <div className="tarjeta-ini__linea">
                    {f.e.av.atrasadas > 0 && <span style={{ color: 'var(--stop)' }}>{f.e.av.atrasadas} atrasada(s)</span>}
                    {f.e.bloq > 0 && <span style={{ color: 'var(--stop)' }}>{f.e.bloq} bloqueo(s)</span>}
                  </div>
                )}

                <div className="tarjeta-ini__proxima">
                  {f.proxima ? (
                    <>
                      <strong>Sigue:</strong> {f.proxima.accion}
                      {f.proxima.responsable ? ' · ' + f.proxima.responsable : ''}
                      {f.proxima.fecha ? ' · ' + f.proxima.fecha : ''}
                    </>
                  ) : f.e.av.total === 0 ? (
                    'Sin acciones capturadas. Esta iniciativa no va a moverse sola.'
                  ) : (
                    'Todas las acciones terminadas.'
                  )}
                </div>
              </div>
            ))}
          </div>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   EJ-4 · Semáforo de Cumplimiento
   ========================================================================= */

export function Semaforo({ estado }) {
  const vivas = iniciativasVivas(estado);
  const fichas = vivas.map((i) => ({ ...i, e: estadoIniciativa(estado, i) }));

  const verdes = fichas.filter((f) => f.e.tono === 'ok');
  const amarillas = fichas.filter((f) => f.e.tono === 'warn');
  const rojas = fichas.filter((f) => f.e.tono === 'stop');

  const acciones = estado.acciones.filter((a) => a.accion.trim());
  const aHechas = acciones.filter((a) => a.estado === 'hecha').length;
  const aTarde = acciones.filter((a) => a.estado !== 'hecha' && esVencida(a.fecha)).length;
  const aTiempo = acciones.length - aHechas - aTarde;

  const cumplimiento = acciones.length ? (aHechas / acciones.length) * 100 : 0;

  const grupos = [
    { tono: 'ok', nombre: 'Verde', desc: 'En tiempo o terminadas.', lista: verdes },
    { tono: 'warn', nombre: 'Amarillo', desc: 'Rezagadas o sin plan de acción.', lista: amarillas },
    { tono: 'stop', nombre: 'Rojo', desc: 'Atrasadas, bloqueadas o detenidas.', lista: rojas },
  ];

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Semáforo de Cumplimiento</h2>
        <p className="tool__intro">
          El color no lo pone quien reporta: lo calcula el sistema con avance, fechas y bloqueos. Un
          tablero donde todo está en verde y los resultados no llegan significa que el semáforo se
          negocia. Aquí no se puede.
        </p>
      </header>

      {vivas.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">EJ-1</span>
          <span>Sin iniciativas no hay cumplimiento que medir.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Cumplimiento de acciones"
          valor={acciones.length ? cumplimiento.toFixed(0) + '%' : '—'}
          pie={acciones.length ? aHechas + ' hechas · ' + aTiempo + ' en curso · ' + aTarde + ' vencidas' : 'Captura acciones'}
          ember={cumplimiento >= 80}
        />
        <Cifra
          label="Iniciativas en rojo"
          valor={rojas.length || '0'}
          pie={rojas.length ? 'Requieren decisión, no reporte' : 'Ninguna detenida'}
          ember={rojas.length > 0}
        />
        <Cifra
          label="Reparto"
          valor={fichas.length ? verdes.length + ' · ' + amarillas.length + ' · ' + rojas.length : '—'}
          pie="Verde · Amarillo · Rojo"
        />
      </div>

      {grupos.map((g) => (
        <Bloque key={g.tono} titulo={g.nombre} meta={g.lista.length + ' INICIATIVA(S)'}>
          <p className="nota" style={{ marginBottom: g.lista.length ? 'var(--sp-4)' : 0 }}>
            {g.desc}
          </p>
          {g.lista.map((f) => (
            <div className="marcador" key={f.id}>
              <span className="marcador__nombre">
                {f.nombre}
                {f.dueno ? ' · ' + f.dueno : ''}
              </span>
              <Barra pct={f.e.av.pct} tono={g.tono} />
              <span className="marcador__valor">{f.e.av.pct.toFixed(0)}%</span>
            </div>
          ))}
        </Bloque>
      ))}
    </div>
  );
}

/* =========================================================================
   EJ-5 · Gestión de Bloqueos
   ========================================================================= */

export function Bloqueos({ estado, set }) {
  const bs = estado.bloqueos;
  const vivas = iniciativasVivas(estado);

  const editar = (id, k, v) => set({ ...estado, bloqueos: bs.map((b) => (b.id === id ? { ...b, [k]: v } : b)) });
  const agregar = () => set({ ...estado, bloqueos: [...bs, nuevoBloqueo()] });
  const borrar = (id) => {
    if (bs.length <= 1) return;
    set({ ...estado, bloqueos: bs.filter((b) => b.id !== id) });
  };

  const llenos = bs.filter((b) => b.obstaculo.trim());
  const abiertos = llenos.filter((b) => b.estado === 'abierto');
  const vencidos = abiertos.filter((b) => esVencida(b.fechaLimite));
  const sinDueno = abiertos.filter((b) => !b.responsable.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Gestión de Bloqueos</h2>
        <p className="tool__intro">
          Un bloqueo sin responsable de destrabarlo se queda ahí para siempre, y de paso justifica que
          la iniciativa no avance. Cada obstáculo necesita nombre, causa, dueño y fecha límite. Y casi
          siempre el dueño está un nivel arriba de quien lo reporta.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Bloqueos abiertos"
          valor={abiertos.length || '0'}
          pie={abiertos.length ? 'Frenando iniciativas ahora mismo' : 'Nada detenido'}
          ember={abiertos.length > 0}
        />
        <Cifra
          label="Vencidos"
          valor={vencidos.length || '0'}
          pie={vencidos.length ? 'Pasó la fecha límite y siguen abiertos' : 'Ninguno fuera de plazo'}
          ember={vencidos.length > 0}
        />
        <Cifra
          label="Sin responsable"
          valor={sinDueno || '0'}
          pie={sinDueno ? 'Nadie los está destrabando' : 'Todos con dueño asignado'}
          ember={sinDueno > 0}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Iniciativa</th>
                <th>Obstáculo</th>
                <th>Causa</th>
                <th>Quién lo destraba</th>
                <th>Fecha límite</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bs.map((b) => {
                const tarde = b.estado === 'abierto' && esVencida(b.fechaLimite);
                return (
                  <tr key={b.id} className={tarde ? 'is-lider' : ''}>
                    <td>
                      <select className="tabla__select" value={b.iniciativaId} onChange={(e) => editar(b.id, 'iniciativaId', e.target.value)}>
                        <option value="">Sin asignar</option>
                        {vivas.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="tabla__input" value={b.obstaculo} placeholder="Qué está frenando" onChange={(e) => editar(b.id, 'obstaculo', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={b.causa} placeholder="Por qué existe" onChange={(e) => editar(b.id, 'causa', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={b.responsable} placeholder="Quién puede resolverlo" onChange={(e) => editar(b.id, 'responsable', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={b.fechaLimite} placeholder="AAAA-MM-DD" onChange={(e) => editar(b.id, 'fechaLimite', e.target.value)} />
                    </td>
                    <td>
                      <select className="tabla__select" value={b.estado} onChange={(e) => editar(b.id, 'estado', e.target.value)}>
                        <option value="abierto">Abierto</option>
                        <option value="resuelto">Resuelto</option>
                      </select>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(b.id)} disabled={bs.length <= 1} title="Quitar">
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
          <button className="boton--sec" onClick={agregar}>
            + Agregar bloqueo
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Un bloqueo abierto pone su iniciativa en rojo en el semáforo. Si además vence, la marca
          como detenida.
        </p>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   EJ-6 · Seguimiento de Beneficios
   ========================================================================= */

const DIMENSIONES_BENEFICIO = [
  { id: 'ahorro', nombre: 'Ahorro', unidad: 'pesos al año', pista: 'Dinero que deja de gastarse.' },
  { id: 'tiempo', nombre: 'Tiempo', unidad: 'minutos por ciclo', pista: 'Reducción del tiempo total del proceso.' },
  { id: 'productividad', nombre: 'Productividad', unidad: '% de aumento', pista: 'Más salida con los mismos recursos.' },
  { id: 'calidad', nombre: 'Calidad', unidad: '% de errores', pista: 'Reducción de errores o retrabajo.' },
  { id: 'capacidad', nombre: 'Capacidad liberada', unidad: 'horas al mes', pista: 'Horas que quedan disponibles para otra cosa.' },
];

export function Beneficios({ estado, set, otros }) {
  const b = estado.beneficios;
  const editar = (dim, k, v) => set({ ...estado, beneficios: { ...b, [dim]: { ...b[dim], [k]: v } } });

  /* Los esperados ya fueron calculados en otros módulos. */
  const comp = otros.mr.comparador;
  const actTotal = otros.mr.pasos.filter((p) => p.nombre.trim()).reduce((a, p) => a + num(p.tProceso) + num(p.tEspera), 0);
  const futTotal = otros.mr.pasos
    .filter((p) => p.nombre.trim() && p.accion !== 'eliminar')
    .reduce((a, p) => a + (p.tProcesoFuturo !== '' ? num(p.tProcesoFuturo) : num(p.tProceso)) + (p.tEsperaFuturo !== '' ? num(p.tEsperaFuturo) : num(p.tEspera)), 0);
  const ahorroMr = actTotal && num(comp.costoHora) && num(comp.corridasMes) ? (((actTotal - futTotal) / 60) * num(comp.costoHora) * num(comp.corridasMes)) * 12 : 0;
  const horasPc = otros.pc.automatizables
    .filter((a) => a.actividad.trim())
    .reduce((a, x) => a + (num(x.horasMes) * potencialDe(x)) / 100, 0) * (num(otros.pc.simulador.adopcion) / 100);
  const calidadMr = num(comp.erroresActual) && num(comp.erroresFuturo) !== null ? num(comp.erroresFuturo) : 0;

  const sugeridos = {
    ahorro: ahorroMr,
    tiempo: actTotal - futTotal,
    productividad: 0,
    calidad: calidadMr,
    capacidad: horasPc,
  };

  const hayQueTraer = ahorroMr > 0 || actTotal - futTotal > 0 || horasPc > 0;

  const traer = () =>
    set({
      ...estado,
      beneficios: DIMENSIONES_BENEFICIO.reduce((acc, d) => {
        const s = sugeridos[d.id];
        return { ...acc, [d.id]: { ...b[d.id], esperado: s ? String(Math.round(s)) : b[d.id].esperado } };
      }, {}),
    });

  const filas = DIMENSIONES_BENEFICIO.map((d) => {
    const esp = num(b[d.id].esperado);
    const real = num(b[d.id].real);
    const tiene = b[d.id].esperado.trim() !== '' && b[d.id].real.trim() !== '';
    const logro = tiene && esp ? (real / esp) * 100 : 0;
    return { ...d, esp, real, tiene, logro };
  });

  const conDato = filas.filter((f) => f.tiene);
  const logroPromedio = conDato.length ? conDato.reduce((a, f) => a + f.logro, 0) / conDato.length : 0;
  const cumplidas = conDato.filter((f) => f.logro >= 100).length;

  const tono = (l) => (l >= 100 ? 'ok' : l >= 70 ? 'warn' : 'stop');

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Seguimiento de Beneficios</h2>
        <p className="tool__intro">
          Lo prometido contra lo entregado. Esta es la pestaña que casi nadie llena y la única que
          responde si todo el esfuerzo sirvió. Un proyecto que se ejecuta al 100% y entrega el 30% del
          beneficio no fue un éxito de ejecución: fue un error de diagnóstico.
        </p>
      </header>

      {hayQueTraer && (
        <div className="aviso">
          <span className="aviso__clave">MR-7 · PC-7</span>
          <span style={{ flex: 1 }}>
            El comparador y el simulador ya calcularon beneficios esperados. Tráelos como promesa a
            perseguir.
          </span>
          <button className="boton--sec" onClick={traer}>
            Traer esperados
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Logro promedio"
          valor={conDato.length ? logroPromedio.toFixed(0) + '%' : '—'}
          pie={conDato.length ? 'De lo prometido en ' + conDato.length + ' dimensión(es)' : 'Captura esperado y real'}
          ember={logroPromedio >= 100}
        />
        <Cifra
          label="Dimensiones cumplidas"
          valor={conDato.length ? cumplidas + '/' + conDato.length : '—'}
          pie="Al 100% o más de lo prometido"
        />
        <Cifra
          label="Ahorro real"
          valor={b.ahorro.real.trim() ? moneda(num(b.ahorro.real)) : '—'}
          pie={b.ahorro.esperado.trim() ? 'Prometido: ' + moneda(num(b.ahorro.esperado)) : 'Sin promesa registrada'}
        />
      </div>

      <Bloque titulo="Prometido contra entregado" meta="CINCO DIMENSIONES">
        <div className="beneficio beneficio--head">
          <span>Dimensión</span>
          <span style={{ textAlign: 'right' }}>Esperado</span>
          <span style={{ textAlign: 'right' }}>Real</span>
          <span style={{ textAlign: 'right' }}>Logro</span>
          <span>Avance</span>
        </div>

        {filas.map((f) => (
          <div className="beneficio" key={f.id}>
            <div>
              <div className="beneficio__dim">{f.nombre}</div>
              <div className="beneficio__pista">{f.unidad}</div>
            </div>
            <input
              className="tabla__input tabla__input--num"
              value={b[f.id].esperado}
              placeholder="0"
              onChange={(e) => editar(f.id, 'esperado', e.target.value)}
            />
            <input
              className="tabla__input tabla__input--num"
              value={b[f.id].real}
              placeholder="0"
              onChange={(e) => editar(f.id, 'real', e.target.value)}
            />
            <span className={'beneficio__logro' + (f.tiene ? ' beneficio__logro--' + tono(f.logro) : '')}>
              {f.tiene ? f.logro.toFixed(0) + '%' : '—'}
            </span>
            <Barra pct={Math.min(100, f.logro)} tono={f.tiene ? tono(f.logro) : null} />
          </div>
        ))}

        <p className="nota" style={{ marginTop: 'var(--sp-4)' }}>
          En calidad y errores, el esperado es la cifra objetivo, no la reducción. El logro compara
          real contra esperado en la misma unidad.
        </p>
      </Bloque>

      <Bloque titulo="Lectura" meta="QUÉ SIGNIFICA">
        <Campo
          label="Qué explica la diferencia"
          valor={estado.lecturaBeneficios}
          onChange={(v) => set({ ...estado, lecturaBeneficios: v })}
          area
          ancho
          pista="Si se entregó menos de lo prometido: fue diagnóstico, ejecución o supuesto. Nombra cuál."
        />
      </Bloque>
    </div>
  );
}

/* =========================================================================
   EJ-7 · Plan de Transformación a 90 Días
   ========================================================================= */

const BLOQUES_90 = [
  { id: '30', rango: 'Días 1 a 30', foco: 'Arrancar y ganar', pista: 'Lo que se puede hacer sin presupuesto y se nota rápido.' },
  { id: '60', rango: 'Días 31 a 60', foco: 'Rediseñar', pista: 'Lo que exige cambiar la forma de trabajar.' },
  { id: '90', rango: 'Días 61 a 90', foco: 'Estandarizar', pista: 'Lo que asegura que la mejora se quede.' },
];

export function Plan90({ estado, set, proceso, otros }) {
  const vivas = iniciativasVivas(estado);
  const p = estado.plan90;

  const campo = (k, v) => set({ ...estado, plan90: { ...p, [k]: v } });
  const asignar = (id, bloque) => set({ ...estado, iniciativas: estado.iniciativas.map((i) => (i.id === id ? { ...i, bloque } : i)) });

  const kpis = otros.ie.kpis.filter((k) => k.nombre.trim());
  const enBloque = (b) => vivas.filter((i) => i.bloque === b);
  const sinAsignar = vivas.filter((i) => !BLOQUES_90.some((b) => b.id === i.bloque));

  const total = vivas.length;
  const conDueno = vivas.filter((i) => i.dueno.trim()).length;
  const acciones = estado.acciones.filter((a) => a.accion.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Plan de Transformación a 90 Días</h2>
        <p className="tool__intro">
          Noventa días porque es lo que aguanta la atención de una organización sin que el proyecto se
          diluya. Tres bloques con lógica propia: primero se gana algo visible, luego se rediseña, al
          final se amarra. Si todo está en el último bloque, no hay plan: hay buenas intenciones con
          fecha lejana.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Iniciativas en el plan"
          valor={total || '—'}
          pie={sinAsignar.length ? sinAsignar.length + ' sin bloque asignado' : total ? 'Todas ubicadas en el calendario' : 'Captura el portafolio'}
          ember={total > 0}
        />
        <Cifra
          label="Con dueño"
          valor={total ? conDueno + '/' + total : '—'}
          pie={conDueno < total ? 'Las que no tienen no van a pasar' : 'Todas con responsable'}
          ember={total > 0 && conDueno < total}
        />
        <Cifra label="Acciones comprometidas" valor={acciones || '—'} pie="En los tres bloques" />
      </div>

      <Bloque titulo="Encabezado del plan" meta={proceso ? proceso.nombre.toUpperCase() : 'SIN PROCESO'}>
        <div className="rejilla">
          <Campo label="Fecha de arranque" valor={p.inicio} onChange={(v) => campo('inicio', v)} pista="El día uno de los noventa." />
          <Campo label="Patrocinador" valor={p.patrocinador} onChange={(v) => campo('patrocinador', v)} pista="Quien destraba y responde arriba. No el que ejecuta." />
          <Campo label="Ritmo de revisión" valor={p.ritmo} onChange={(v) => campo('ritmo', v)} pista="Cada cuándo se revisa y con quién. Semanal de treinta minutos funciona mejor que mensual de dos horas." />
          <Campo
            label="La promesa de los 90 días"
            valor={p.promesa}
            onChange={(v) => campo('promesa', v)}
            area
            ancho
            pista="Una sola frase con número: de cuánto a cuánto y para cuándo."
          />
        </div>
      </Bloque>

      <Bloque titulo="Los tres bloques" meta="ASIGNACIÓN">
        <div className="plan90">
          {BLOQUES_90.map((b) => {
            const lista = enBloque(b.id);
            return (
              <div className="plan90__col" key={b.id}>
                <div className="plan90__head">
                  <div>
                    <div className="plan90__rango">{b.rango}</div>
                    <div className="plan90__foco">{b.foco}</div>
                  </div>
                  <span className="sipoc__cuenta">{lista.length}</span>
                </div>
                <p className="sipoc__pista">{b.pista}</p>

                {lista.length ? (
                  lista.map((i) => {
                    const e = estadoIniciativa(estado, i);
                    return (
                      <div className="plan90__ficha" key={i.id}>
                        <div className="plan90__nombre">{i.nombre}</div>
                        <div className="plan90__meta">
                          <span>{i.dueno || 'Sin dueño'}</span>
                          <span>{e.av.total ? e.av.hechas + '/' + e.av.total : 'sin acciones'}</span>
                        </div>
                        <Barra pct={e.av.pct} tono={e.tono} />
                      </div>
                    );
                  })
                ) : (
                  <span className="plan90__vacio">Sin iniciativas en este bloque.</span>
                )}
              </div>
            );
          })}
        </div>
      </Bloque>

      {vivas.length > 0 && (
        <Bloque titulo="En qué bloque va cada una" meta="DECIDE EL ORDEN">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Iniciativa</th>
                  <th>Dueño</th>
                  <th>Bloque</th>
                  <th>Estado</th>
                  <th className="num">Avance</th>
                </tr>
              </thead>
              <tbody>
                {vivas.map((i) => {
                  const e = estadoIniciativa(estado, i);
                  return (
                    <tr key={i.id}>
                      <td>
                        <span className="dato dato--fuerte">{i.nombre}</span>
                      </td>
                      <td>
                        <span className="dato">{i.dueno || '—'}</span>
                      </td>
                      <td>
                        <select className="tabla__select" value={i.bloque} onChange={(e2) => asignar(i.id, e2.target.value)}>
                          {BLOQUES_90.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.rango}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={'pill pill--' + (e.tono === 'ok' ? 'ok' : e.tono === 'warn' ? 'warn' : 'stop')}>{e.texto}</span>
                      </td>
                      <td className="num">
                        <span className="dato dato--fuerte">{e.av.pct.toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Bloque>
      )}

      {kpis.length > 0 && (
        <Bloque titulo="Indicadores que se revisan" meta="DESDE EL MÓDULO DE INDICADORES">
          {kpis.slice(0, 6).map((k) => {
            const ult = k.lecturas.length ? k.lecturas[k.lecturas.length - 1] : null;
            return (
              <div className="marcador" key={k.id}>
                <span className="marcador__nombre">
                  {k.nombre}
                  {k.responsable ? ' · ' + k.responsable : ''}
                </span>
                <span className="dato" style={{ minWidth: 130, textAlign: 'right' }}>
                  {ult ? ult.valor + ' ' + k.unidad : 'sin lectura'}
                  {k.meta.trim() ? ' → ' + k.meta + ' ' + k.unidad : ''}
                </span>
              </div>
            );
          })}
        </Bloque>
      )}

      <Bloque titulo="Cierre" meta="CONCLUSIÓN · DECISIÓN · ELIMINACIÓN">
        <div className="rejilla">
          <Campo label="Conclusión" valor={p.conclusion} onChange={(v) => campo('conclusion', v)} area ancho pista="Qué se encontró, en una frase con número." />
          <Campo label="Decisión" valor={p.decision} onChange={(v) => campo('decision', v)} area ancho pista="Qué se hace en estos noventa días. Tres cosas, no diez." />
          <Campo label="Eliminación" valor={p.eliminacion} onChange={(v) => campo('eliminacion', v)} area ancho pista="Qué se deja de hacer para liberar el tiempo de esas tres." />
        </div>
      </Bloque>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_EJ = {
  iniciativas: [nuevaIniciativa()],
  acciones: [nuevaAccionEj()],
  bloqueos: [nuevoBloqueo()],
  beneficios: DIMENSIONES_BENEFICIO.reduce((a, d) => ({ ...a, [d.id]: { esperado: '', real: '' } }), {}),
  lecturaBeneficios: '',
  pesosEj: { impacto: 45, urgencia: 25, viabilidad: 30 },
  plan90: { inicio: '', patrocinador: '', ritmo: '', promesa: '', conclusion: '', decision: '', eliminacion: '' },
};
