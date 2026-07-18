import { Bloque, Campo, Barra, Cifra } from '../lib/ui.jsx';
import { num, moneda } from '../lib/util.js';
/* =========================================================================
   MÓDULO PC · PRODUCTIVIDAD Y CAPACIDAD
     PC-1 Capacidad ─┐
     PC-2 Carga ─────┴─→ PC-3 Balanceo ─→ PC-5 Saturaciones
     PC-6 Automatizables ─→ PC-7 Simulador
   La carga puede heredar el inventario de DP-2.
   ========================================================================= */

const nuevoRecurso = () => ({
  id: 'rc' + Date.now() + Math.random().toString(16).slice(2, 6),
  nombre: '',
  tipo: 'persona',
  personas: '',
  turnos: '1',
  horasTurno: '8',
  diasMes: '22',
  eficiencia: '85',
  disponibilidad: '90',
  cola: '',
});

const nuevaCarga = () => ({
  id: 'cg' + Date.now() + Math.random().toString(16).slice(2, 6),
  actividad: '',
  recursoId: '',
  volumen: '',
  minUnidad: '',
});

const nuevaLinea = () => ({
  id: 'ln' + Date.now() + Math.random().toString(16).slice(2, 6),
  linea: '',
  volumen: '',
  horas: '',
  personas: '',
  resultado: '',
});

const nuevaAuto = () => ({
  id: 'au' + Date.now() + Math.random().toString(16).slice(2, 6),
  actividad: '',
  horasMes: '',
  frecuencia: 3,
  reglas: 3,
  complejidad: 3,
  datos: 3,
});

const TIPOS_RECURSO = [
  { id: 'persona', nombre: 'Persona o puesto' },
  { id: 'equipo', nombre: 'Equipo o máquina' },
  { id: 'area', nombre: 'Área completa' },
];

export function capacidadDe(r) {
  const teorica = num(r.personas) * num(r.turnos) * num(r.horasTurno) * num(r.diasMes);
  const efectiva = teorica * (num(r.eficiencia) / 100) * (num(r.disponibilidad) / 100);
  return { teorica, efectiva };
}

export function cargaDe(estado, recursoId) {
  return estado.cargas
    .filter((c) => c.recursoId === recursoId && c.actividad.trim())
    .reduce((a, c) => a + (num(c.volumen) * num(c.minUnidad)) / 60, 0);
}

function horasPorPersona(r) {
  return num(r.turnos) * num(r.horasTurno) * num(r.diasMes) * (num(r.eficiencia) / 100) * (num(r.disponibilidad) / 100);
}

const recursosVivos = (estado) => estado.recursos.filter((r) => r.nombre.trim());

/* =========================================================================
   PC-1 · Calculadora de Capacidad Instalada
   ========================================================================= */

export function Capacidad({ estado, set }) {
  const rs = estado.recursos;

  const editar = (id, k, v) => set({ ...estado, recursos: rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
  const agregar = () => set({ ...estado, recursos: [...rs, nuevoRecurso()] });
  const borrar = (id) => {
    if (rs.length <= 1) return;
    set({ ...estado, recursos: rs.filter((r) => r.id !== id) });
  };

  const vivos = recursosVivos(estado);
  const totTeorica = vivos.reduce((a, r) => a + capacidadDe(r).teorica, 0);
  const totEfectiva = vivos.reduce((a, r) => a + capacidadDe(r).efectiva, 0);
  const merma = totTeorica ? ((totTeorica - totEfectiva) / totTeorica) * 100 : 0;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Calculadora de Capacidad Instalada</h2>
        <p className="tool__intro">
          Cuántas horas puede entregar la operación al mes. La capacidad teórica es la de la hoja de
          cálculo; la efectiva es la que existe de verdad, después de descontar eficiencia y
          disponibilidad. Presupuestar contra la teórica es la forma más común de prometer lo que no
          se puede cumplir.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Capacidad efectiva"
          valor={totEfectiva ? Math.round(totEfectiva).toLocaleString('es-MX') + ' h' : '—'}
          pie="Horas reales disponibles al mes"
          ember={totEfectiva > 0}
        />
        <Cifra
          label="Capacidad teórica"
          valor={totTeorica ? Math.round(totTeorica).toLocaleString('es-MX') + ' h' : '—'}
          pie="Personas × turnos × horas × días"
        />
        <Cifra
          label="Merma"
          valor={merma ? merma.toFixed(0) + '%' : '—'}
          pie={totTeorica ? Math.round(totTeorica - totEfectiva).toLocaleString('es-MX') + ' h que nunca existieron' : 'Captura recursos'}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Tipo</th>
                <th className="num">Personas</th>
                <th className="num">Turnos</th>
                <th className="num">Horas/turno</th>
                <th className="num">Días/mes</th>
                <th className="num">Eficiencia %</th>
                <th className="num">Disponib. %</th>
                <th className="num">Teórica</th>
                <th className="num">Efectiva</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rs.map((r) => {
                const c = capacidadDe(r);
                return (
                  <tr key={r.id}>
                    <td>
                      <input className="tabla__input" value={r.nombre} placeholder="Puesto, equipo o área" onChange={(e) => editar(r.id, 'nombre', e.target.value)} />
                    </td>
                    <td>
                      <select className="tabla__select" value={r.tipo} onChange={(e) => editar(r.id, 'tipo', e.target.value)}>
                        {TIPOS_RECURSO.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    {['personas', 'turnos', 'horasTurno', 'diasMes', 'eficiencia', 'disponibilidad'].map((k) => (
                      <td className="num" key={k}>
                        <input className="tabla__input tabla__input--num" value={r[k]} onChange={(e) => editar(r.id, k, e.target.value)} />
                      </td>
                    ))}
                    <td className="num">
                      <span className="dato">{c.teorica ? Math.round(c.teorica).toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato dato--fuerte">{c.efectiva ? Math.round(c.efectiva).toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(r.id)} disabled={rs.length <= 1} title="Quitar">
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
            + Agregar recurso
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Eficiencia es el ritmo real contra el estándar. Disponibilidad descuenta faltas, juntas,
          mantenimiento y todo lo que se come la jornada sin producir.
        </p>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   PC-2 · Análisis de Carga de Trabajo
   ========================================================================= */

export function Carga({ estado, set, otros }) {
  const cs = estado.cargas;
  const vivos = recursosVivos(estado);

  const editar = (id, k, v) => set({ ...estado, cargas: cs.map((c) => (c.id === id ? { ...c, [k]: v } : c)) });
  const agregar = () => set({ ...estado, cargas: [...cs, nuevaCarga()] });
  const borrar = (id) => {
    if (cs.length <= 1) return;
    set({ ...estado, cargas: cs.filter((c) => c.id !== id) });
  };

  const delInventario = otros.dp.actividades.filter((a) => a.nombre.trim());

  const importar = () => {
    const nuevas = delInventario.map((a) => ({
      ...nuevaCarga(),
      id: 'cg' + a.id,
      actividad: a.nombre,
      volumen: a.vecesMes,
      minUnidad: a.minutos,
    }));
    const vacio = cs.filter((c) => c.actividad.trim()).length === 0;
    set({ ...estado, cargas: vacio ? nuevas : [...cs, ...nuevas] });
  };

  const filas = cs.map((c) => ({ ...c, horas: (num(c.volumen) * num(c.minUnidad)) / 60 }));
  const totalHoras = filas.reduce((a, f) => a + f.horas, 0);
  const sinAsignar = filas.filter((f) => f.actividad.trim() && !f.recursoId).length;
  const maxHoras = Math.max(...filas.map((f) => f.horas), 1);
  const maxPorRecurso = Math.max(...vivos.map((x) => cargaDe(estado, x.id)), 1);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Análisis de Carga de Trabajo</h2>
        <p className="tool__intro">
          Cuánto trabajo cae sobre cada recurso al mes. Volumen por tiempo estándar da horas de
          carga; esa es la cifra que se compara contra la capacidad. Sin esto, la sobrecarga se
          discute en anécdotas.
        </p>
      </header>

      {delInventario.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-2</span>
          <span style={{ flex: 1 }}>
            El inventario de actividades tiene {delInventario.length} registro(s) con tiempo y
            frecuencia. Puedes traerlos en vez de recapturarlos.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer del inventario
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Carga total"
          valor={totalHoras ? Math.round(totalHoras).toLocaleString('es-MX') + ' h' : '—'}
          pie="Horas de trabajo demandadas al mes"
          ember={totalHoras > 0}
        />
        <Cifra label="Actividades" valor={filas.filter((f) => f.actividad.trim()).length || '—'} pie="Con volumen y tiempo" />
        <Cifra
          label="Sin recurso asignado"
          valor={sinAsignar || '0'}
          pie={sinAsignar ? 'No se pueden balancear' : 'Todas asignadas'}
          ember={sinAsignar > 0}
        />
      </div>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">PC-1</span>
          <span>No hay recursos capturados. Levanta la capacidad instalada para poder asignar la carga.</span>
        </div>
      )}

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Recurso</th>
                <th className="num">Volumen/mes</th>
                <th className="num">Min/unidad</th>
                <th className="num">Horas/mes</th>
                <th>Peso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <input className="tabla__input" value={f.actividad} placeholder="Qué se hace" onChange={(e) => editar(f.id, 'actividad', e.target.value)} />
                  </td>
                  <td>
                    <select className="tabla__select" value={f.recursoId} onChange={(e) => editar(f.id, 'recursoId', e.target.value)}>
                      <option value="">Sin asignar</option>
                      {vivos.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={f.volumen} onChange={(e) => editar(f.id, 'volumen', e.target.value)} />
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={f.minUnidad} onChange={(e) => editar(f.id, 'minUnidad', e.target.value)} />
                  </td>
                  <td className="num">
                    <span className="dato dato--fuerte">{f.horas ? f.horas.toFixed(1) : '—'}</span>
                  </td>
                  <td>
                    <Barra pct={(f.horas / maxHoras) * 100} />
                  </td>
                  <td>
                    <button className="boton--icono" onClick={() => borrar(f.id)} disabled={cs.length <= 1} title="Quitar">
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

      {vivos.length > 0 && totalHoras > 0 && (
        <Bloque titulo="Carga por recurso" meta="HORAS AL MES">
          {vivos.map((r) => {
            const h = cargaDe(estado, r.id);
            return (
              <div className="marcador" key={r.id}>
                <span className="marcador__nombre">{r.nombre}</span>
                <Barra pct={(h / maxPorRecurso) * 100} />
                <span className="marcador__valor">{h ? h.toFixed(1) : '—'}</span>
              </div>
            );
          })}
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   PC-3 · Balanceo de Cargas
   ========================================================================= */

function nivelUtilizacion(u) {
  if (!u) return { pill: 'pill--neutro', texto: 'Sin dato', tono: null };
  if (u > 100) return { pill: 'pill--stop', texto: 'Sobrecarga', tono: 'stop' };
  if (u > 90) return { pill: 'pill--warn', texto: 'Al límite', tono: 'warn' };
  if (u >= 70) return { pill: 'pill--ok', texto: 'Sano', tono: 'ok' };
  return { pill: 'pill--warn', texto: 'Subutilizado', tono: 'warn' };
}

export function Balanceo({ estado }) {
  const vivos = recursosVivos(estado);

  const filas = vivos.map((r) => {
    const cap = capacidadDe(r).efectiva;
    const carga = cargaDe(estado, r.id);
    const util = cap ? (carga / cap) * 100 : 0;
    const holgura = cap - carga;
    const hp = horasPorPersona(r);
    return { ...r, cap, carga, util, holgura, personasEq: hp ? holgura / hp : 0 };
  });

  const capTotal = filas.reduce((a, f) => a + f.cap, 0);
  const cargaTotal = filas.reduce((a, f) => a + f.carga, 0);
  const utilTotal = capTotal ? (cargaTotal / capTotal) * 100 : 0;
  const sobre = filas.filter((f) => f.util > 100).length;
  const sub = filas.filter((f) => f.util > 0 && f.util < 70).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Balanceo de Cargas</h2>
        <p className="tool__intro">
          Capacidad contra demanda, recurso por recurso. Arriba de 100% el trabajo se acumula todos
          los días; abajo de 70% se paga capacidad que no se usa. Casi siempre las dos cosas conviven
          en la misma empresa, en áreas que están a diez metros una de otra.
        </p>
      </header>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">PC-1</span>
          <span>Sin recursos capturados no hay nada que balancear.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Utilización global"
          valor={utilTotal ? utilTotal.toFixed(0) + '%' : '—'}
          pie={capTotal ? Math.round(cargaTotal).toLocaleString('es-MX') + ' h de carga sobre ' + Math.round(capTotal).toLocaleString('es-MX') + ' h' : 'Captura capacidad y carga'}
          ember={utilTotal > 100}
        />
        <Cifra
          label="Recursos sobrecargados"
          valor={sobre || '0'}
          pie={sobre ? 'Trabajan por encima de su capacidad' : 'Ninguno rebasado'}
          ember={sobre > 0}
        />
        <Cifra
          label="Recursos subutilizados"
          valor={sub || '0'}
          pie={sub ? 'Por debajo del 70%' : 'Ninguno ocioso'}
        />
      </div>

      <Bloque titulo="Utilización por recurso" meta="CAPACIDAD CONTRA CARGA">
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Recurso</th>
                <th className="num">Capacidad</th>
                <th className="num">Carga</th>
                <th className="num">Utilización</th>
                <th>Nivel</th>
                <th className="num">Holgura</th>
                <th className="num">Personas eq.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const n = nivelUtilizacion(f.util);
                return (
                  <tr key={f.id}>
                    <td>
                      <span className="dato dato--fuerte">{f.nombre}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f.cap ? Math.round(f.cap).toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f.carga ? Math.round(f.carga).toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato dato--fuerte">{f.util ? f.util.toFixed(0) + '%' : '—'}</span>
                    </td>
                    <td>
                      <span className={'pill ' + n.pill}>{n.texto}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f.cap ? (f.holgura >= 0 ? '+' : '') + Math.round(f.holgura).toLocaleString('es-MX') : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f.cap && Math.abs(f.personasEq) >= 0.1 ? (f.personasEq >= 0 ? '+' : '') + f.personasEq.toFixed(1) : '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Bloque>

      {filas.some((f) => f.util > 0) && (
        <Bloque titulo="Perfil de carga" meta="ESCALA HASTA 150%">
          {filas.map((f) => {
            const n = nivelUtilizacion(f.util);
            return (
              <div className="marcador" key={f.id}>
                <span className="marcador__nombre">{f.nombre}</span>
                <div className="barra barra--limite">
                  <div
                    className={'barra__fill' + (n.tono ? ' barra__fill--' + n.tono : '')}
                    style={{ width: Math.min(100, (f.util / 150) * 100) + '%' }}
                  />
                </div>
                <span className="marcador__valor">{f.util ? f.util.toFixed(0) + '%' : '—'}</span>
              </div>
            );
          })}
          <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
            La línea vertical marca el 100% de la capacidad efectiva.
          </p>
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   PC-4 · Matriz de Productividad
   ========================================================================= */

export function Productividad({ estado, set }) {
  const ls = estado.lineas;

  const editar = (id, k, v) => set({ ...estado, lineas: ls.map((l) => (l.id === id ? { ...l, [k]: v } : l)) });
  const agregar = () => set({ ...estado, lineas: [...ls, nuevaLinea()] });
  const borrar = (id) => {
    if (ls.length <= 1) return;
    set({ ...estado, lineas: ls.filter((l) => l.id !== id) });
  };

  const filas = ls
    .filter((l) => l.linea.trim())
    .map((l) => {
      const vol = num(l.volumen);
      const hrs = num(l.horas);
      const per = num(l.personas);
      const res = num(l.resultado);
      return { ...l, porHora: hrs ? vol / hrs : 0, porPersona: per ? vol / per : 0, resPorHora: hrs ? res / hrs : 0 };
    });

  const conDato = filas.filter((f) => f.porHora > 0);
  const maxPorHora = Math.max(...filas.map((f) => f.porHora), 0.0001);
  const mejor = conDato.length ? conDato.reduce((a, f) => (f.porHora > a.porHora ? f : a)) : null;
  const peor = conDato.length ? conDato.reduce((a, f) => (f.porHora < a.porHora ? f : a)) : null;
  const brecha = mejor && peor && peor.porHora ? mejor.porHora / peor.porHora : 0;

  const volTotal = filas.reduce((a, f) => a + num(f.volumen), 0);
  const hrsTotal = filas.reduce((a, f) => a + num(f.horas), 0);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Matriz de Productividad</h2>
        <p className="tool__intro">
          Volumen, tiempo, recursos y resultado en la misma tabla. Producir más no es ser más
          productivo: lo que cuenta es cuánto sale por hora y por persona, y qué resultado deja. La
          brecha entre la línea más productiva y la menos productiva suele ser el hallazgo.
        </p>
      </header>

      <div className="tablero">
        <Cifra
          label="Productividad global"
          valor={hrsTotal ? (volTotal / hrsTotal).toFixed(2) : '—'}
          pie="Unidades por hora, todas las líneas"
          ember={hrsTotal > 0}
        />
        <Cifra
          label="Brecha interna"
          valor={brecha > 1 ? brecha.toFixed(1) + '×' : '—'}
          pie={brecha > 1 ? mejor.linea + ' contra ' + peor.linea : 'Captura al menos dos líneas'}
        />
        <Cifra
          label="La más productiva"
          valor={mejor && mejor.porHora ? mejor.porHora.toFixed(2) : '—'}
          pie={mejor && mejor.porHora ? mejor.linea + ' · unidades por hora' : 'Captura volumen y horas'}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Línea, área o equipo</th>
                <th className="num">Volumen</th>
                <th className="num">Horas</th>
                <th className="num">Personas</th>
                <th className="num">Resultado</th>
                <th className="num">Vol/hora</th>
                <th className="num">Vol/persona</th>
                <th className="num">Result./hora</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ls.map((l) => {
                const f = filas.find((x) => x.id === l.id);
                return (
                  <tr key={l.id} className={mejor && f && f.id === mejor.id ? 'is-lider' : ''}>
                    <td>
                      <input className="tabla__input" value={l.linea} placeholder="Nombre" onChange={(e) => editar(l.id, 'linea', e.target.value)} />
                    </td>
                    {['volumen', 'horas', 'personas', 'resultado'].map((k) => (
                      <td className="num" key={k}>
                        <input className="tabla__input tabla__input--num" value={l[k]} onChange={(e) => editar(l.id, k, e.target.value)} />
                      </td>
                    ))}
                    <td className="num">
                      <span className="dato dato--fuerte">{f && f.porHora ? f.porHora.toFixed(2) : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f && f.porPersona ? f.porPersona.toFixed(1) : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f && f.resPorHora ? f.resPorHora.toFixed(2) : '—'}</span>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(l.id)} disabled={ls.length <= 1} title="Quitar">
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
            + Agregar línea
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Resultado es lo que deja la línea en la unidad que decidas: pesos de margen, piezas buenas,
          órdenes cerradas. Lo importante es que sea la misma unidad en todas.
        </p>
      </Bloque>

      {conDato.length > 1 && (
        <Bloque titulo="Unidades por hora" meta="COMPARATIVO">
          {filas.map((f) => (
            <div className="marcador" key={f.id}>
              <span className="marcador__nombre">{f.linea}</span>
              <Barra pct={(f.porHora / maxPorHora) * 100} tono={mejor && f.id === mejor.id ? 'ok' : peor && f.id === peor.id ? 'stop' : null} />
              <span className="marcador__valor">{f.porHora ? f.porHora.toFixed(2) : '—'}</span>
            </div>
          ))}
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   PC-5 · Detección de Saturaciones y Cuellos de Capacidad
   ========================================================================= */

export function Saturaciones({ estado, set }) {
  const vivos = recursosVivos(estado);

  const editar = (id, k, v) =>
    set({ ...estado, recursos: estado.recursos.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });

  const filas = vivos.map((r) => {
    const cap = capacidadDe(r).efectiva;
    const carga = cargaDe(estado, r.id);
    const util = cap ? (carga / cap) * 100 : 0;
    return {
      ...r,
      cap,
      carga,
      util,
      deficit: Math.max(0, carga - cap),
      ocioso: cap && util < 70 ? cap - carga : 0,
      colaN: num(r.cola),
    };
  });

  const saturados = filas.filter((f) => f.util > 100);
  const ociosos = filas.filter((f) => f.util > 0 && f.util < 70);
  const deficitTotal = filas.reduce((a, f) => a + f.deficit, 0);
  const ociosoTotal = ociosos.reduce((a, f) => a + f.ocioso, 0);
  const maxCola = Math.max(...filas.map((f) => f.colaN), 1);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Detección de Saturaciones y Cuellos de Capacidad</h2>
        <p className="tool__intro">
          Tres preguntas: dónde se acumula el trabajo, dónde faltan recursos y dónde sobra capacidad
          que ya se está pagando. La respuesta más común es que las tres cosas ocurren al mismo
          tiempo, y que el problema no era de gente sino de reparto.
        </p>
      </header>

      {vivos.length === 0 && (
        <div className="aviso">
          <span className="aviso__clave">PC-1</span>
          <span>Sin recursos ni carga no hay saturaciones que detectar.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Capacidad faltante"
          valor={deficitTotal ? Math.round(deficitTotal).toLocaleString('es-MX') + ' h' : '—'}
          pie={saturados.length ? 'En ' + saturados.length + ' recurso(s) rebasados' : 'Nadie por encima del límite'}
          ember={deficitTotal > 0}
        />
        <Cifra
          label="Capacidad ociosa"
          valor={ociosoTotal ? Math.round(ociosoTotal).toLocaleString('es-MX') + ' h' : '—'}
          pie={ociosos.length ? 'En ' + ociosos.length + ' recurso(s) por debajo del 70%' : 'Sin capacidad ociosa'}
        />
        <Cifra
          label="Reasignable"
          valor={deficitTotal && ociosoTotal ? Math.round(Math.min(deficitTotal, ociosoTotal)).toLocaleString('es-MX') + ' h' : '—'}
          pie={deficitTotal && ociosoTotal ? 'Horas que podrían moverse sin contratar' : 'Requiere déficit y ocio al mismo tiempo'}
          ember={deficitTotal > 0 && ociosoTotal > 0}
        />
      </div>

      {saturados.length > 0 && (
        <Bloque titulo="Dónde falta capacidad" meta={saturados.length + ' RECURSO(S) REBASADOS'}>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th className="num">Utilización</th>
                  <th className="num">Horas faltantes</th>
                  <th className="num">Personas necesarias</th>
                </tr>
              </thead>
              <tbody>
                {saturados.map((f) => {
                  const hp = horasPorPersona(f);
                  return (
                    <tr key={f.id}>
                      <td>
                        <span className="dato dato--fuerte">{f.nombre}</span>
                      </td>
                      <td className="num">
                        <span className="dato">{f.util.toFixed(0)}%</span>
                      </td>
                      <td className="num">
                        <span className="dato">{Math.round(f.deficit).toLocaleString('es-MX')}</span>
                      </td>
                      <td className="num">
                        <span className="dato dato--fuerte">{hp ? '+' + (f.deficit / hp).toFixed(1) : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
            Antes de contratar: revisa si el ocio de otro recurso alcanza para cubrirlo, y si el
            trabajo que satura este puesto es de los que salieron automatizables.
          </p>
        </Bloque>
      )}

      {ociosos.length > 0 && (
        <Bloque titulo="Dónde sobra capacidad" meta={ociosos.length + ' RECURSO(S) POR DEBAJO DEL 70%'}>
          <div className="tabla-wrap">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th className="num">Utilización</th>
                  <th className="num">Horas ociosas</th>
                  <th className="num">Personas equivalentes</th>
                </tr>
              </thead>
              <tbody>
                {ociosos.map((f) => {
                  const hp = horasPorPersona(f);
                  return (
                    <tr key={f.id}>
                      <td>
                        <span className="dato dato--fuerte">{f.nombre}</span>
                      </td>
                      <td className="num">
                        <span className="dato">{f.util.toFixed(0)}%</span>
                      </td>
                      <td className="num">
                        <span className="dato">{Math.round(f.ocioso).toLocaleString('es-MX')}</span>
                      </td>
                      <td className="num">
                        <span className="dato dato--fuerte">{hp ? (f.ocioso / hp).toFixed(1) : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Bloque>
      )}

      <Bloque titulo="Dónde se acumula el trabajo" meta="CONTEO EN PISO">
        <p className="nota" style={{ marginBottom: 'var(--sp-4)' }}>
          El cálculo dice dónde debería acumularse; el piso dice dónde se acumula. Captura cuántas
          unidades, casos o expedientes están formados esperando a cada recurso.
        </p>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Recurso</th>
                <th className="num">Utilización</th>
                <th className="num">Acumulación</th>
                <th>Tamaño de la fila</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="dato dato--fuerte">{f.nombre}</span>
                  </td>
                  <td className="num">
                    <span className="dato">{f.util ? f.util.toFixed(0) + '%' : '—'}</span>
                  </td>
                  <td className="num">
                    <input className="tabla__input tabla__input--num" value={f.cola} placeholder="0" onChange={(e) => editar(f.id, 'cola', e.target.value)} />
                  </td>
                  <td>
                    <Barra pct={(f.colaN / maxCola) * 100} tono={f.colaN === maxCola && f.colaN > 0 ? 'stop' : null} />
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
   PC-6 · Análisis de Actividades Repetitivas y Automatizables
   ========================================================================= */

const CRITERIOS_AUTO = [
  { id: 'frecuencia', nombre: 'Frecuencia', pista: 'Qué tan seguido se repite. 5: varias veces al día.' },
  { id: 'reglas', nombre: 'Reglas', pista: 'Qué tan claro es el criterio. 5: la decisión cabe en un manual.' },
  { id: 'complejidad', nombre: 'Complejidad', pista: 'Cuánto juicio exige. 5: requiere experiencia y contexto.' },
  { id: 'datos', nombre: 'Datos', pista: 'Qué tan estructurada llega la información. 5: ya viene en sistema.' },
];

export function potencialDe(a) {
  const f = num(a.frecuencia);
  const r = num(a.reglas);
  const c = 6 - num(a.complejidad);
  const d = num(a.datos);
  return ((f * 0.25 + r * 0.35 + c * 0.25 + d * 0.15) / 5) * 100;
}

function veredictoAuto(score, complejidad) {
  if (!score) return { texto: 'Sin evaluar', pill: 'pill--neutro' };
  if (score >= 75) return { texto: 'Automatizable con reglas', pill: 'pill--ok' };
  if (score >= 55) return { texto: complejidad >= 4 ? 'Candidata a IA' : 'Automatizable con IA', pill: 'pill--ok' };
  if (score >= 35) return { texto: 'Rediseñar antes', pill: 'pill--warn' };
  return { texto: 'Dejar en manos de gente', pill: 'pill--stop' };
}

export function Automatizables({ estado, set }) {
  const as = estado.automatizables;

  const editar = (id, k, v) => set({ ...estado, automatizables: as.map((a) => (a.id === id ? { ...a, [k]: v } : a)) });
  const agregar = () => set({ ...estado, automatizables: [...as, nuevaAuto()] });
  const borrar = (id) => {
    if (as.length <= 1) return;
    set({ ...estado, automatizables: as.filter((a) => a.id !== id) });
  };

  const desdeCarga = estado.cargas.filter((c) => c.actividad.trim() && num(c.volumen) * num(c.minUnidad) > 0);

  const importar = () => {
    const nuevas = desdeCarga.map((c) => ({
      ...nuevaAuto(),
      id: 'au' + c.id,
      actividad: c.actividad,
      horasMes: ((num(c.volumen) * num(c.minUnidad)) / 60).toFixed(1),
    }));
    const vacio = as.filter((a) => a.actividad.trim()).length === 0;
    set({ ...estado, automatizables: vacio ? nuevas : [...as, ...nuevas] });
  };

  const filas = as
    .filter((a) => a.actividad.trim())
    .map((a) => {
      const score = potencialDe(a);
      return { ...a, score, liberables: (num(a.horasMes) * score) / 100, v: veredictoAuto(score, num(a.complejidad)) };
    })
    .sort((a, b) => b.score - a.score);

  const liberables = filas.reduce((a, f) => a + f.liberables, 0);
  const altas = filas.filter((f) => f.score >= 55).length;
  const horasTotal = filas.reduce((a, f) => a + num(f.horasMes), 0);

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Análisis de Actividades Repetitivas y Automatizables</h2>
        <p className="tool__intro">
          No todo lo repetitivo se automatiza, y no todo lo automatizable conviene. Se califica
          frecuencia, claridad de reglas, complejidad y calidad del dato; de ahí salen el potencial y
          las horas que se podrían liberar. Automatizar un proceso malo solo produce desorden más
          rápido: por eso existe la salida "rediseñar antes".
        </p>
      </header>

      {desdeCarga.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">PC-2</span>
          <span style={{ flex: 1 }}>
            La carga de trabajo tiene {desdeCarga.length} actividad(es) con horas calculadas. Puedes
            traerlas para evaluarlas aquí.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer de la carga
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Horas liberables al mes"
          valor={liberables ? liberables.toFixed(1) : '—'}
          pie={horasTotal ? 'De ' + horasTotal.toFixed(0) + ' horas evaluadas' : 'Captura horas y califica'}
          ember={liberables > 0}
        />
        <Cifra label="Con potencial real" valor={altas + '/' + filas.length} pie="Puntaje de 55 o más" />
        <Cifra
          label="La mejor candidata"
          valor={filas.length && filas[0].score ? filas[0].score.toFixed(0) : '—'}
          pie={filas.length && filas[0].score ? filas[0].actividad : 'Sin evaluar'}
        />
      </div>

      <Bloque titulo="Evaluación" meta="ESCALA 1 A 5 POR CRITERIO">
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Actividad</th>
                <th className="num">Horas/mes</th>
                {CRITERIOS_AUTO.map((c) => (
                  <th className="num" key={c.id} title={c.pista}>
                    {c.nombre}
                  </th>
                ))}
                <th className="num">Potencial</th>
                <th>Veredicto</th>
                <th className="num">Liberables</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {as.map((a) => {
                const f = filas.find((x) => x.id === a.id);
                return (
                  <tr key={a.id} className={f && f.score >= 75 ? 'is-lider' : ''}>
                    <td>
                      <input className="tabla__input" value={a.actividad} placeholder="Qué se hace" onChange={(e) => editar(a.id, 'actividad', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={a.horasMes} onChange={(e) => editar(a.id, 'horasMes', e.target.value)} />
                    </td>
                    {CRITERIOS_AUTO.map((c) => (
                      <td className="num" key={c.id}>
                        <input
                          className="tabla__input tabla__input--num"
                          type="number"
                          min="1"
                          max="5"
                          value={a[c.id]}
                          onChange={(e) => editar(a.id, c.id, num(e.target.value))}
                        />
                      </td>
                    ))}
                    <td className="num">
                      <span className="dato dato--fuerte">{f ? f.score.toFixed(0) : '—'}</span>
                    </td>
                    <td>
                      <span className={'pill ' + (f ? f.v.pill : 'pill--neutro')}>{f ? f.v.texto : 'Sin evaluar'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f && f.liberables ? f.liberables.toFixed(1) : '—'}</span>
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
            + Agregar actividad
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          El potencial pesa la claridad de reglas por encima de todo (35%), luego frecuencia y
          simplicidad (25% cada una) y al final la calidad del dato (15%). Las horas liberables son
          las de la actividad afectadas por ese potencial: una estimación, no una promesa.
        </p>
      </Bloque>

      {filas.length > 0 && (
        <Bloque titulo="Ranking de potencial" meta="DE 0 A 100">
          {filas.map((f) => (
            <div className="marcador" key={f.id}>
              <span className="marcador__nombre">{f.actividad}</span>
              <Barra pct={f.score} tono={f.score >= 75 ? 'ok' : f.score >= 55 ? null : f.score >= 35 ? 'warn' : 'stop'} />
              <span className="marcador__valor">{f.score.toFixed(0)}</span>
            </div>
          ))}
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   PC-7 · Simulador de Liberación de Capacidad
   ========================================================================= */

export function Simulador({ estado, set }) {
  const s = estado.simulador;
  const campo = (k, v) => set({ ...estado, simulador: { ...s, [k]: v } });

  const liberablesBase = estado.automatizables
    .filter((a) => a.actividad.trim())
    .reduce((a, x) => a + (num(x.horasMes) * potencialDe(x)) / 100, 0);

  const adopcion = num(s.adopcion) / 100;
  const horasLiberadas = liberablesBase * adopcion;
  const costoHora = num(s.costoHora);
  const ahorroMes = horasLiberadas * costoHora;
  const minUnidad = num(s.minUnidad);
  const capacidadExtra = minUnidad ? (horasLiberadas * 60) / minUnidad : 0;

  const vivos = recursosVivos(estado);
  const capActual = vivos.reduce((a, r) => a + capacidadDe(r).efectiva, 0);
  const cargaActual = vivos.reduce((a, r) => a + cargaDe(estado, r.id), 0);
  const cargaNueva = Math.max(0, cargaActual - horasLiberadas);
  const utilActual = capActual ? (cargaActual / capActual) * 100 : 0;
  const utilNueva = capActual ? (cargaNueva / capActual) * 100 : 0;

  const horasPersonaMes = num(s.horasPersonaMes) || 160;
  const personasEq = horasLiberadas / horasPersonaMes;
  const aumentoProd = cargaNueva && cargaActual > cargaNueva ? ((cargaActual - cargaNueva) / cargaNueva) * 100 : 0;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Simulador de Liberación de Capacidad</h2>
        <p className="tool__intro">
          Qué pasa si se libera el tiempo que hoy se va en trabajo automatizable. La capacidad
          liberada no es ahorro por sí sola: es una decisión. O se convierte en más volumen con la
          misma gente, o la gente se dedica a otra cosa. Si no se decide, se evapora.
        </p>
      </header>

      {liberablesBase === 0 && (
        <div className="aviso">
          <span className="aviso__clave">PC-6</span>
          <span>No hay actividades evaluadas como automatizables. Califícalas y regresa a simular.</span>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Horas liberadas al mes"
          valor={horasLiberadas ? horasLiberadas.toFixed(1) : '—'}
          pie={liberablesBase ? 'De ' + liberablesBase.toFixed(1) + ' h potenciales, al ' + (s.adopcion || 0) + '% de adopción' : 'Evalúa actividades en PC-6'}
          ember={horasLiberadas > 0}
        />
        <Cifra
          label="Ahorro anual"
          valor={ahorroMes ? moneda(ahorroMes * 12) : '—'}
          pie={ahorroMes ? moneda(ahorroMes) + ' al mes' : 'Captura el costo hora'}
        />
        <Cifra
          label="Equivale a"
          valor={personasEq >= 0.1 ? personasEq.toFixed(1) + ' personas' : '—'}
          pie={'Tiempo completo, a ' + horasPersonaMes + ' h al mes'}
        />
      </div>

      <Bloque titulo="Supuestos" meta="LO QUE SE DECIDE">
        <div className="rejilla">
          <Campo
            label="Adopción esperada (%)"
            valor={s.adopcion}
            onChange={(v) => campo('adopcion', v)}
            pista="Qué parte del potencial se implementa de verdad. Ser optimista aquí cuesta caro."
          />
          <Campo label="Costo hora-hombre" valor={s.costoHora} onChange={(v) => campo('costoHora', v)} pista="Para valuar las horas liberadas." />
          <Campo
            label="Minutos por unidad"
            valor={s.minUnidad}
            onChange={(v) => campo('minUnidad', v)}
            pista="Cuánto toma producir una unidad más, para traducir horas en volumen."
          />
          <Campo
            label="Horas por persona al mes"
            valor={s.horasPersonaMes}
            onChange={(v) => campo('horasPersonaMes', v)}
            pista="Base para convertir horas en personas equivalentes."
          />
        </div>
      </Bloque>

      <Bloque titulo="Qué cambia" meta="ANTES Y DESPUÉS">
        <div className="comp comp--head">
          <span>Concepto</span>
          <span style={{ textAlign: 'right' }}>Hoy</span>
          <span style={{ textAlign: 'right' }}>Con la liberación</span>
          <span style={{ textAlign: 'right' }}>Cambio</span>
          <span style={{ textAlign: 'right' }}>%</span>
        </div>

        <div className="comp">
          <span className="comp__nombre">Carga de trabajo</span>
          <span className="comp__valor">{cargaActual ? Math.round(cargaActual).toLocaleString('es-MX') + ' h' : '—'}</span>
          <span className="comp__valor comp__valor--futuro">{cargaActual ? Math.round(cargaNueva).toLocaleString('es-MX') + ' h' : '—'}</span>
          <span className="comp__delta comp__delta--baja">{horasLiberadas ? '−' + Math.round(horasLiberadas).toLocaleString('es-MX') + ' h' : '—'}</span>
          <span className="comp__delta comp__delta--baja">
            {cargaActual && horasLiberadas ? ((horasLiberadas / cargaActual) * 100).toFixed(0) + '%' : '—'}
          </span>
        </div>

        <div className="comp">
          <span className="comp__nombre">Utilización</span>
          <span className="comp__valor">{utilActual ? utilActual.toFixed(0) + '%' : '—'}</span>
          <span className="comp__valor comp__valor--futuro">{utilActual ? utilNueva.toFixed(0) + '%' : '—'}</span>
          <span className="comp__delta comp__delta--baja">{utilActual && horasLiberadas ? '−' + (utilActual - utilNueva).toFixed(0) + ' pts' : '—'}</span>
          <span className="comp__delta">—</span>
        </div>

        <div className="comp">
          <span className="comp__nombre">Capacidad adicional</span>
          <span className="comp__valor">—</span>
          <span className="comp__valor comp__valor--futuro">{capacidadExtra ? '+' + Math.floor(capacidadExtra).toLocaleString('es-MX') + ' u' : '—'}</span>
          <span className="comp__delta comp__delta--baja">{capacidadExtra ? '+' + Math.floor(capacidadExtra).toLocaleString('es-MX') : '—'}</span>
          <span className="comp__delta">—</span>
        </div>

        <div className="comp">
          <span className="comp__nombre">Productividad</span>
          <span className="comp__valor">Base</span>
          <span className="comp__valor comp__valor--futuro">{aumentoProd ? '+' + aumentoProd.toFixed(0) + '%' : '—'}</span>
          <span className="comp__delta comp__delta--baja">{aumentoProd ? '+' + aumentoProd.toFixed(0) + '%' : '—'}</span>
          <span className="comp__delta">—</span>
        </div>
      </Bloque>

      <Bloque titulo="Cierre" meta="CONCLUSIÓN · DECISIÓN">
        <div className="rejilla">
          <Campo
            label="Qué se hace con las horas liberadas"
            valor={s.destino}
            onChange={(v) => campo('destino', v)}
            area
            ancho
            pista="Más volumen, mejor servicio, otro proyecto o menos gente. Nombra una sola."
          />
          <Campo
            label="Qué se decide"
            valor={s.decision}
            onChange={(v) => campo('decision', v)}
            area
            ancho
            pista="Qué se automatiza primero, quién responde y para cuándo."
          />
        </div>
      </Bloque>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_PC = {
  recursos: [nuevoRecurso()],
  cargas: [nuevaCarga()],
  lineas: [nuevaLinea()],
  automatizables: [nuevaAuto()],
  simulador: {
    adopcion: '70',
    costoHora: '',
    minUnidad: '',
    horasPersonaMes: '160',
    destino: '',
    decision: '',
  },
};
