import { Bloque, Campo, Cifra, AvisoProceso, MiniLista } from '../lib/ui.jsx';
import { num, nuevoItem } from '../lib/util.js';
/* =========================================================================
   MÓDULO ES · ESTANDARIZACIÓN
     MR-6 proceso futuro ─→ ES-2 POE ─┬─→ ES-3 Checklists
                                       ├─→ ES-4 RACI
                                       └─→ ES-5 Puntos de control ─→ ES-3
     DP-1 SIPOC ─→ ES-1 Ficha
   ========================================================================= */

const nuevoPasoPoe = () => ({
  id: 'po' + Date.now() + Math.random().toString(16).slice(2, 6),
  paso: '',
  instruccion: '',
  responsable: '',
  comoSeSabe: '',
  tiempo: '',
});

const nuevoCheck = () => ({ id: 'ck' + Date.now() + Math.random().toString(16).slice(2, 6), text: '' });
const nuevoRol = () => ({ id: 'ro' + Date.now() + Math.random().toString(16).slice(2, 6), nombre: '' });

const nuevoControl = () => ({
  id: 'co' + Date.now() + Math.random().toString(16).slice(2, 6),
  paso: '',
  valida: '',
  criterio: '',
  tolerancia: '',
  evidencia: '',
  quien: '',
  siNoCumple: '',
});

const nuevoPoka = () => ({
  id: 'pk' + Date.now() + Math.random().toString(16).slice(2, 6),
  error: '',
  donde: '',
  tipo: 'detectar',
  mecanismo: '',
  robustez: 3,
  estado: 'propuesto',
});

const nuevaVersion = () => ({
  id: 've' + Date.now() + Math.random().toString(16).slice(2, 6),
  version: '',
  fecha: '',
  cambio: '',
  quien: '',
  aprendizaje: '',
  vigencia: '',
});

const poeVivo = (estado) => estado.poe.filter((p) => p.paso.trim());

/* =========================================================================
   ES-1 · Ficha de Estándar Operativo
   ========================================================================= */

export function FichaEstandar({ estado, set, proceso, otros }) {
  const f = estado.ficha;
  const campo = (k, v) => set({ ...estado, ficha: { ...f, [k]: v } });

  const guardar = (k, items) => set({ ...estado, ficha: { ...f, [k]: items } });
  const onUpdate = (k) => (id, text) => guardar(k, f[k].map((i) => (i.id === id ? { ...i, text } : i)));
  const onAdd = (k) => () => guardar(k, [...f[k], nuevoItem()]);
  const onRemove = (k) => (id) => {
    if (f[k].length <= 1) return;
    guardar(k, f[k].filter((i) => i.id !== id));
  };

  const sipoc = otros.dp.sipoc;
  const hayEntradas = sipoc.entradas.filter((i) => i.text.trim()).length;
  const haySalidas = sipoc.salidas.filter((i) => i.text.trim()).length;
  const puedeHeredar = hayEntradas > 0 || haySalidas > 0;

  const heredar = () =>
    set({
      ...estado,
      ficha: {
        ...f,
        entradas: hayEntradas ? sipoc.entradas.filter((i) => i.text.trim()).map((i) => ({ ...i, id: 'e' + i.id })) : f.entradas,
        salidas: haySalidas ? sipoc.salidas.filter((i) => i.text.trim()).map((i) => ({ ...i, id: 's' + i.id })) : f.salidas,
      },
    });

  const esenciales = ['objetivo', 'alcance', 'dueno'].filter((k) => (f[k] || '').trim()).length;
  const pasos = poeVivo(estado).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Ficha de Estándar Operativo</h2>
        <p className="tool__intro">
          La portada del estándar: qué persigue, hasta dónde llega, quién responde y con qué se mide.
          Un proceso mejorado que no se estandariza regresa a su forma anterior en menos de un
          trimestre. Esta ficha es la que evita esa regresión.
        </p>
      </header>

      <AvisoProceso proceso={proceso} />

      <div className="tablero">
        <Cifra label="Ficha" valor={esenciales + '/3'} pie="Objetivo, alcance y dueño" ember={esenciales === 3} />
        <Cifra
          label="Dueño del proceso"
          valor={f.dueno ? '1' : '—'}
          pie={f.dueno || 'Sin dueño, el estándar no se sostiene'}
          ember={!f.dueno}
        />
        <Cifra label="Pasos documentados" valor={pasos || '—'} pie="En el procedimiento" />
      </div>

      <Bloque titulo={proceso ? 'Estándar · ' + proceso.nombre : 'Estándar'} meta={f.codigo ? f.codigo.toUpperCase() : 'SIN CÓDIGO'}>
        <div className="rejilla">
          <Campo label="Código del estándar" valor={f.codigo} onChange={(v) => campo('codigo', v)} pista="Para poder citarlo: EST-FAC-01, por ejemplo." />
          <Campo label="Dueño del proceso" valor={f.dueno} onChange={(v) => campo('dueno', v)} pista="Un nombre, no un área. Quien responde por el resultado." />
          <Campo
            label="Objetivo"
            valor={f.objetivo}
            onChange={(v) => campo('objetivo', v)}
            area
            ancho
            pista="Para qué existe el proceso, en términos de lo que recibe el cliente."
          />
          <Campo label="Alcance: qué incluye" valor={f.alcance} onChange={(v) => campo('alcance', v)} area pista="Dónde empieza y dónde termina." />
          <Campo label="Alcance: qué no incluye" valor={f.noAlcance} onChange={(v) => campo('noAlcance', v)} area pista="Lo que la gente supone que entra y no entra." />
          <Campo label="Quién ejecuta" valor={f.ejecutores} onChange={(v) => campo('ejecutores', v)} pista="Puestos que operan el estándar." />
          <Campo label="Indicador del estándar" valor={f.indicador} onChange={(v) => campo('indicador', v)} pista="Cómo se sabe que se está cumpliendo." />
        </div>
      </Bloque>

      {puedeHeredar && (
        <div className="aviso">
          <span className="aviso__clave">DP-1</span>
          <span style={{ flex: 1 }}>
            El SIPOC ya tiene {hayEntradas} entrada(s) y {haySalidas} salida(s) capturadas.
          </span>
          <button className="boton--sec" onClick={heredar}>
            Traer del SIPOC
          </button>
        </div>
      )}

      <Bloque titulo="Entradas y salidas" meta="LO QUE RECIBE Y LO QUE ENTREGA">
        <div className="rejilla">
          <div className="sipoc__col">
            <div className="sipoc__cabeza">
              <span className="sipoc__titulo">Entradas</span>
              <span className="sipoc__cuenta">{f.entradas.filter((i) => i.text.trim()).length}</span>
            </div>
            <p className="sipoc__pista">Qué necesita el proceso para arrancar.</p>
            <MiniLista items={f.entradas} placeholder="Entrada" onUpdate={onUpdate('entradas')} onAdd={onAdd('entradas')} onRemove={onRemove('entradas')} />
          </div>

          <div className="sipoc__col">
            <div className="sipoc__cabeza">
              <span className="sipoc__titulo">Salidas</span>
              <span className="sipoc__cuenta">{f.salidas.filter((i) => i.text.trim()).length}</span>
            </div>
            <p className="sipoc__pista">Qué entrega al terminar, y con qué característica.</p>
            <MiniLista items={f.salidas} placeholder="Salida" onUpdate={onUpdate('salidas')} onAdd={onAdd('salidas')} onRemove={onRemove('salidas')} />
          </div>

          <div className="sipoc__col">
            <div className="sipoc__cabeza">
              <span className="sipoc__titulo">Controles</span>
              <span className="sipoc__cuenta">{f.controles.filter((i) => i.text.trim()).length}</span>
            </div>
            <p className="sipoc__pista">Reglas, políticas o límites que el proceso debe respetar.</p>
            <MiniLista items={f.controles} placeholder="Control" onUpdate={onUpdate('controles')} onAdd={onAdd('controles')} onRemove={onRemove('controles')} />
          </div>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   ES-2 · Procedimiento Operativo Estándar
   ========================================================================= */

export function Poe({ estado, set, otros }) {
  const ps = estado.poe;

  const editar = (id, k, v) => set({ ...estado, poe: ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });
  const agregar = () => set({ ...estado, poe: [...ps, nuevoPasoPoe()] });
  const borrar = (id) => {
    if (ps.length <= 1) return;
    set({ ...estado, poe: ps.filter((p) => p.id !== id) });
  };
  const mover = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= ps.length) return;
    const copia = [...ps];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    set({ ...estado, poe: copia });
  };

  const futuro = otros.mr.pasos.filter((p) => p.nombre.trim() && p.accion !== 'eliminar');

  const importar = () => {
    const nuevos = futuro.map((p) => ({
      ...nuevoPasoPoe(),
      id: 'po' + p.id,
      paso: p.nombre,
      responsable: p.responsable,
      tiempo: p.tProcesoFuturo !== '' ? p.tProcesoFuturo : p.tProceso,
    }));
    const vacio = poeVivo(estado).length === 0;
    set({ ...estado, poe: vacio ? nuevos : [...ps, ...nuevos] });
  };

  const vivos = poeVivo(estado);
  const conInstruccion = vivos.filter((p) => p.instruccion.trim()).length;
  const sinCriterio = vivos.filter((p) => !p.comoSeSabe.trim()).length;
  const tiempoTotal = vivos.reduce((a, p) => a + num(p.tiempo), 0);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Procedimiento Operativo Estándar</h2>
        <p className="tool__intro">
          El proceso futuro convertido en instrucciones que alguien nuevo pueda seguir sin
          preguntar. Cada instrucción empieza con verbo y describe una acción observable. Y cada paso
          dice cómo se sabe que quedó bien: sin eso, no es estándar, es sugerencia.
        </p>
      </header>

      {futuro.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">MR-6</span>
          <span style={{ flex: 1 }}>
            El proceso futuro tiene {futuro.length} paso(s) vivos. Tráelos y conviértelos en
            instrucciones.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer proceso futuro
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra label="Pasos" valor={vivos.length || '—'} pie={conInstruccion + ' con instrucción escrita'} ember={vivos.length > 0} />
        <Cifra
          label="Sin criterio de salida"
          valor={sinCriterio || '0'}
          pie={sinCriterio ? 'No se puede verificar si quedaron bien' : 'Todos verificables'}
          ember={sinCriterio > 0}
        />
        <Cifra label="Tiempo estándar" valor={tiempoTotal ? tiempoTotal.toLocaleString('es-MX') + ' min' : '—'} pie="Suma del procedimiento" />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Paso</th>
                <th>Instrucción</th>
                <th>Responsable</th>
                <th>Cómo se sabe que quedó bien</th>
                <th className="num">Min</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ps.map((p, i) => (
                <tr key={p.id}>
                  <td className="num">
                    <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                  </td>
                  <td>
                    <input className="tabla__input" value={p.paso} placeholder="Nombre del paso" onChange={(e) => editar(p.id, 'paso', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={p.instruccion} placeholder="Verifica que… / Captura… / Envía…" onChange={(e) => editar(p.id, 'instruccion', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={p.responsable} placeholder="Puesto" onChange={(e) => editar(p.id, 'responsable', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={p.comoSeSabe} placeholder="Criterio observable" onChange={(e) => editar(p.id, 'comoSeSabe', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={p.tiempo} onChange={(e) => editar(p.id, 'tiempo', e.target.value)} />
                  </td>
                  <td>
                    <div className="chips">
                      <button className="chip" onClick={() => mover(i, -1)} disabled={i === 0} title="Subir">
                        ↑
                      </button>
                      <button className="chip" onClick={() => mover(i, 1)} disabled={i === ps.length - 1} title="Bajar">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(p.id)} disabled={ps.length <= 1} title="Quitar">
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
   ES-3 · Generador de Checklists
   ========================================================================= */

const LISTAS = [
  { id: 'ejecucion', nombre: 'Ejecución', pista: 'Lo que revisa quien hace el trabajo, mientras lo hace.' },
  { id: 'supervision', nombre: 'Supervisión', pista: 'Lo que revisa quien verifica, con muestreo o al 100%.' },
  { id: 'cierre', nombre: 'Cierre', pista: 'Lo que se confirma antes de dar el proceso por terminado.' },
];

export function Checklists({ estado, set }) {
  const ch = estado.checklists;

  const guardar = (k, items) => set({ ...estado, checklists: { ...ch, [k]: items } });
  const editar = (k) => (id, text) => guardar(k, ch[k].map((i) => (i.id === id ? { ...i, text } : i)));
  const agregar = (k) => () => guardar(k, [...ch[k], nuevoCheck()]);
  const borrar = (k) => (id) => {
    if (ch[k].length <= 1) return;
    guardar(k, ch[k].filter((i) => i.id !== id));
  };

  const vivos = poeVivo(estado);
  const controles = estado.controles.filter((c) => c.valida.trim());

  const generar = () => {
    const ejecucion = vivos
      .filter((p) => p.comoSeSabe.trim() || p.instruccion.trim())
      .map((p) => ({ id: 'ck' + p.id, text: p.comoSeSabe.trim() || p.instruccion.trim() }));
    const supervision = controles.map((c) => ({
      id: 'ck' + c.id,
      text: c.valida + (c.criterio ? ' — ' + c.criterio : ''),
    }));
    set({
      ...estado,
      checklists: {
        ejecucion: ejecucion.length ? ejecucion : ch.ejecucion,
        supervision: supervision.length ? supervision : ch.supervision,
        cierre: ch.cierre,
      },
    });
  };

  const puedeGenerar = vivos.length > 0 || controles.length > 0;
  const total = LISTAS.reduce((a, l) => a + ch[l.id].filter((i) => i.text.trim()).length, 0);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Generador de Checklists</h2>
        <p className="tool__intro">
          Tres listas cortas valen más que un manual de cien páginas que nadie abre. La regla: cada
          punto debe poder contestarse sí o no en cinco segundos, sin criterio propio. Si un punto
          requiere interpretación, no es checklist: es capacitación pendiente.
        </p>
      </header>

      {puedeGenerar && (
        <div className="aviso">
          <span className="aviso__clave">ES-2 · ES-5</span>
          <span style={{ flex: 1 }}>
            Se pueden armar {vivos.length} punto(s) de ejecución desde el procedimiento y{' '}
            {controles.length} de supervisión desde los puntos de control.
          </span>
          <button className="boton--sec" onClick={generar}>
            Generar listas
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra label="Puntos totales" valor={total || '—'} pie="En las tres listas" ember={total > 0} />
        <Cifra
          label="Ejecución"
          valor={ch.ejecucion.filter((i) => i.text.trim()).length || '—'}
          pie={ch.ejecucion.filter((i) => i.text.trim()).length > 12 ? 'Va larga: nadie la va a usar' : 'La lista de quien opera'}
          ember={ch.ejecucion.filter((i) => i.text.trim()).length > 12}
        />
        <Cifra label="Cierre" valor={ch.cierre.filter((i) => i.text.trim()).length || '—'} pie="Antes de darlo por terminado" />
      </div>

      <div className="checks">
        {LISTAS.map((l) => (
          <div className="check__col" key={l.id}>
            <div className="check__cabeza">
              <span className="check__titulo">{l.nombre}</span>
              <span className="sipoc__cuenta">{ch[l.id].filter((i) => i.text.trim()).length}</span>
            </div>
            <p className="sipoc__pista">{l.pista}</p>

            {ch[l.id].map((i) => (
              <div className="check__item" key={i.id}>
                <span className="check__caja" />
                <input
                  type="text"
                  value={i.text}
                  placeholder="Punto a verificar"
                  onChange={(e) => editar(l.id)(i.id, e.target.value)}
                />
                <button
                  className="mini__quitar"
                  onClick={() => borrar(l.id)(i.id)}
                  disabled={ch[l.id].length <= 1}
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            ))}

            <button className="mini__agregar" onClick={agregar(l.id)}>
              + Agregar punto
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   ES-4 · Matriz RACI
   ========================================================================= */

const LETRAS_RACI = [null, 'R', 'A', 'C', 'I'];

const SIGNIFICADO = {
  R: 'Ejecuta',
  A: 'Aprueba y responde',
  C: 'Se le consulta',
  I: 'Se le informa',
};

export function Raci({ estado, set }) {
  const roles = estado.roles;
  const asign = estado.raci;
  const vivos = poeVivo(estado);

  const editarRol = (id, v) => set({ ...estado, roles: roles.map((r) => (r.id === id ? { ...r, nombre: v } : r)) });
  const agregarRol = () => set({ ...estado, roles: [...roles, nuevoRol()] });
  const borrarRol = (id) => {
    if (roles.length <= 1) return;
    set({ ...estado, roles: roles.filter((r) => r.id !== id) });
  };

  const ciclar = (actId, rolId) => {
    const llave = actId + '|' + rolId;
    const actual = asign[llave] || null;
    const i = LETRAS_RACI.indexOf(actual);
    const siguiente = LETRAS_RACI[(i + 1) % LETRAS_RACI.length];
    const copia = { ...asign };
    if (siguiente) copia[llave] = siguiente;
    else delete copia[llave];
    set({ ...estado, raci: copia });
  };

  const letra = (actId, rolId) => asign[actId + '|' + rolId] || null;

  const rolesVivos = roles.filter((r) => r.nombre.trim());

  const diagnostico = vivos.map((p) => {
    const letras = rolesVivos.map((r) => letra(p.id, r.id)).filter(Boolean);
    const aes = letras.filter((l) => l === 'A').length;
    const erres = letras.filter((l) => l === 'R').length;
    return { ...p, aes, erres, ok: aes === 1 && erres >= 1 };
  });

  const sinA = diagnostico.filter((d) => d.aes === 0).length;
  const conVariosA = diagnostico.filter((d) => d.aes > 1).length;
  const sinR = diagnostico.filter((d) => d.erres === 0).length;
  const sanas = diagnostico.filter((d) => d.ok).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Matriz RACI</h2>
        <p className="tool__intro">
          Quién ejecuta, quién aprueba, a quién se consulta y a quién se informa. Dos reglas que no
          se negocian: cada actividad tiene exactamente un aprobador, y al menos un ejecutor. Cuando
          hay dos aprobadores, no hay ninguno.
        </p>
      </header>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">ES-2</span>
          <span>No hay pasos en el procedimiento. Captura el POE y la matriz se arma sobre esas actividades.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Actividades sanas"
          valor={vivos.length ? sanas + '/' + vivos.length : '—'}
          pie="Un aprobador y al menos un ejecutor"
          ember={vivos.length > 0 && sanas === vivos.length}
        />
        <Cifra
          label="Sin aprobador"
          valor={sinA || '0'}
          pie={sinA ? 'Nadie responde por el resultado' : 'Todas tienen quien responda'}
          ember={sinA > 0}
        />
        <Cifra
          label="Con más de un aprobador"
          valor={conVariosA || '0'}
          pie={conVariosA ? 'Responsabilidad diluida' : sinR ? sinR + ' actividad(es) sin ejecutor' : 'Sin duplicidad'}
          ember={conVariosA > 0}
        />
      </div>

      <Bloque titulo="Roles" meta={rolesVivos.length + ' PUESTOS'}>
        <div className="rejilla">
          {roles.map((r) => (
            <div className="campo" key={r.id}>
              <label className="campo__label">Rol</label>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                <input
                  className="campo__input"
                  value={r.nombre}
                  placeholder="Puesto o área"
                  onChange={(e) => editarRol(r.id, e.target.value)}
                />
                <button className="boton--icono" onClick={() => borrarRol(r.id)} disabled={roles.length <= 1} title="Quitar">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="boton--sec" style={{ marginTop: 'var(--sp-3)' }} onClick={agregarRol}>
          + Agregar rol
        </button>
      </Bloque>

      {vivos.length > 0 && rolesVivos.length > 0 && (
        <Bloque titulo="Asignación" meta="CLIC PARA CAMBIAR: R · A · C · I">
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Actividad</th>
                  {rolesVivos.map((r) => (
                    <th key={r.id} style={{ textAlign: 'center' }}>
                      {r.nombre}
                    </th>
                  ))}
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {diagnostico.map((p, i) => (
                  <tr key={p.id} className={p.ok ? '' : 'is-lider'}>
                    <td className="num">
                      <span className="dato">{String(i + 1).padStart(2, '0')}</span>
                    </td>
                    <td>{p.paso}</td>
                    {rolesVivos.map((r) => {
                      const l = letra(p.id, r.id);
                      return (
                        <td className="raci__celda" key={r.id}>
                          <button
                            className={['raci__btn', l ? 'raci__btn--' + l : ''].filter(Boolean).join(' ')}
                            onClick={() => ciclar(p.id, r.id)}
                            title={l ? SIGNIFICADO[l] : 'Sin participación'}
                          >
                            {l || '·'}
                          </button>
                        </td>
                      );
                    })}
                    <td>
                      {p.ok ? (
                        <span className="pill pill--ok">Correcta</span>
                      ) : p.aes === 0 ? (
                        <span className="pill pill--stop">Sin aprobador</span>
                      ) : p.aes > 1 ? (
                        <span className="pill pill--stop">Varios aprobadores</span>
                      ) : (
                        <span className="pill pill--warn">Sin ejecutor</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="leyenda">
            {Object.entries(SIGNIFICADO).map(([k, v]) => (
              <span className="leyenda__item" key={k}>
                <span
                  className="leyenda__punto"
                  style={{
                    background:
                      k === 'R' ? 'var(--upax-ink)' : k === 'A' ? 'var(--upax-ember)' : k === 'C' ? 'var(--warn)' : 'var(--line-strong)',
                  }}
                />
                {k} · {v}
              </span>
            ))}
          </div>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   ES-5 · Puntos de Control y Criterios de Calidad
   ========================================================================= */

export function Controles({ estado, set }) {
  const cs = estado.controles;
  const vivos = poeVivo(estado);

  const editar = (id, k, v) => set({ ...estado, controles: cs.map((c) => (c.id === id ? { ...c, [k]: v } : c)) });
  const agregar = () => set({ ...estado, controles: [...cs, nuevoControl()] });
  const borrar = (id) => {
    if (cs.length <= 1) return;
    set({ ...estado, controles: cs.filter((c) => c.id !== id) });
  };

  const llenos = cs.filter((c) => c.valida.trim());
  const sinCriterio = llenos.filter((c) => !c.criterio.trim()).length;
  const sinEvidencia = llenos.filter((c) => !c.evidencia.trim()).length;
  const sinReaccion = llenos.filter((c) => !c.siNoCumple.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Puntos de Control y Criterios de Calidad</h2>
        <p className="tool__intro">
          Un control sin criterio de aceptación es una revisión de buena voluntad. Cada punto necesita
          cuatro cosas: qué se valida, contra qué número, con qué evidencia queda, y qué pasa si no
          cumple. Esa última es la que casi siempre falta, y por eso los controles no detienen nada.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Puntos de control" valor={llenos.length || '—'} pie={vivos.length ? 'Sobre ' + vivos.length + ' pasos del procedimiento' : 'Captura el POE primero'} ember={llenos.length > 0} />
        <Cifra
          label="Sin criterio"
          valor={sinCriterio || '0'}
          pie={sinCriterio ? 'No se puede decir si pasó o no pasó' : 'Todos con criterio de aceptación'}
          ember={sinCriterio > 0}
        />
        <Cifra
          label="Sin plan de reacción"
          valor={sinReaccion || '0'}
          pie={sinReaccion ? 'El control detecta pero nadie sabe qué hacer' : 'Todos con reacción definida'}
          ember={sinReaccion > 0}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>En qué paso</th>
                <th>Qué se valida</th>
                <th>Criterio de aceptación</th>
                <th>Tolerancia</th>
                <th>Evidencia</th>
                <th>Quién valida</th>
                <th>Si no cumple</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cs.map((c) => (
                <tr key={c.id}>
                  <td>
                    {vivos.length ? (
                      <select className="tabla__select" value={c.paso} onChange={(e) => editar(c.id, 'paso', e.target.value)}>
                        <option value="">Elegir paso…</option>
                        {vivos.map((p) => (
                          <option key={p.id} value={p.paso}>
                            {p.paso}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input className="tabla__input" value={c.paso} placeholder="Paso" onChange={(e) => editar(c.id, 'paso', e.target.value)} />
                    )}
                  </td>
                  <td>
                    <input className="tabla__input" value={c.valida} placeholder="Qué se revisa" onChange={(e) => editar(c.id, 'valida', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={c.criterio} placeholder="Contra qué número o regla" onChange={(e) => editar(c.id, 'criterio', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={c.tolerancia} placeholder="± permitido" onChange={(e) => editar(c.id, 'tolerancia', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={c.evidencia} placeholder="Qué queda como registro" onChange={(e) => editar(c.id, 'evidencia', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={c.quien} placeholder="Puesto" onChange={(e) => editar(c.id, 'quien', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={c.siNoCumple} placeholder="Qué se hace" onChange={(e) => editar(c.id, 'siNoCumple', e.target.value)} />
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(c.id)} disabled={cs.length <= 1} title="Quitar">
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
            + Agregar punto de control
          </button>
        </div>

        {sinEvidencia > 0 && (
          <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
            {sinEvidencia} control(es) sin evidencia definida. Un control que no deja rastro no se
            puede auditar después: solo queda la palabra de quien lo hizo.
          </p>
        )}
      </Bloque>
    </div>
  );
}

/* =========================================================================
   ES-6 · Poka-Yoke y Prevención de Errores
   ========================================================================= */

const TIPOS_POKA = [
  { id: 'eliminar', nombre: 'Eliminar', nivel: 1, desc: 'Se rediseña para que el error no pueda existir. El paso desaparece.' },
  { id: 'prevenir', nombre: 'Prevenir', nivel: 2, desc: 'El sistema impide hacerlo mal: no deja avanzar, no embona, no guarda.' },
  { id: 'detectar', nombre: 'Detectar', nivel: 3, desc: 'El error se puede cometer, pero salta de inmediato y ahí se detiene.' },
  { id: 'mitigar', nombre: 'Mitigar', nivel: 4, desc: 'El error avanza, pero se reduce el daño. Es el último recurso.' },
];

const ESTADOS_POKA = [
  { id: 'propuesto', nombre: 'Propuesto', pill: 'pill--neutro' },
  { id: 'implementado', nombre: 'Implementado', pill: 'pill--ok' },
  { id: 'descartado', nombre: 'Descartado', pill: 'pill--stop' },
];

export function Pokayoke({ estado, set, otros }) {
  const ps = estado.pokayoke;

  const editar = (id, k, v) => set({ ...estado, pokayoke: ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)) });
  const agregar = () => set({ ...estado, pokayoke: [...ps, nuevoPoka()] });
  const borrar = (id) => {
    if (ps.length <= 1) return;
    set({ ...estado, pokayoke: ps.filter((p) => p.id !== id) });
  };

  const causasRp = otros.rp.validacion.filter((v) => v.hipotesis.trim() && v.veredicto === 'confirmada');
  const yaEstan = ps.map((p) => p.error.trim());
  const faltan = causasRp.filter((c) => !yaEstan.includes(c.hipotesis.trim()));

  const importar = () => {
    const nuevos = faltan.map((c) => ({ ...nuevoPoka(), id: 'pk' + c.id, error: c.hipotesis }));
    const vacio = ps.filter((p) => p.error.trim()).length === 0;
    set({ ...estado, pokayoke: vacio ? nuevos : [...ps, ...nuevos] });
  };

  const llenos = ps.filter((p) => p.error.trim());
  const implementados = llenos.filter((p) => p.estado === 'implementado');
  const porTipo = (t) => llenos.filter((p) => p.tipo === t).length;
  const blindaje = implementados.length
    ? implementados.reduce((a, p) => {
        const t = TIPOS_POKA.find((x) => x.id === p.tipo);
        return a + (5 - t.nivel);
      }, 0) / implementados.length
    : 0;
  const debiles = llenos.filter((p) => p.tipo === 'mitigar').length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Poka-Yoke y Prevención de Errores</h2>
        <p className="tool__intro">
          Pedirle a la gente que ponga más atención no es un control: es una esperanza. El poka-yoke
          cambia las condiciones para que el error sea imposible, o para que salte solo. La jerarquía
          importa: eliminar vence a prevenir, prevenir vence a detectar, y mitigar es lo último que
          queda cuando todo lo demás no se pudo.
        </p>
      </header>

      {faltan.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">RP-5</span>
          <span style={{ flex: 1 }}>
            Hay {faltan.length} causa(s) confirmadas en resolución de problemas que todavía no tienen
            un control diseñado.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer causas confirmadas
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Nivel de blindaje"
          valor={blindaje ? blindaje.toFixed(1) + '/4' : '—'}
          pie={implementados.length ? 'Promedio de los ' + implementados.length + ' implementados' : 'Nada implementado todavía'}
          ember={blindaje >= 3}
        />
        <Cifra label="Controles" valor={llenos.length || '—'} pie={implementados.length + ' implementados'} />
        <Cifra
          label="Apenas mitigan"
          valor={debiles || '0'}
          pie={debiles ? 'Revisa si de verdad no se pueden prevenir' : 'Ninguno se queda en mitigar'}
          ember={debiles > 0}
        />
      </div>

      <Bloque titulo="Jerarquía del control" meta="DE MEJOR A PEOR">
        <div className="jerarquia">
          {TIPOS_POKA.map((t) => (
            <div className={'jerarquia__nivel jerarquia__nivel--' + t.nivel} key={t.id}>
              <span className="jerarquia__tipo">{t.nombre}</span>
              <span className="jerarquia__desc">{t.desc}</span>
              <span className="jerarquia__cuenta">{porTipo(t.id)}</span>
            </div>
          ))}
        </div>
      </Bloque>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Error posible</th>
                <th>Dónde ocurre</th>
                <th>Tipo de control</th>
                <th>Mecanismo</th>
                <th className="num">Robustez</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ps.map((p) => {
                const t = TIPOS_POKA.find((x) => x.id === p.tipo);
                const e = ESTADOS_POKA.find((x) => x.id === p.estado);
                return (
                  <tr key={p.id} className={p.error.trim() && p.tipo === 'eliminar' && p.estado === 'implementado' ? 'is-lider' : ''}>
                    <td>
                      <input className="tabla__input" value={p.error} placeholder="Qué puede salir mal" onChange={(e2) => editar(p.id, 'error', e2.target.value)} />
                    </td>
                    <td>
                      <input className="tabla__input" value={p.donde} placeholder="Paso o punto" onChange={(e2) => editar(p.id, 'donde', e2.target.value)} />
                    </td>
                    <td>
                      <select className="tabla__select" value={p.tipo} onChange={(e2) => editar(p.id, 'tipo', e2.target.value)} title={t.desc}>
                        {TIPOS_POKA.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input className="tabla__input" value={p.mecanismo} placeholder="Cómo se logra" onChange={(e2) => editar(p.id, 'mecanismo', e2.target.value)} />
                    </td>
                    <td className="num">
                      <input
                        className="tabla__input tabla__input--num"
                        type="number"
                        min="1"
                        max="5"
                        value={p.robustez}
                        onChange={(e2) => editar(p.id, 'robustez', num(e2.target.value))}
                        title="Qué tan difícil es saltarse el control"
                      />
                    </td>
                    <td>
                      <select className="tabla__select" value={p.estado} onChange={(e2) => editar(p.id, 'estado', e2.target.value)}>
                        {ESTADOS_POKA.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nombre}
                          </option>
                        ))}
                      </select>
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
            + Agregar control
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Robustez es qué tan difícil resulta saltarse el control cuando hay prisa. Un aviso que se
          puede cerrar con Enter tiene robustez baja, aunque sea preventivo.
        </p>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   ES-7 · Control de Versiones y Actualización del Estándar
   ========================================================================= */

export function Versiones({ estado, set }) {
  const vs = estado.versiones;

  const editar = (id, k, v) => set({ ...estado, versiones: vs.map((x) => (x.id === id ? { ...x, [k]: v } : x)) });
  const agregar = () => set({ ...estado, versiones: [...vs, nuevaVersion()] });
  const borrar = (id) => {
    if (vs.length <= 1) return;
    set({ ...estado, versiones: vs.filter((x) => x.id !== id) });
  };

  const llenas = vs.filter((v) => v.version.trim());
  const vigente = llenas.length ? llenas[llenas.length - 1] : null;
  const conAprendizaje = llenas.filter((v) => v.aprendizaje.trim()).length;

  const hoy = new Date();
  const vencidas = llenas.filter((v) => {
    if (!v.vigencia.trim()) return false;
    const d = new Date(v.vigencia);
    return !isNaN(d) && d < hoy;
  }).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Control de Versiones y Actualización del Estándar</h2>
        <p className="tool__intro">
          Un estándar sin fecha de revisión se vuelve folclor: todos lo citan, nadie lo sigue. Aquí se
          registra qué cambió, quién lo autorizó y qué se aprendió. La columna de aprendizaje es la
          más valiosa y la que siempre se deja vacía: es la memoria de por qué el proceso es como es.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Versión vigente"
          valor={vigente ? vigente.version : '—'}
          pie={vigente ? (vigente.fecha ? 'Desde ' + vigente.fecha : 'Sin fecha registrada') : 'Registra la primera versión'}
          ember={!!vigente}
        />
        <Cifra label="Revisiones" valor={llenas.length || '—'} pie={conAprendizaje + ' con aprendizaje documentado'} />
        <Cifra
          label="Vigencia vencida"
          valor={vencidas || '0'}
          pie={vencidas ? 'El estándar ya debió revisarse' : 'Al día'}
          ember={vencidas > 0}
        />
      </div>

      <Bloque titulo="Bitácora del estándar" meta={estado.ficha.codigo ? estado.ficha.codigo.toUpperCase() : 'SIN CÓDIGO'}>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Versión</th>
                <th>Fecha</th>
                <th>Qué cambió</th>
                <th>Quién autorizó</th>
                <th>Qué se aprendió</th>
                <th>Próxima revisión</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vs.map((v, i) => (
                <tr key={v.id} className={vigente && v.id === vigente.id ? 'is-lider' : ''}>
                  <td>
                    <input className="tabla__input" value={v.version} placeholder="1.0" onChange={(e) => editar(v.id, 'version', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={v.fecha} placeholder="AAAA-MM-DD" onChange={(e) => editar(v.id, 'fecha', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={v.cambio} placeholder="El cambio concreto" onChange={(e) => editar(v.id, 'cambio', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={v.quien} placeholder="Quién" onChange={(e) => editar(v.id, 'quien', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={v.aprendizaje} placeholder="Por qué se cambió" onChange={(e) => editar(v.id, 'aprendizaje', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={v.vigencia} placeholder="AAAA-MM-DD" onChange={(e) => editar(v.id, 'vigencia', e.target.value)} />
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(v.id)} disabled={vs.length <= 1} title="Quitar">
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
            + Agregar versión
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          La última versión capturada se toma como la vigente. Fija la próxima revisión aunque nada
          haya fallado: los estándares también caducan por cambio de contexto.
        </p>
      </Bloque>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_ES = {
  ficha: {
    codigo: '',
    objetivo: '',
    alcance: '',
    noAlcance: '',
    dueno: '',
    ejecutores: '',
    indicador: '',
    entradas: [nuevoItem()],
    salidas: [nuevoItem()],
    controles: [nuevoItem()],
  },
  poe: [nuevoPasoPoe()],
  checklists: { ejecucion: [nuevoCheck()], supervision: [nuevoCheck()], cierre: [nuevoCheck()] },
  roles: [nuevoRol()],
  raci: {},
  controles: [nuevoControl()],
  pokayoke: [nuevoPoka()],
  versiones: [nuevaVersion()],
};
