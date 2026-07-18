import { Bloque, Campo, Escala, Barra, Cifra, AvisoProceso, MiniLista } from '../lib/ui.jsx';
import { num, moneda, nuevoItem } from '../lib/util.js';
/* =========================================================================
   MÓDULO DP · DIAGNÓSTICO DE PROCESOS
   Siete pestañas encadenadas:
     DP-1 SIPOC ─ etapas ─→ DP-2 Inventario ─ actividades ─→ DP-3 Valor
     DP-3 tiempo NVA ─→ DP-6 Costo
     DP-5 Problemas ─→ DP-7 Priorización
   ========================================================================= */

/* =========================================================================
   DP-1 · SIPOC Inteligente
   ========================================================================= */

const COLUMNAS_SIPOC = [
  { id: 'proveedores', inicial: 'S', titulo: 'Proveedores', pista: 'Quién entrega lo que el proceso necesita.', ph: 'Proveedor' },
  { id: 'entradas', inicial: 'I', titulo: 'Entradas', pista: 'Qué recibe el proceso para poder correr.', ph: 'Entrada' },
  { id: 'etapas', inicial: 'P', titulo: 'Etapas', pista: 'Los pasos mayores, de 4 a 7. No el detalle.', ph: 'Etapa' },
  { id: 'salidas', inicial: 'O', titulo: 'Salidas', pista: 'Qué produce el proceso al terminar.', ph: 'Salida' },
  { id: 'clientes', inicial: 'C', titulo: 'Clientes', pista: 'Quién recibe cada salida.', ph: 'Cliente' },
];

export function Sipoc({ estado, set, proceso }) {
  const s = estado.sipoc;

  const guardar = (col, items) => set({ ...estado, sipoc: { ...s, [col]: items } });

  const onUpdate = (col) => (id, text) =>
    guardar(col, s[col].map((i) => (i.id === id ? { ...i, text } : i)));
  const onAdd = (col) => () => guardar(col, [...s[col], nuevoItem()]);
  const onRemove = (col) => (id) => {
    if (s[col].length <= 1) return;
    guardar(col, s[col].filter((i) => i.id !== id));
  };

  const lleno = (col) => s[col].filter((i) => i.text.trim()).length;
  const columnasListas = COLUMNAS_SIPOC.filter((c) => lleno(c.id) > 0).length;

  const etapas = lleno('etapas');
  const desbalance = lleno('entradas') > 0 && lleno('proveedores') === 0;
  const sinCliente = lleno('salidas') > 0 && lleno('clientes') === 0;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">SIPOC Inteligente</h2>
        <p className="tool__intro">
          El proceso visto de frontera a frontera, en una sola vista. Si una entrada no tiene
          proveedor o una salida no tiene cliente, ahí ya hay un hueco. Las etapas que captures aquí
          son las que se usan en el inventario de actividades.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <div className="tablero">
        <Cifra
          label="Columnas con dato"
          valor={columnasListas + '/5'}
          pie="S · I · P · O · C"
          ember={columnasListas === 5}
        />
        <Cifra
          label="Etapas del proceso"
          valor={etapas || '—'}
          pie={etapas > 7 ? 'Van más de 7: eso ya es detalle, no etapas' : 'Alimentan el inventario'}
        />
        <Cifra
          label="Huecos detectados"
          valor={(desbalance ? 1 : 0) + (sinCliente ? 1 : 0)}
          pie={
            desbalance || sinCliente
              ? [desbalance ? 'Entradas sin proveedor' : null, sinCliente ? 'Salidas sin cliente' : null]
                  .filter(Boolean)
                  .join(' · ')
              : 'Sin inconsistencias'
          }
          ember={desbalance || sinCliente}
        />
      </div>

      <Bloque titulo={proceso ? 'SIPOC · ' + proceso.nombre : 'SIPOC'} meta="FRONTERA A FRONTERA">
        <div className="sipoc">
          {COLUMNAS_SIPOC.map((c) => (
            <div className="sipoc__col" key={c.id}>
              <div className="sipoc__cabeza">
                <span className="sipoc__inicial">{c.inicial}</span>
                <span className="sipoc__cuenta">{lleno(c.id)}</span>
              </div>
              <span className="sipoc__titulo">{c.titulo}</span>
              <p className="sipoc__pista">{c.pista}</p>
              <MiniLista
                items={s[c.id]}
                placeholder={c.ph}
                onUpdate={onUpdate(c.id)}
                onAdd={onAdd(c.id)}
                onRemove={onRemove(c.id)}
              />
            </div>
          ))}
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   DP-2 · Inventario de Actividades
   ========================================================================= */

const nuevaActividad = () => ({
  id: 'a' + Date.now() + Math.random().toString(16).slice(2, 6),
  etapa: '',
  nombre: '',
  responsable: '',
  minutos: '',
  vecesMes: '',
  sistema: '',
  documento: '',
  clase: null, // 'va' | 'nvan' | 'nva'
});

function etapasDe(estado) {
  return estado.sipoc.etapas.map((e) => e.text.trim()).filter(Boolean);
}

export function Inventario({ estado, set }) {
  const acts = estado.actividades;
  const etapas = etapasDe(estado);

  const editar = (id, k, v) =>
    set({ ...estado, actividades: acts.map((a) => (a.id === id ? { ...a, [k]: v } : a)) });

  const agregar = () => set({ ...estado, actividades: [...acts, nuevaActividad()] });

  const borrar = (id) => {
    if (acts.length <= 1) return;
    set({ ...estado, actividades: acts.filter((a) => a.id !== id) });
  };

  const totalMin = acts.reduce((a, x) => a + num(x.minutos), 0);
  const conNombre = acts.filter((a) => a.nombre.trim()).length;
  const sinResponsable = acts.filter((a) => a.nombre.trim() && !a.responsable.trim()).length;
  const horasMes = acts.reduce((a, x) => a + (num(x.minutos) * num(x.vecesMes)) / 60, 0);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Inventario de Actividades</h2>
        <p className="tool__intro">
          Todo lo que se hace dentro del proceso, con nombre y apellido: quién lo hace, cuánto tarda,
          en qué sistema y con qué documento. Sin este inventario, la clasificación de valor y el
          costo del desperdicio no tienen de dónde salir.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Actividades" valor={conNombre || '—'} pie="Registradas con nombre" />
        <Cifra
          label="Tiempo por corrida"
          valor={totalMin ? totalMin.toLocaleString('es-MX') + ' min' : '—'}
          pie="Suma de todas las actividades"
        />
        <Cifra
          label="Horas al mes"
          valor={horasMes ? horasMes.toFixed(1) : '—'}
          pie={sinResponsable ? sinResponsable + ' actividad(es) sin responsable' : 'Tiempo × veces al mes'}
          ember={sinResponsable > 0}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Actividad</th>
                <th>Responsable</th>
                <th className="num">Min</th>
                <th className="num">Veces/mes</th>
                <th>Sistema</th>
                <th>Documento</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {acts.map((a) => (
                <tr key={a.id}>
                  <td>
                    {etapas.length ? (
                      <select
                        className="tabla__select"
                        value={a.etapa}
                        onChange={(e) => editar(a.id, 'etapa', e.target.value)}
                      >
                        <option value="">Sin etapa</option>
                        {etapas.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="tabla__input"
                        value={a.etapa}
                        placeholder="Captura etapas en el SIPOC"
                        onChange={(e) => editar(a.id, 'etapa', e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    <input className="tabla__input" value={a.nombre} placeholder="Qué se hace" onChange={(e) => editar(a.id, 'nombre', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={a.responsable} placeholder="Quién" onChange={(e) => editar(a.id, 'responsable', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={a.minutos} onChange={(e) => editar(a.id, 'minutos', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={a.vecesMes} onChange={(e) => editar(a.id, 'vecesMes', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={a.sistema} placeholder="ERP, Excel…" onChange={(e) => editar(a.id, 'sistema', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={a.documento} placeholder="Formato, orden…" onChange={(e) => editar(a.id, 'documento', e.target.value)} />
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(a.id)} disabled={acts.length <= 1} title="Quitar">
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
            + Agregar actividad
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   DP-3 · Clasificación de Valor Agregado
   ========================================================================= */

const CLASES = [
  { id: 'va', corto: 'Agrega valor', chip: 'chip--va', color: 'var(--ok)' },
  { id: 'nvan', corto: 'Necesaria, no agrega', chip: 'chip--nvan', color: 'var(--warn)' },
  { id: 'nva', corto: 'No agrega valor', chip: 'chip--nva', color: 'var(--stop)' },
];

function repartoDe(actividades) {
  const t = { va: 0, nvan: 0, nva: 0, sin: 0 };
  actividades.forEach((a) => {
    const m = num(a.minutos);
    if (!a.nombre.trim()) return;
    if (a.clase) t[a.clase] += m;
    else t.sin += m;
  });
  const total = t.va + t.nvan + t.nva;
  return { ...t, total };
}

export function Valor({ estado, set }) {
  const acts = estado.actividades.filter((a) => a.nombre.trim());

  const clasificar = (id, clase) =>
    set({
      ...estado,
      actividades: estado.actividades.map((a) =>
        a.id === id ? { ...a, clase: a.clase === clase ? null : clase } : a
      ),
    });

  const r = repartoDe(estado.actividades);
  const pct = (v) => (r.total ? (v / r.total) * 100 : 0);
  const clasificadas = acts.filter((a) => a.clase).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Clasificación de Valor Agregado</h2>
        <p className="tool__intro">
          Tres categorías, sin cuarta opción. Agrega valor: el cliente lo reconoce y lo pagaría.
          Necesaria pero no agrega: no la puedes quitar hoy, pero el cliente no la paga. No agrega
          valor: desperdicio puro. En la mayoría de los procesos, la primera categoría no llega al
          20% del tiempo.
        </p>
      </header>

      {acts.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-2</span>
          <span>No hay actividades registradas. Captura el inventario y regresa aquí a clasificarlas.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Índice de valor agregado"
          valor={r.total ? pct(r.va).toFixed(0) + '%' : '—'}
          pie="Del tiempo total, lo que el cliente sí paga"
          ember={r.total > 0 && pct(r.va) < 20}
        />
        <Cifra
          label="Tiempo que no agrega valor"
          valor={r.total ? (r.nva + r.nvan).toLocaleString('es-MX') + ' min' : '—'}
          pie="Necesaria más desperdicio puro"
        />
        <Cifra
          label="Clasificadas"
          valor={clasificadas + '/' + acts.length}
          pie={r.sin ? r.sin.toLocaleString('es-MX') + ' min sin clasificar' : 'Todas con categoría'}
        />
      </div>

      {r.total > 0 && (
        <Bloque titulo="Reparto del tiempo" meta={r.total.toLocaleString('es-MX') + ' MIN CLASIFICADOS'}>
          <div className="reparto">
            <div className="reparto__parte reparto__parte--va" style={{ width: pct(r.va) + '%' }} />
            <div className="reparto__parte reparto__parte--nvan" style={{ width: pct(r.nvan) + '%' }} />
            <div className="reparto__parte reparto__parte--nva" style={{ width: pct(r.nva) + '%' }} />
          </div>
          <div className="leyenda">
            {CLASES.map((c) => (
              <span className="leyenda__item" key={c.id}>
                <span className="leyenda__punto" style={{ background: c.color }} />
                {c.corto}: {pct(r[c.id]).toFixed(0)}% · {r[c.id].toLocaleString('es-MX')} min
              </span>
            ))}
          </div>
        </Bloque>
      )}

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Actividad</th>
                <th className="num">Min</th>
                <th>Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="dato">{a.etapa || '—'}</span>
                  </td>
                  <td>{a.nombre}</td>
                  <td className="num">
                    <span className="dato dato--fuerte">{a.minutos || '—'}</span>
                  </td>
                  <td>
                    <div className="chips">
                      {CLASES.map((c) => (
                        <button
                          key={c.id}
                          className={['chip', c.chip, a.clase === c.id ? 'is-activo' : ''].filter(Boolean).join(' ')}
                          onClick={() => clasificar(a.id, c.id)}
                        >
                          {c.corto}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   DP-4 · Diagnóstico de Desperdicios Lean
   ========================================================================= */

const DESPERDICIOS = [
  { id: 'esperas', nombre: 'Esperas', pista: 'Trabajo detenido esperando firma, dato, material o decisión.' },
  { id: 'retrabajos', nombre: 'Retrabajos', pista: 'Hacer dos veces lo que debió salir bien la primera.' },
  { id: 'errores', nombre: 'Errores', pista: 'Defectos que llegan al cliente o se corrigen adentro.' },
  { id: 'movimientos', nombre: 'Movimientos', pista: 'Gente o papel yendo y viniendo sin necesidad.' },
  { id: 'sobreproceso', nombre: 'Sobreprocesamiento', pista: 'Pasos, firmas o revisiones que nadie usa.' },
  { id: 'inventarios', nombre: 'Inventarios', pista: 'Pilas de trabajo en cola, expedientes o material parado.' },
  { id: 'talento', nombre: 'Talento desaprovechado', pista: 'Gente capaz haciendo tareas por debajo de su nivel.' },
  { id: 'produccion', nombre: 'Producción innecesaria', pista: 'Reportes, copias o piezas que nadie pidió.' },
];

const NIVEL_DESPERDICIO = ['Sin presencia', 'Leve', 'Moderado', 'Frecuente', 'Grave', 'Crítico'];

export function Desperdicios({ estado, set }) {
  const d = estado.desperdicios;

  const editar = (id, k, v) =>
    set({ ...estado, desperdicios: { ...d, [id]: { ...d[id], [k]: v } } });

  const conNivel = DESPERDICIOS.filter((x) => typeof d[x.id].nivel === 'number');
  const horasTotal = DESPERDICIOS.reduce((a, x) => a + num(d[x.id].horasMes), 0);
  const ordenados = [...DESPERDICIOS].sort((a, b) => (d[b.id].nivel || 0) - (d[a.id].nivel || 0));
  const peor = conNivel.length ? ordenados[0] : null;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Diagnóstico de Desperdicios Lean</h2>
        <p className="tool__intro">
          Los ocho desperdicios, calificados de 0 a 5 según lo que pasa en este proceso. Cero es que
          no existe; cinco es que ya es la forma normal de trabajar. Lo que no se pueda sostener con
          evidencia, no se califica.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Desperdicios evaluados"
          valor={conNivel.length + '/8'}
          pie="Con calificación asignada"
        />
        <Cifra
          label="Horas perdidas al mes"
          valor={horasTotal ? horasTotal.toLocaleString('es-MX') : '—'}
          pie="Suma de los ocho"
          ember={horasTotal > 0}
        />
        <Cifra
          label="El más grave"
          valor={peor && d[peor.id].nivel ? String(d[peor.id].nivel) : '—'}
          pie={peor && d[peor.id].nivel ? peor.nombre : 'Califica al menos uno'}
        />
      </div>

      <Bloque titulo="Perfil de desperdicio" meta="ESCALA 0 A 5">
        {DESPERDICIOS.map((x) => (
          <div className="marcador" key={x.id}>
            <span className="marcador__nombre">{x.nombre}</span>
            <Barra pct={((d[x.id].nivel || 0) / 5) * 100} ember={peor && x.id === peor.id && d[x.id].nivel >= 4} />
            <span className="marcador__valor">
              {typeof d[x.id].nivel === 'number' ? d[x.id].nivel : '—'}
            </span>
          </div>
        ))}
      </Bloque>

      {DESPERDICIOS.map((x) => (
        <Bloque
          key={x.id}
          titulo={x.nombre}
          meta={typeof d[x.id].nivel === 'number' ? NIVEL_DESPERDICIO[d[x.id].nivel].toUpperCase() : 'SIN CALIFICAR'}
        >
          <div className="reactivo">
            <span className="reactivo__texto">{x.pista}</span>
            <Escala valor={d[x.id].nivel ?? null} onChange={(v) => editar(x.id, 'nivel', v)} min={0} max={5} />
          </div>

          <div className="rejilla" style={{ marginTop: 'var(--sp-4)' }}>
            <Campo
              label="Dónde ocurre"
              valor={d[x.id].donde}
              onChange={(v) => editar(x.id, 'donde', v)}
              pista="Etapa o punto exacto del proceso."
            />
            <Campo
              label="Horas perdidas al mes"
              valor={d[x.id].horasMes}
              onChange={(v) => editar(x.id, 'horasMes', v)}
              pista="Estimado con dato, no de memoria."
            />
            <Campo
              label="Evidencia"
              valor={d[x.id].evidencia}
              onChange={(v) => editar(x.id, 'evidencia', v)}
              area
              ancho
              pista="Qué lo comprueba: reporte, bitácora, medición, observación en piso."
            />
          </div>
        </Bloque>
      ))}
    </div>
  );
}

/* =========================================================================
   DP-5 · Matriz de Problemas Operativos
   ========================================================================= */

const nuevoProblema = () => ({
  id: 'pr' + Date.now() + Math.random().toString(16).slice(2, 6),
  problema: '',
  frecuencia: 3,
  impacto: 3,
  area: '',
  evidencia: '',
  responsable: '',
  urgencia: 3,
  facilidad: 3,
});

export function Problemas({ estado, set }) {
  const ps = estado.problemas;

  const editar = (id, k, v) =>
    set({ ...estado, problemas: ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });

  const agregar = () => set({ ...estado, problemas: [...ps, nuevoProblema()] });

  const borrar = (id) => {
    if (ps.length <= 1) return;
    set({ ...estado, problemas: ps.filter((p) => p.id !== id) });
  };

  const conNombre = ps.filter((p) => p.problema.trim());
  const sinEvidencia = conNombre.filter((p) => !p.evidencia.trim()).length;
  const sinDueno = conNombre.filter((p) => !p.responsable.trim()).length;
  const criticos = conNombre.filter((p) => p.frecuencia >= 4 && p.impacto >= 4).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Matriz de Problemas Operativos</h2>
        <p className="tool__intro">
          Un problema sin evidencia es una opinión, y sin responsable es un lamento. Frecuencia e
          impacto se califican de 1 a 5; los que salen alto en ambos son los que se llevan a la
          priorización.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Problemas registrados" valor={conNombre.length || '—'} pie="Con descripción" />
        <Cifra
          label="Frecuentes y de alto impacto"
          valor={criticos || '—'}
          pie="4 o más en ambos criterios"
          ember={criticos > 0}
        />
        <Cifra
          label="Sin sustento"
          valor={sinEvidencia + sinDueno || '0'}
          pie={
            sinEvidencia + sinDueno
              ? sinEvidencia + ' sin evidencia · ' + sinDueno + ' sin responsable'
              : 'Todos con evidencia y responsable'
          }
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Problema</th>
                <th className="num">Frecuencia</th>
                <th className="num">Impacto</th>
                <th>Área afectada</th>
                <th>Evidencia</th>
                <th>Responsable</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ps.map((p) => {
                const critico = p.problema.trim() && p.frecuencia >= 4 && p.impacto >= 4;
                return (
                  <tr key={p.id} className={critico ? 'is-lider' : ''}>
                    <td>
                      <input className="tabla__input" value={p.problema} placeholder="Qué falla" onChange={(e) => editar(p.id, 'problema', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" type="number" min="1" max="5" value={p.frecuencia} onChange={(e) => editar(p.id, 'frecuencia', num(e.target.value))} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" type="number" min="1" max="5" value={p.impacto} onChange={(e) => editar(p.id, 'impacto', num(e.target.value))} />
                    </td>
                    <td>
                      <input className="tabla__input" value={p.area} placeholder="Área" onChange={(e) => editar(p.id, 'area', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={p.evidencia} placeholder="Qué lo comprueba" onChange={(e) => editar(p.id, 'evidencia', e.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={p.responsable} placeholder="Quién responde" onChange={(e) => editar(p.id, 'responsable', e.target.value)} />
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(p.id)} disabled={ps.length <= 1} title="Quitar">
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
            + Agregar problema
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   DP-6 · Cuantificación del Costo del Desperdicio
   ========================================================================= */

export const CONCEPTOS_COSTO = [
  { id: 'horas', nombre: 'Horas perdidas', unidad: 'horas/mes', base: 'costoHora', pista: 'Tiempo que no agrega valor.' },
  { id: 'errores', nombre: 'Costo de errores', unidad: 'eventos/mes', base: 'unitario', pista: 'Lo que cuesta cada error que llega al cliente.' },
  { id: 'retrabajos', nombre: 'Retrabajos', unidad: 'horas/mes', base: 'costoHora', pista: 'Horas de rehacer trabajo.' },
  { id: 'demoras', nombre: 'Demoras', unidad: 'eventos/mes', base: 'unitario', pista: 'Penalizaciones, fletes urgentes, clientes perdidos.' },
  { id: 'capacidad', nombre: 'Capacidad desperdiciada', unidad: 'horas/mes', base: 'costoHora', pista: 'Capacidad instalada que no se usa por el desperdicio.' },
];

export function Costo({ estado, set }) {
  const c = estado.costo;

  const campo = (k, v) => set({ ...estado, costo: { ...c, [k]: v } });
  const editar = (id, k, v) =>
    set({ ...estado, costo: { ...c, conceptos: { ...c.conceptos, [id]: { ...c.conceptos[id], [k]: v } } } });

  const costoHora = num(c.costoHora);

  // Sugerencia heredada de DP-3: minutos que no agregan valor × veces al mes
  const nvaMin = estado.actividades.reduce((a, x) => {
    if (!x.nombre.trim() || (x.clase !== 'nva' && x.clase !== 'nvan')) return a;
    return a + num(x.minutos) * (num(x.vecesMes) || 0);
  }, 0);
  const nvaHoras = nvaMin / 60;

  const filas = CONCEPTOS_COSTO.map((k) => {
    const dato = c.conceptos[k.id];
    const cant = num(dato.cantidad);
    const unit = k.base === 'costoHora' ? costoHora : num(dato.unitario);
    const mes = cant * unit;
    return { ...k, cant, unit, mes, anual: mes * 12 };
  });

  const totalMes = filas.reduce((a, f) => a + f.mes, 0);
  const totalAnual = totalMes * 12;
  const mayor = filas.reduce((a, f) => (f.mes > a.mes ? f : a), filas[0]);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Cuantificación del Costo del Desperdicio</h2>
        <p className="tool__intro">
          El desperdicio deja de ser tema de junta cuando trae cifra. Captura el costo hora-hombre y
          las cantidades; el resto se calcula. Este número es el que abre presupuesto.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Costo anual del desperdicio"
          valor={totalAnual ? moneda(totalAnual) : '—'}
          pie="Lo que cuesta dejar el proceso como está"
          ember={totalAnual > 0}
        />
        <Cifra label="Costo mensual" valor={totalMes ? moneda(totalMes) : '—'} pie="Base del cálculo anual" />
        <Cifra
          label="Concepto más caro"
          valor={mayor && mayor.mes ? moneda(mayor.mes) : '—'}
          pie={mayor && mayor.mes ? mayor.nombre : 'Captura cantidades'}
        />
      </div>

      <Bloque titulo="Parámetros" meta="BASE DEL CÁLCULO">
        <div className="rejilla">
          <Campo
            label="Costo hora-hombre"
            valor={c.costoHora}
            onChange={(v) => campo('costoHora', v)}
            pista="Sueldo más cargas sociales, dividido entre horas efectivas."
          />
          <Campo
            label="Corridas del proceso al mes"
            valor={c.vecesMes}
            onChange={(v) => campo('vecesMes', v)}
            pista="Referencia para dimensionar el volumen."
          />
        </div>

        {nvaHoras > 0 && (
          <div className="aviso" style={{ marginTop: 'var(--sp-4)' }}>
            <span className="aviso__clave">DP-3</span>
            <span>
              La clasificación de valor arroja {nvaHoras.toFixed(1)} horas al mes que no agregan
              valor. Úsalas como punto de partida en el primer renglón.
            </span>
          </div>
        )}
      </Bloque>

      <Bloque titulo="Conceptos" meta="CANTIDAD × COSTO">
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Unidad</th>
                <th className="num">Cantidad</th>
                <th className="num">Costo unitario</th>
                <th className="num">Costo mensual</th>
                <th className="num">Costo anual</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="dato dato--fuerte">{f.nombre}</span>
                    <br />
                    <span className="campo__pista">{f.pista}</span>
                  </td>
                  <td>
                    <span className="dato">{f.unidad}</span>
                  </td>
                  <td className="num">
                    <input
                      className="tabla__input tabla__input--num"
                      value={c.conceptos[f.id].cantidad}
                      onChange={(e) => editar(f.id, 'cantidad', e.target.value)}
                    />
                  </td>
                  <td className="num">
                    {f.base === 'costoHora' ? (
                      <span className="dato">{costoHora ? moneda(costoHora) : 'Captura el costo hora'}</span>
                    ) : (
                      <input
                        className="tabla__input tabla__input--num"
                        value={c.conceptos[f.id].unitario}
                        onChange={(e) => editar(f.id, 'unitario', e.target.value)}
                      />
                    )}
                  </td>
                  <td className="num">
                    <span className="dato">{f.mes ? moneda(f.mes) : '—'}</span>
                  </td>
                  <td className="num">
                    <span className="dato dato--fuerte">{f.anual ? moneda(f.anual) : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   DP-7 · Priorización de Oportunidades
   ========================================================================= */

const CRITERIOS_DP = [
  { id: 'impacto', nombre: 'Impacto', pista: 'Cuánto mueve si se resuelve.' },
  { id: 'urgencia', nombre: 'Urgencia', pista: 'Qué tan pronto duele.' },
  { id: 'frecuencia', nombre: 'Recurrencia', pista: 'Viene de la matriz de problemas.' },
  { id: 'facilidad', nombre: 'Facilidad', pista: 'Qué tan sencillo es resolverlo.' },
];

export function Prioridad({ estado, set }) {
  const ps = estado.problemas.filter((p) => p.problema.trim());
  const pesos = estado.pesosDp;

  const editar = (id, k, v) =>
    set({ ...estado, problemas: estado.problemas.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });

  const pesar = (id, v) => set({ ...estado, pesosDp: { ...pesos, [id]: num(v) } });

  const sumaPesos = CRITERIOS_DP.reduce((a, c) => a + (pesos[c.id] || 0), 0);

  const orden = ps
    .map((p) => {
      const s = CRITERIOS_DP.reduce((a, c) => a + (p[c.id] || 0) * (pesos[c.id] || 0), 0);
      return { ...p, score: sumaPesos ? s / sumaPesos : 0 };
    })
    .sort((a, b) => b.score - a.score);

  const top = orden.slice(0, 3);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Priorización de Oportunidades</h2>
        <p className="tool__intro">
          Los problemas de la matriz, ordenados por número. Impacto y recurrencia vienen de ahí;
          urgencia y facilidad se califican aquí. Los tres primeros son el trabajo del trimestre. El
          resto espera.
        </p>
      </header>

      {ps.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-5</span>
          <span>No hay problemas registrados. Captura la matriz de problemas y regresa a priorizar.</span>
        </div>
      )}

      <Bloque titulo="Peso de cada criterio" meta={'SUMA ' + sumaPesos + '%'}>
        <div className="rejilla">
          {CRITERIOS_DP.map((c) => (
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

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Problema</th>
                <th>Área</th>
                <th className="num">Impacto</th>
                <th className="num">Urgencia</th>
                <th className="num">Recurrencia</th>
                <th className="num">Facilidad</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            <tbody>
              {orden.map((p, i) => (
                <tr key={p.id} className={i < 3 ? 'is-lider' : ''}>
                  <td className="num">
                    <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                  </td>
                  <td>{p.problema}</td>
                  <td>
                    <span className="dato">{p.area || '—'}</span>
                  </td>
                  <td className="num">
                    <span className="dato">{p.impacto}</span>
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" type="number" min="1" max="5" value={p.urgencia} onChange={(e) => editar(p.id, 'urgencia', num(e.target.value))} />
                  </td>
                  <td className="num">
                    <span className="dato">{p.frecuencia}</span>
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" type="number" min="1" max="5" value={p.facilidad} onChange={(e) => editar(p.id, 'facilidad', num(e.target.value))} />
                  </td>
                  <td className="num">
                    <span className="dato dato--fuerte">{p.score.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Impacto y recurrencia se editan en la matriz de problemas; aquí solo se leen.
        </p>
      </Bloque>

      {top.length > 0 && (
        <Bloque titulo="Las tres que se trabajan" meta="TOP 3">
          {top.map((p, i) => (
            <div className="marcador" key={p.id}>
              <span className="marcador__nombre">
                {String(i + 1).padStart(2, '0')} · {p.problema}
              </span>
              <Barra pct={(p.score / 5) * 100} ember={i === 0} />
              <span className="marcador__valor">{p.score.toFixed(2)}</span>
            </div>
          ))}
        </Bloque>
      )}
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_DP = {
  sipoc: {
    proveedores: [nuevoItem()],
    entradas: [nuevoItem()],
    etapas: [nuevoItem()],
    salidas: [nuevoItem()],
    clientes: [nuevoItem()],
  },
  actividades: [nuevaActividad()],
  desperdicios: DESPERDICIOS.reduce(
    (a, d) => ({ ...a, [d.id]: { nivel: null, donde: '', evidencia: '', horasMes: '' } }),
    {}
  ),
  problemas: [nuevoProblema()],
  costo: {
    costoHora: '',
    vecesMes: '',
    conceptos: CONCEPTOS_COSTO.reduce((a, c) => ({ ...a, [c.id]: { cantidad: '', unitario: '' } }), {}),
  },
  pesosDp: { impacto: 35, urgencia: 25, frecuencia: 20, facilidad: 20 },
};
