import { useState } from 'react';
import { Bloque, Campo, Barra, Cifra, MiniLista } from '../lib/ui.jsx';
import { num, moneda, nuevoItem } from '../lib/util.js';
import { pedirIA, SISTEMA_UPAX, BotonIA, usaIA } from '../lib/ia.jsx';
/* =========================================================================
   MÓDULO RP · RESOLUCIÓN DE PROBLEMAS
     RP-1 Definición ─→ RP-3 Porqués ─┐
     RP-2 Pareto ─────────────────────┤
     RP-4 Ishikawa ───────────────────┴─→ RP-5 Validación ─→ RP-6 Soluciones
     Todo lo anterior ────────────────────────────────────→ RP-7 A3
   Dos pestañas usan la API de Claude: los cinco porqués y el generador.
   ========================================================================= */

/* =========================================================================
   RP-1 · Definición Estructurada del Problema
   ========================================================================= */

export function Definicion({ estado, set, otros }) {
  const d = estado.definicion;
  const campo = (k, v) => set({ ...estado, definicion: { ...d, [k]: v } });

  const problemasDp = otros.dp.problemas.filter((p) => p.problema.trim());

  const traer = (p) =>
    set({
      ...estado,
      definicion: { ...d, que: p.problema, donde: p.area, evidencia: p.evidencia, quien: p.responsable },
    });

  const llenos = ['que', 'donde', 'desdeCuando', 'frecuencia', 'impacto'].filter((k) => (d[k] || '').trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Definición Estructurada del Problema</h2>
        <p className="tool__intro">
          Un problema bien planteado ya trae la mitad de la solución. Aquí no se buscan culpables ni
          causas todavía: se describe el hecho con precisión. Si no puedes decir dónde ocurre y desde
          cuándo, no tienes un problema definido: tienes una molestia.
        </p>
      </header>

      {problemasDp.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-5</span>
          <span style={{ flex: 1 }}>
            La matriz de problemas tiene {problemasDp.length} registro(s). Puedes traer uno como base.
          </span>
          <select
            className="tabla__select"
            style={{ maxWidth: 260 }}
            value=""
            onChange={(e) => {
              const p = problemasDp.find((x) => x.id === e.target.value);
              if (p) traer(p);
            }}
          >
            <option value="">Elegir problema…</option>
            {problemasDp.map((p) => (
              <option key={p.id} value={p.id}>
                {p.problema}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="tablero">
        <Cifra label="Definición" valor={llenos + '/5'} pie="Campos esenciales capturados" ember={llenos === 5} />
        <Cifra
          label="Impacto declarado"
          valor={d.impacto ? d.impacto : '—'}
          pie="Sin cifra, el problema no compite por recursos"
        />
        <Cifra label="Frecuencia" valor={d.frecuencia || '—'} pie="Cada cuándo ocurre" />
      </div>

      <Bloque titulo="El hecho" meta="QUÉ · DÓNDE · CUÁNDO">
        <div className="rejilla">
          <Campo
            label="Qué ocurre"
            valor={d.que}
            onChange={(v) => campo('que', v)}
            area
            ancho
            pista="El defecto observable, no la causa ni la falta de solución."
          />
          <Campo label="Dónde ocurre" valor={d.donde} onChange={(v) => campo('donde', v)} pista="Área, etapa, turno, máquina o sucursal." />
          <Campo label="Desde cuándo" valor={d.desdeCuando} onChange={(v) => campo('desdeCuando', v)} pista="Fecha o evento a partir del cual aparece." />
          <Campo label="Con qué frecuencia" valor={d.frecuencia} onChange={(v) => campo('frecuencia', v)} pista="Veces por día, semana o mes." />
          <Campo label="Impacto" valor={d.impacto} onChange={(v) => campo('impacto', v)} pista="En pesos, horas, clientes o piezas." />
          <Campo label="Quién lo detecta" valor={d.quien} onChange={(v) => campo('quien', v)} pista="El cliente, el área siguiente o el propio equipo." />
          <Campo label="Evidencia" valor={d.evidencia} onChange={(v) => campo('evidencia', v)} area ancho pista="Reporte, medición, bitácora o queja concreta." />
        </div>
      </Bloque>

      <Bloque titulo="Dónde no ocurre" meta="LO QUE DELIMITA">
        <p className="nota" style={{ marginBottom: 'var(--sp-4)' }}>
          La comparación entre dónde sí pasa y dónde no pasa es la que suele señalar la causa. Si
          falla en un turno y no en el otro, con la misma máquina y el mismo material, la causa está
          en lo que cambia entre los dos.
        </p>
        <div className="rejilla">
          <Campo label="Dónde no ocurre" valor={d.noDonde} onChange={(v) => campo('noDonde', v)} pista="Áreas o equipos similares donde no aparece." />
          <Campo label="Cuándo no ocurre" valor={d.noCuando} onChange={(v) => campo('noCuando', v)} pista="Turnos, días o condiciones sin el problema." />
          <Campo label="Qué cambia entre uno y otro" valor={d.diferencia} onChange={(v) => campo('diferencia', v)} area ancho pista="La diferencia concreta. Aquí suele estar la pista." />
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   RP-2 · Pareto de Problemas
   ========================================================================= */

const nuevaIncidencia = () => ({
  id: 'in' + Date.now() + Math.random().toString(16).slice(2, 6),
  causa: '',
  frecuencia: '',
  impactoUnit: '',
});

export function Pareto({ estado, set, otros }) {
  const items = estado.pareto;

  const editar = (id, k, v) => set({ ...estado, pareto: items.map((i) => (i.id === id ? { ...i, [k]: v } : i)) });
  const agregar = () => set({ ...estado, pareto: [...items, nuevaIncidencia()] });
  const borrar = (id) => {
    if (items.length <= 1) return;
    set({ ...estado, pareto: items.filter((i) => i.id !== id) });
  };

  const problemasDp = otros.dp.problemas.filter((p) => p.problema.trim());
  const importar = () => {
    const nuevas = problemasDp.map((p) => ({ ...nuevaIncidencia(), id: 'in' + p.id, causa: p.problema, frecuencia: '', impactoUnit: '' }));
    const vacio = items.filter((i) => i.causa.trim()).length === 0;
    set({ ...estado, pareto: vacio ? nuevas : [...items, ...nuevas] });
  };

  const filas = items
    .filter((i) => i.causa.trim())
    .map((i) => ({ ...i, total: num(i.frecuencia) * num(i.impactoUnit) }))
    .sort((a, b) => b.total - a.total);

  const total = filas.reduce((a, f) => a + f.total, 0);
  let acum = 0;
  const conAcum = filas.map((f) => {
    acum += f.total;
    return { ...f, acumPct: total ? (acum / total) * 100 : 0, pct: total ? (f.total / total) * 100 : 0 };
  });

  const corte = conAcum.findIndex((f) => f.acumPct >= 80);
  const vitales = corte >= 0 ? corte + 1 : 0;
  const maxTotal = Math.max(...conAcum.map((f) => f.total), 1);
  const pesoVitales = vitales && total ? (conAcum.slice(0, vitales).reduce((a, f) => a + f.total, 0) / total) * 100 : 0;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Pareto de Problemas</h2>
        <p className="tool__intro">
          Pocas causas explican casi todo el daño. Captura frecuencia e impacto unitario; la
          herramienta ordena, acumula y marca dónde se junta el 80%. Todo lo que queda a la derecha
          de esa línea puede esperar sin que nadie lo note.
        </p>
      </header>

      {problemasDp.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">DP-5</span>
          <span style={{ flex: 1 }}>
            Hay {problemasDp.length} problema(s) en la matriz. Tráelos y ponles frecuencia e impacto.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer problemas
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Las pocas vitales"
          valor={vitales || '—'}
          pie={vitales ? 'De ' + conAcum.length + ' causas, concentran el ' + pesoVitales.toFixed(0) + '%' : 'Captura frecuencia e impacto'}
          ember={vitales > 0}
        />
        <Cifra label="Impacto total" valor={total ? moneda(total) : '—'} pie="Suma de todas las incidencias" />
        <Cifra
          label="La primera causa"
          valor={conAcum.length && conAcum[0].total ? conAcum[0].pct.toFixed(0) + '%' : '—'}
          pie={conAcum.length && conAcum[0].total ? conAcum[0].causa : 'Sin datos'}
        />
      </div>

      {total > 0 && (
        <Bloque titulo="Concentración del impacto" meta="LÍNEA PUNTEADA: 80%">
          <div className="pareto">
            <div className="pareto__corte" style={{ bottom: 'calc(20% + 18px)' }}>
              <span>80%</span>
            </div>
            {conAcum.map((f, i) => (
              <div className="pareto__col" key={f.id} title={f.causa + ' · ' + moneda(f.total)}>
                <div
                  className={i < vitales ? 'pareto__punto' : 'pareto__punto'}
                  style={{ bottom: 'calc(' + f.acumPct + '% - 18px + 18px)', left: '50%' }}
                />
                <div
                  className={i < vitales ? 'pareto__barra pareto__barra--vital' : 'pareto__barra'}
                  style={{ height: 'calc(' + (f.total / maxTotal) * 82 + '% )' }}
                />
                <span className="pareto__etiqueta">{f.acumPct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div className="leyenda">
            <span className="leyenda__item">
              <span className="leyenda__punto" style={{ background: 'var(--upax-ember)' }} /> Las pocas vitales
            </span>
            <span className="leyenda__item">
              <span className="leyenda__punto" style={{ background: 'var(--upax-ink)' }} /> Las muchas triviales
            </span>
            <span className="leyenda__item">
              <span className="leyenda__punto" style={{ background: 'var(--stop)' }} /> Acumulado
            </span>
          </div>
        </Bloque>
      )}

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Causa o incidencia</th>
                <th className="num">Frecuencia</th>
                <th className="num">Impacto unitario</th>
                <th className="num">Impacto total</th>
                <th className="num">Peso</th>
                <th className="num">Acumulado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const f = conAcum.find((x) => x.id === it.id);
                const i = conAcum.findIndex((x) => x.id === it.id);
                return (
                  <tr key={it.id} className={f && i < vitales ? 'is-lider' : ''}>
                    <td className="num">
                      <span className="dato">{f ? String(i + 1).padStart(2, '0') : '—'}</span>
                    </td>
                    <td>
                      <input className="tabla__input" value={it.causa} placeholder="Qué falla" onChange={(e) => editar(it.id, 'causa', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={it.frecuencia} onChange={(e) => editar(it.id, 'frecuencia', e.target.value)} />
                    </td>
                    <td className="num">
                      <input className="tabla__input tabla__input--num" value={it.impactoUnit} onChange={(e) => editar(it.id, 'impactoUnit', e.target.value)} />
                    </td>
                    <td className="num">
                      <span className="dato dato--fuerte">{f && f.total ? moneda(f.total) : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f && f.pct ? f.pct.toFixed(0) + '%' : '—'}</span>
                    </td>
                    <td className="num">
                      <span className="dato">{f && f.acumPct ? f.acumPct.toFixed(0) + '%' : '—'}</span>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(it.id)} disabled={items.length <= 1} title="Quitar">
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
            + Agregar incidencia
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   RP-3 · Cinco Porqués Asistido por IA
   ========================================================================= */

export function Porques({ estado, set }) {
  const p = estado.porques;
  const { cargando, error, correr } = usaIA();
  const [sugerencia, setSugerencia] = useState(null);
  const [critica, setCritica] = useState(null);

  const sintoma = p.sintoma || estado.definicion.que;

  const campo = (k, v) => set({ ...estado, porques: { ...p, [k]: v } });
  const responder = (i, v) =>
    set({ ...estado, porques: { ...p, cadena: p.cadena.map((c, j) => (j === i ? v : c)) } });

  const contestados = p.cadena.filter((c) => c.trim()).length;
  const siguiente = p.cadena.findIndex((c) => !c.trim());

  const cadenaTexto = () =>
    p.cadena
      .map((c, i) => (c.trim() ? 'Por qué ' + (i + 1) + ': ' + c : null))
      .filter(Boolean)
      .join('\n');

  const pedirSiguiente = () =>
    correr(async () => {
      const nivel = siguiente === -1 ? 5 : siguiente + 1;
      const prompt =
        'Problema observado: ' + sintoma + '\n\n' +
        (cadenaTexto() ? 'Cadena de porqués hasta ahora:\n' + cadenaTexto() + '\n\n' : '') +
        'Propón UNA sola respuesta probable al porqué número ' + nivel + '. ' +
        'Debe ser una causa, no una falta de solución (no digas "porque no hay control"; di qué falla). ' +
        'Máximo 25 palabras. Responde solo con la frase, sin numeración ni comillas.';
      const r = await pedirIA(prompt, SISTEMA_UPAX);
      if (r) setSugerencia({ nivel: nivel - 1, texto: r });
      return r;
    });

  const pedirCritica = () =>
    correr(async () => {
      const prompt =
        'Problema: ' + sintoma + '\n\nCadena de cinco porqués:\n' + cadenaTexto() +
        '\n\nCausa raíz propuesta: ' + (p.causaRaiz || '(sin definir)') +
        '\n\nRevisa la cadena en máximo 90 palabras. Señala: si algún eslabón salta de nivel, ' +
        'si alguna respuesta culpa a una persona en vez de al proceso, si alguna es una falta de solución ' +
        'disfrazada de causa, y si la causa raíz resiste la prueba de "si esto se elimina, el problema desaparece".';
      const r = await pedirIA(prompt, SISTEMA_UPAX);
      if (r) setCritica(r);
      return r;
    });

  const aceptar = () => {
    if (!sugerencia) return;
    responder(sugerencia.nivel, sugerencia.texto);
    setSugerencia(null);
  };

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Cinco Porqués Asistido por IA</h2>
        <p className="tool__intro">
          Del síntoma a la causa raíz, bajando un nivel a la vez. La regla: cada respuesta es una
          causa, no la ausencia de una solución. "Porque no hay checklist" no es causa raíz; es la
          solución que se te ocurrió, disfrazada. La IA propone y critica, pero la cadena la sostienes tú.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Profundidad" valor={contestados + '/5'} pie="Niveles contestados" ember={contestados === 5} />
        <Cifra
          label="Causa raíz"
          valor={p.causaRaiz ? 'Definida' : '—'}
          pie={p.causaRaiz ? p.causaRaiz.slice(0, 44) : 'Todavía no la nombras'}
        />
        <Cifra
          label="Prueba de eliminación"
          valor={p.verificacion ? 'Contestada' : '—'}
          pie="Si se elimina la causa, ¿desaparece el problema?"
        />
      </div>

      <Bloque titulo="El síntoma" meta={estado.definicion.que ? 'DESDE RP-1' : 'CAPTURA LIBRE'}>
        <Campo
          label="Problema observado"
          valor={sintoma}
          onChange={(v) => campo('sintoma', v)}
          area
          ancho
          pista={estado.definicion.que ? 'Viene de la definición del problema. Puedes ajustarlo.' : 'Qué se ve fallar.'}
        />
      </Bloque>

      <Bloque titulo="La cadena" meta="UNA CAUSA POR NIVEL">
        {p.cadena.map((c, i) => (
          <div className="porque" key={i}>
            <span
              className={['porque__nivel', c.trim() ? 'is-lleno' : '', i === 4 && c.trim() ? 'is-raiz' : ''].filter(Boolean).join(' ')}
            >
              {i + 1}
            </span>
            <div className="porque__cuerpo">
              <span className="porque__pregunta">
                {i === 0 ? '¿Por qué ocurre esto?' : '¿Y por qué ocurre eso?'}
              </span>
              <div className="porque__fila">
                <textarea
                  className="campo__area"
                  style={{ minHeight: 54 }}
                  value={c}
                  placeholder="Porque…"
                  onChange={(e) => responder(i, e.target.value)}
                />
              </div>
              {sugerencia && sugerencia.nivel === i && (
                <div className="sugerencia">
                  <span className="sugerencia__texto">{sugerencia.texto}</span>
                  <button className="boton--sec" onClick={aceptar}>
                    Usar
                  </button>
                  <button className="boton--icono" onClick={() => setSugerencia(null)} title="Descartar">
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <BotonIA cargando={cargando} onClick={pedirSiguiente} disabled={!sintoma.trim() || siguiente === -1}>
            Sugerir el siguiente porqué
          </BotonIA>
          <BotonIA sec cargando={cargando} onClick={pedirCritica} disabled={contestados < 3}>
            Criticar la cadena
          </BotonIA>
        </div>

        {error && <p className="ia-error">{error}</p>}

        {critica && (
          <div className="sugerencia" style={{ marginTop: 'var(--sp-4)' }}>
            <span className="sugerencia__texto">{critica}</span>
            <button className="boton--icono" onClick={() => setCritica(null)} title="Cerrar">
              ×
            </button>
          </div>
        )}
      </Bloque>

      <Bloque titulo="El fondo" meta="CAUSA RAÍZ Y PRUEBA">
        <div className="rejilla">
          <Campo
            label="Causa raíz"
            valor={p.causaRaiz}
            onChange={(v) => campo('causaRaiz', v)}
            area
            ancho
            pista="Algo del proceso o del sistema, no una persona."
          />
          <Campo
            label="Si se elimina esta causa, ¿desaparece el problema?"
            valor={p.verificacion}
            onChange={(v) => campo('verificacion', v)}
            area
            ancho
            pista="Si la respuesta es 'quizá', no llegaste al fondo."
          />
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   RP-4 · Diagrama de Ishikawa
   ========================================================================= */

export const CATEGORIAS_ISHIKAWA = [
  { id: 'metodo', nombre: 'Método', pista: 'Cómo se hace el trabajo: secuencia, estándar, criterios.' },
  { id: 'personas', nombre: 'Personas', pista: 'Habilidad, carga, claridad del rol. El proceso, no el culpable.' },
  { id: 'tecnologia', nombre: 'Tecnología', pista: 'Sistemas, equipo, herramienta, mantenimiento.' },
  { id: 'informacion', nombre: 'Información', pista: 'Dato tarde, incompleto, contradictorio o inexistente.' },
  { id: 'materiales', nombre: 'Materiales', pista: 'Insumos, proveedores, especificación, disponibilidad.' },
  { id: 'entorno', nombre: 'Entorno', pista: 'Espacio, ruido, prisa, temporada, presión externa.' },
];

function Espina({ problema, causas }) {
  const arriba = CATEGORIAS_ISHIKAWA.slice(0, 3);
  const abajo = CATEGORIAS_ISHIKAWA.slice(3);
  const W = 760;
  const H = 300;
  const ejeY = H / 2;
  const cabezaX = W - 128;

  const ramaX = (i) => 110 + i * 175;

  return (
    <svg className="espina" viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label="Diagrama de causa y efecto">
      <line x1="16" y1={ejeY} x2={cabezaX} y2={ejeY} stroke="var(--upax-ink)" strokeWidth="2" />
      <polygon points={cabezaX + ',' + (ejeY - 5) + ' ' + (cabezaX + 10) + ',' + ejeY + ' ' + cabezaX + ',' + (ejeY + 5)} fill="var(--upax-ink)" />

      <rect x={cabezaX + 8} y={ejeY - 30} width="118" height="60" rx="6" fill="var(--upax-ink)" />
      <foreignObject x={cabezaX + 14} y={ejeY - 24} width="106" height="48">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.25,
            overflow: 'hidden',
          }}
        >
          {problema || 'Define el problema en RP-1'}
        </div>
      </foreignObject>

      {arriba.map((c, i) => {
        const x = ramaX(i);
        const topY = 44;
        const lista = causas[c.id].filter((t) => t.text.trim());
        return (
          <g key={c.id}>
            <line x1={x} y1={topY} x2={x + 52} y2={ejeY} stroke="var(--line-strong)" strokeWidth="1.5" />
            <text className="espina__cat" x={x - 4} y={topY - 8} textAnchor="middle">
              {c.nombre}
            </text>
            {lista.slice(0, 4).map((t, j) => (
              <g key={t.id}>
                <line
                  x1={x + 14 + j * 12}
                  y1={topY + 26 + j * 26}
                  x2={x + 56 + j * 12}
                  y2={topY + 26 + j * 26}
                  stroke="var(--upax-ember)"
                  strokeWidth="1"
                />
                <text className="espina__causa" x={x + 60 + j * 12} y={topY + 29 + j * 26}>
                  {t.text.length > 22 ? t.text.slice(0, 21) + '…' : t.text}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {abajo.map((c, i) => {
        const x = ramaX(i);
        const botY = H - 44;
        const lista = causas[c.id].filter((t) => t.text.trim());
        return (
          <g key={c.id}>
            <line x1={x} y1={botY} x2={x + 52} y2={ejeY} stroke="var(--line-strong)" strokeWidth="1.5" />
            <text className="espina__cat" x={x - 4} y={botY + 16} textAnchor="middle">
              {c.nombre}
            </text>
            {lista.slice(0, 4).map((t, j) => (
              <g key={t.id}>
                <line
                  x1={x + 14 + j * 12}
                  y1={botY - 26 - j * 26}
                  x2={x + 56 + j * 12}
                  y2={botY - 26 - j * 26}
                  stroke="var(--upax-ember)"
                  strokeWidth="1"
                />
                <text className="espina__causa" x={x + 60 + j * 12} y={botY - 23 - j * 26}>
                  {t.text.length > 22 ? t.text.slice(0, 21) + '…' : t.text}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function Ishikawa({ estado, set }) {
  const ish = estado.ishikawa;

  const guardar = (cat, items) => set({ ...estado, ishikawa: { ...ish, [cat]: items } });
  const onUpdate = (cat) => (id, text) => guardar(cat, ish[cat].map((i) => (i.id === id ? { ...i, text } : i)));
  const onAdd = (cat) => () => guardar(cat, [...ish[cat], nuevoItem()]);
  const onRemove = (cat) => (id) => {
    if (ish[cat].length <= 1) return;
    guardar(cat, ish[cat].filter((i) => i.id !== id));
  };

  const cuenta = (cat) => ish[cat].filter((i) => i.text.trim()).length;
  const total = CATEGORIAS_ISHIKAWA.reduce((a, c) => a + cuenta(c.id), 0);
  const conCausas = CATEGORIAS_ISHIKAWA.filter((c) => cuenta(c.id) > 0);
  const mayor = conCausas.length ? conCausas.reduce((a, c) => (cuenta(c.id) > cuenta(a.id) ? c : a)) : null;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Diagrama de Ishikawa</h2>
        <p className="tool__intro">
          Las causas posibles, ordenadas por categoría. Sirve para dos cosas: no quedarse con la
          primera explicación que apareció, y ver de qué lado se está cargando el diagnóstico. Si
          todas las causas caen en Personas, el análisis todavía no empieza.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Causas identificadas" valor={total || '—'} pie="En las seis categorías" ember={total > 0} />
        <Cifra
          label="Categorías con causas"
          valor={conCausas.length + '/6'}
          pie={conCausas.length < 3 && total > 0 ? 'Explora las que faltan antes de concluir' : 'Cobertura del análisis'}
        />
        <Cifra
          label="Dónde se concentra"
          valor={mayor ? cuenta(mayor.id) : '—'}
          pie={mayor ? mayor.nombre : 'Captura causas'}
          ember={mayor && mayor.id === 'personas' && cuenta('personas') > total / 2}
        />
      </div>

      <Bloque titulo="Causa y efecto" meta="SE DIBUJA CON LO QUE CAPTURES">
        <Espina problema={estado.definicion.que} causas={ish} />
        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          El diagrama muestra hasta cuatro causas por categoría. La captura completa está abajo.
        </p>
      </Bloque>

      <Bloque titulo="Causas por categoría" meta="CAPTURA">
        <div className="ishikawa">
          {CATEGORIAS_ISHIKAWA.map((c) => (
            <div className="sipoc__col" key={c.id}>
              <div className="sipoc__cabeza">
                <span className="sipoc__titulo">{c.nombre}</span>
                <span className="sipoc__cuenta">{cuenta(c.id)}</span>
              </div>
              <p className="sipoc__pista">{c.pista}</p>
              <MiniLista
                items={ish[c.id]}
                placeholder="Causa posible"
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
   RP-5 · Matriz de Validación de Causas
   ========================================================================= */

const VEREDICTOS = [
  { id: 'confirmada', corto: 'Confirmada', chip: 'chip--eliminar' },
  { id: 'descartada', corto: 'Descartada', chip: 'chip--conservar' },
  { id: 'pendiente', corto: 'Pendiente', chip: 'chip--simplificar' },
];

const nuevaHipotesis = () => ({
  id: 'hp' + Date.now() + Math.random().toString(16).slice(2, 6),
  hipotesis: '',
  origen: '',
  comprobacion: '',
  evidencia: '',
  veredicto: 'pendiente',
  responsable: '',
});

export function Validacion({ estado, set }) {
  const vs = estado.validacion;

  const editar = (id, k, v) => set({ ...estado, validacion: vs.map((x) => (x.id === id ? { ...x, [k]: v } : x)) });
  const agregar = () => set({ ...estado, validacion: [...vs, nuevaHipotesis()] });
  const borrar = (id) => {
    if (vs.length <= 1) return;
    set({ ...estado, validacion: vs.filter((x) => x.id !== id) });
  };

  const candidatas = [];
  CATEGORIAS_ISHIKAWA.forEach((c) => {
    estado.ishikawa[c.id]
      .filter((i) => i.text.trim())
      .forEach((i) => candidatas.push({ id: i.id, texto: i.text, origen: c.nombre }));
  });
  if (estado.porques.causaRaiz.trim()) {
    candidatas.push({ id: 'raiz', texto: estado.porques.causaRaiz, origen: 'Cinco porqués' });
  }

  const yaEstan = vs.map((v) => v.hipotesis.trim());
  const faltan = candidatas.filter((c) => !yaEstan.includes(c.texto.trim()));

  const importar = () => {
    const nuevas = faltan.map((c) => ({ ...nuevaHipotesis(), id: 'hp' + c.id, hipotesis: c.texto, origen: c.origen }));
    const vacio = vs.filter((v) => v.hipotesis.trim()).length === 0;
    set({ ...estado, validacion: vacio ? nuevas : [...vs, ...nuevas] });
  };

  const llenas = vs.filter((v) => v.hipotesis.trim());
  const confirmadas = llenas.filter((v) => v.veredicto === 'confirmada');
  const descartadas = llenas.filter((v) => v.veredicto === 'descartada').length;
  const sinEvidencia = confirmadas.filter((v) => !v.evidencia.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Matriz de Validación de Causas</h2>
        <p className="tool__intro">
          Una hipótesis se vuelve causa cuando hay evidencia, no cuando hay consenso. Aquí cada
          sospecha pasa por la misma prueba: cómo se comprueba, qué se encontró y quién lo verificó.
          Las que sobreviven son las que se atacan.
        </p>
      </header>

      {faltan.length > 0 && (
        <div className="aviso">
          <span className="aviso__clave">RP-3 · RP-4</span>
          <span style={{ flex: 1 }}>
            Hay {faltan.length} causa(s) del Ishikawa y los porqués que todavía no pasan por
            validación.
          </span>
          <button className="boton--sec" onClick={importar}>
            Traer causas
          </button>
        </div>
      )}

      <div className="tablero">
        <Cifra
          label="Causas confirmadas"
          valor={confirmadas.length || '—'}
          pie={llenas.length ? 'De ' + llenas.length + ' hipótesis puestas a prueba' : 'Captura hipótesis'}
          ember={confirmadas.length > 0}
        />
        <Cifra label="Descartadas" valor={descartadas || '0'} pie="Sospechas que la evidencia tumbó" />
        <Cifra
          label="Confirmadas sin evidencia"
          valor={sinEvidencia || '0'}
          pie={sinEvidencia ? 'Eso no es confirmación: es opinión' : 'Todas las confirmadas tienen sustento'}
          ember={sinEvidencia > 0}
        />
      </div>

      <Bloque>
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Hipótesis</th>
                <th>Origen</th>
                <th>Cómo se comprueba</th>
                <th>Qué se encontró</th>
                <th>Veredicto</th>
                <th>Verificó</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vs.map((v) => (
                <tr key={v.id} className={v.hipotesis.trim() && v.veredicto === 'confirmada' ? 'is-lider' : ''}>
                  <td>
                    <input className="tabla__input" value={v.hipotesis} placeholder="Se sospecha que…" onChange={(e) => editar(v.id, 'hipotesis', e.target.value)} />
                  </td>
                  <td>
                    <span className="dato">{v.origen || '—'}</span>
                  </td>
                  <td>
                    <input className="tabla__input" value={v.comprobacion} placeholder="Medición, muestreo, prueba" onChange={(e) => editar(v.id, 'comprobacion', e.target.value)} />
                  </td>
                  <td>
                    <input className="tabla__input" value={v.evidencia} placeholder="El dato encontrado" onChange={(e) => editar(v.id, 'evidencia', e.target.value)} />
                  </td>
                  <td>
                    <div className="chips">
                      {VEREDICTOS.map((x) => (
                        <button
                          key={x.id}
                          className={['chip', x.chip, v.veredicto === x.id ? 'is-activo' : ''].filter(Boolean).join(' ')}
                          onClick={() => editar(v.id, 'veredicto', x.id)}
                        >
                          {x.corto}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input className="tabla__input" value={v.responsable} placeholder="Quién" onChange={(e) => editar(v.id, 'responsable', e.target.value)} />
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
            + Agregar hipótesis
          </button>
        </div>
      </Bloque>
    </div>
  );
}

/* =========================================================================
   RP-6 · Generador y Evaluador de Soluciones
   ========================================================================= */

const CRITERIOS_SOL = [
  { id: 'impacto', nombre: 'Impacto', pista: 'Cuánto resuelve del problema.', mayorMejor: true },
  { id: 'costo', nombre: 'Costo', pista: 'Qué tan caro es. 5 es carísimo.', mayorMejor: false },
  { id: 'tiempo', nombre: 'Tiempo', pista: 'Qué tanto tarda. 5 es larguísimo.', mayorMejor: false },
  { id: 'riesgo', nombre: 'Riesgo', pista: 'Qué puede salir mal. 5 es riesgo alto.', mayorMejor: false },
  { id: 'viabilidad', nombre: 'Viabilidad', pista: 'Qué tan factible con lo que hay hoy.', mayorMejor: true },
];

const nuevaSolucion = () => ({
  id: 'sl' + Date.now() + Math.random().toString(16).slice(2, 6),
  nombre: '',
  impacto: 3,
  costo: 3,
  tiempo: 3,
  riesgo: 3,
  viabilidad: 3,
});

export function scoreSolucion(s, pesos) {
  const suma = CRITERIOS_SOL.reduce((a, c) => a + (pesos[c.id] || 0), 0);
  if (!suma) return 0;
  const total = CRITERIOS_SOL.reduce((a, c) => {
    const v = c.mayorMejor ? num(s[c.id]) : 6 - num(s[c.id]);
    return a + v * (pesos[c.id] || 0);
  }, 0);
  return total / suma;
}

export function Soluciones({ estado, set }) {
  const ss = estado.soluciones;
  const pesos = estado.pesosSol;
  const { cargando, error, correr } = usaIA();
  const [propuestas, setPropuestas] = useState([]);

  const editar = (id, k, v) => set({ ...estado, soluciones: ss.map((s) => (s.id === id ? { ...s, [k]: v } : s)) });
  const agregar = () => set({ ...estado, soluciones: [...ss, nuevaSolucion()] });
  const borrar = (id) => {
    if (ss.length <= 1) return;
    set({ ...estado, soluciones: ss.filter((s) => s.id !== id) });
  };
  const pesar = (id, v) => set({ ...estado, pesosSol: { ...pesos, [id]: num(v) } });

  const confirmadas = estado.validacion.filter((v) => v.hipotesis.trim() && v.veredicto === 'confirmada');
  const causaRaiz = estado.porques.causaRaiz;
  const problema = estado.definicion.que;

  const generar = () =>
    correr(async () => {
      const prompt =
        'Problema: ' + problema + '\n' +
        (causaRaiz ? 'Causa raíz: ' + causaRaiz + '\n' : '') +
        (confirmadas.length ? 'Causas confirmadas con evidencia:\n' + confirmadas.map((c) => '- ' + c.hipotesis).join('\n') + '\n' : '') +
        (estado.definicion.impacto ? 'Impacto actual: ' + estado.definicion.impacto + '\n' : '') +
        '\nPropón 4 soluciones distintas entre sí, ordenadas de la más simple a la más profunda. ' +
        'La primera debe ser algo que se pueda hacer esta semana sin presupuesto. Ninguna debe ser ' +
        '"capacitar al personal" ni "hacer un checklist" a secas: si propones eso, di exactamente qué cambia en el proceso. ' +
        'Responde SOLO con un arreglo JSON, sin markdown ni explicación, con esta forma: ' +
        '[{"nombre":"...","porque":"..."}]. Cada nombre en máximo 12 palabras y cada porqué en máximo 20.';
      const r = await pedirIA(prompt, SISTEMA_UPAX);
      if (!r) return null;
      try {
        const limpio = r.replace(/```json|```/g, '').trim();
        const arr = JSON.parse(limpio);
        setPropuestas(Array.isArray(arr) ? arr : []);
      } catch {
        setPropuestas([{ nombre: r.slice(0, 120), porque: '' }]);
      }
      return r;
    });

  const aceptar = (p) => {
    const vacias = ss.filter((s) => !s.nombre.trim());
    if (vacias.length) {
      set({ ...estado, soluciones: ss.map((s) => (s.id === vacias[0].id ? { ...s, nombre: p.nombre } : s)) });
    } else {
      set({ ...estado, soluciones: [...ss, { ...nuevaSolucion(), nombre: p.nombre }] });
    }
    setPropuestas(propuestas.filter((x) => x !== p));
  };

  const sumaPesos = CRITERIOS_SOL.reduce((a, c) => a + (pesos[c.id] || 0), 0);
  const orden = ss
    .filter((s) => s.nombre.trim())
    .map((s) => ({ ...s, score: scoreSolucion(s, pesos) }))
    .sort((a, b) => b.score - a.score);
  const ganadora = orden[0];

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">Generador y Evaluador de Soluciones</h2>
        <p className="tool__intro">
          Primero se abren alternativas, después se comparan con los mismos cinco criterios. Costo,
          tiempo y riesgo se invierten en el cálculo: entre más altos, peor califica la solución. La
          que gana no es la más ambiciosa: es la que mejor equilibra lo que resuelve contra lo que cuesta.
        </p>
      </header>

      <Bloque titulo="Proponer alternativas" meta={problema ? 'CON EL CONTEXTO DE RP-1 A RP-5' : 'SIN CONTEXTO'}>
        <p className="nota" style={{ marginBottom: 'var(--sp-4)' }}>
          {problema
            ? 'La IA lee el problema, la causa raíz y las causas confirmadas para proponer opciones. Tú decides cuáles entran a la tabla.'
            : 'Captura primero el problema en RP-1 para que las propuestas tengan de dónde salir.'}
        </p>

        <BotonIA cargando={cargando} onClick={generar} disabled={!problema.trim()}>
          Proponer soluciones con IA
        </BotonIA>

        {error && <p className="ia-error">{error}</p>}

        {propuestas.map((p, i) => (
          <div className="sugerencia" key={i}>
            <span className="sugerencia__texto">
              <strong>{p.nombre}</strong>
              {p.porque ? ' — ' + p.porque : ''}
            </span>
            <button className="boton--sec" onClick={() => aceptar(p)}>
              Usar
            </button>
            <button className="boton--icono" onClick={() => setPropuestas(propuestas.filter((x) => x !== p))} title="Descartar">
              ×
            </button>
          </div>
        ))}
      </Bloque>

      <div className="tablero">
        <Cifra
          label="La que gana"
          valor={ganadora && ganadora.score ? ganadora.score.toFixed(2) : '—'}
          pie={ganadora && ganadora.score ? ganadora.nombre : 'Captura alternativas'}
          ember={!!ganadora}
        />
        <Cifra label="Alternativas" valor={orden.length || '—'} pie="Puestas a comparar" />
        <Cifra
          label="Suma de pesos"
          valor={sumaPesos + '%'}
          pie={sumaPesos === 100 ? 'Correcto' : 'Ajusta hasta 100% para leer limpio'}
        />
      </div>

      <Bloque titulo="Peso de cada criterio" meta={'SUMA ' + sumaPesos + '%'}>
        <div className="rejilla">
          {CRITERIOS_SOL.map((c) => (
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
                <th>Solución</th>
                {CRITERIOS_SOL.map((c) => (
                  <th className="num" key={c.id} title={c.pista}>
                    {c.nombre}
                  </th>
                ))}
                <th className="num">Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ss.map((s) => {
                const o = orden.find((x) => x.id === s.id);
                return (
                  <tr key={s.id} className={ganadora && o && o.id === ganadora.id ? 'is-lider' : ''}>
                    <td>
                      <input className="tabla__input" value={s.nombre} placeholder="Qué se haría" onChange={(e) => editar(s.id, 'nombre', e.target.value)} />
                    </td>
                    {CRITERIOS_SOL.map((c) => (
                      <td className="num" key={c.id}>
                        <input
                          className="tabla__input tabla__input--num"
                          type="number"
                          min="1"
                          max="5"
                          value={s[c.id]}
                          onChange={(e) => editar(s.id, c.id, num(e.target.value))}
                        />
                      </td>
                    ))}
                    <td className="num">
                      <span className="dato dato--fuerte">{o ? o.score.toFixed(2) : '—'}</span>
                    </td>
                    <td>
                      <button className="boton--icono" onClick={() => borrar(s.id)} disabled={ss.length <= 1} title="Quitar">
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
            + Agregar solución
          </button>
        </div>

        <p className="nota" style={{ marginTop: 'var(--sp-3)' }}>
          Costo, tiempo y riesgo se califican tal cual (5 = alto) y el cálculo los invierte. No hay
          que capturarlos al revés.
        </p>
      </Bloque>

      {orden.length > 1 && (
        <Bloque titulo="Comparativo" meta="DE 1 A 5">
          {orden.map((o) => (
            <div className="marcador" key={o.id}>
              <span className="marcador__nombre">{o.nombre}</span>
              <Barra pct={(o.score / 5) * 100} tono={ganadora && o.id === ganadora.id ? 'ok' : null} />
              <span className="marcador__valor">{o.score.toFixed(2)}</span>
            </div>
          ))}
        </Bloque>
      )}
    </div>
  );
}

/* =========================================================================
   RP-7 · A3 de Resolución de Problemas
   ========================================================================= */

const nuevaAccion = () => ({
  id: 'ac' + Date.now() + Math.random().toString(16).slice(2, 6),
  que: '',
  quien: '',
  cuando: '',
});

function CajaA3({ num: n, titulo, heredado, vacio, children }) {
  return (
    <div className="a3__caja">
      <span className="a3__num">{n}</span>
      <span className="a3__titulo">{titulo}</span>
      {heredado !== undefined && (
        <div className={heredado ? 'a3__heredado' : 'a3__vacio'}>{heredado || vacio}</div>
      )}
      {children}
    </div>
  );
}

export function A3({ estado, set, proceso }) {
  const a = estado.a3;
  const campo = (k, v) => set({ ...estado, a3: { ...a, [k]: v } });

  const editarAccion = (id, k, v) =>
    set({ ...estado, a3: { ...a, plan: a.plan.map((p) => (p.id === id ? { ...p, [k]: v } : p)) } });
  const agregarAccion = () => set({ ...estado, a3: { ...a, plan: [...a.plan, nuevaAccion()] } });
  const borrarAccion = (id) => {
    if (a.plan.length <= 1) return;
    set({ ...estado, a3: { ...a, plan: a.plan.filter((p) => p.id !== id) } });
  };

  const d = estado.definicion;
  const confirmadas = estado.validacion.filter((v) => v.hipotesis.trim() && v.veredicto === 'confirmada');
  const orden = estado.soluciones
    .filter((s) => s.nombre.trim())
    .map((s) => ({ ...s, score: scoreSolucion(s, estado.pesosSol) }))
    .sort((x, y) => y.score - x.score);
  const ganadora = orden[0];

  const situacion = [
    d.que ? d.que : null,
    d.donde ? 'Ocurre en: ' + d.donde : null,
    d.frecuencia ? 'Frecuencia: ' + d.frecuencia : null,
    d.impacto ? 'Impacto: ' + d.impacto : null,
    d.evidencia ? 'Evidencia: ' + d.evidencia : null,
  ]
    .filter(Boolean)
    .join('\n');

  const analisis = [
    estado.porques.causaRaiz ? 'Causa raíz: ' + estado.porques.causaRaiz : null,
    confirmadas.length ? 'Confirmadas:\n' + confirmadas.map((c) => '· ' + c.hipotesis + (c.evidencia ? ' (' + c.evidencia + ')' : '')).join('\n') : null,
  ]
    .filter(Boolean)
    .join('\n');

  const acciones = a.plan.filter((p) => p.que.trim()).length;
  const sinDueno = a.plan.filter((p) => p.que.trim() && !p.quien.trim()).length;

  return (
    <div className="tool">
      <header className="tool__head">
        <h2 className="tool__titulo">A3 de Resolución de Problemas</h2>
        <p className="tool__intro">
          Todo el caso en una hoja. Si no cabe, es que no está entendido. Las cajas de la izquierda
          se llenan solas con lo que ya capturaste; las de la derecha son las que exigen decisión.
        </p>
      </header>

      <div className="tablero">
        <Cifra label="Acciones en el plan" valor={acciones || '—'} pie="Con responsable y fecha" ember={acciones > 0} />
        <Cifra
          label="Sin responsable"
          valor={sinDueno || '0'}
          pie={sinDueno ? 'Una acción sin dueño no ocurre' : 'Todas asignadas'}
          ember={sinDueno > 0}
        />
        <Cifra
          label="Contramedida elegida"
          valor={ganadora ? '1' : '—'}
          pie={ganadora ? ganadora.nombre : 'Elige en RP-6'}
        />
      </div>

      <div className="a3">
        <div className="a3__cabecera">
          <div>
            <span className="a3__num">A3 · {proceso ? proceso.nombre : 'Proceso sin definir'}</span>
            <h3 className="tool__titulo" style={{ fontSize: 'var(--step-1)' }}>
              {d.que || 'Problema sin definir'}
            </h3>
          </div>
          <span className="bloque__meta">{a.fecha || new Date().toLocaleDateString('es-MX')}</span>
        </div>

        <div className="a3__col">
          <CajaA3
            n="01 · Antecedentes"
            titulo="Por qué importa"
            heredado={a.antecedentes}
            vacio=""
          >
            <textarea
              className="campo__area"
              value={a.antecedentes}
              placeholder="Qué está en juego si esto no se resuelve."
              onChange={(e) => campo('antecedentes', e.target.value)}
            />
          </CajaA3>

          <CajaA3
            n="02 · Situación actual"
            titulo="El hecho, con datos"
            heredado={situacion}
            vacio="Se llena con lo que captures en RP-1."
          />

          <CajaA3 n="03 · Meta" titulo="A dónde se quiere llegar">
            <textarea
              className="campo__area"
              value={a.meta}
              placeholder="De cuánto a cuánto, y para cuándo. Con número."
              onChange={(e) => campo('meta', e.target.value)}
            />
          </CajaA3>

          <CajaA3
            n="04 · Análisis"
            titulo="Causa raíz"
            heredado={analisis}
            vacio="Se llena con RP-3 y RP-5."
          />
        </div>

        <div className="a3__col">
          <CajaA3
            n="05 · Contramedidas"
            titulo="Qué se va a hacer"
            heredado={ganadora ? ganadora.nombre : ''}
            vacio="Elige la solución en RP-6."
          >
            <textarea
              className="campo__area"
              value={a.contramedidas}
              placeholder="Cómo se implementa y qué cambia en el proceso."
              onChange={(e) => campo('contramedidas', e.target.value)}
            />
          </CajaA3>

          <CajaA3 n="06 · Plan de acción" titulo="Qué, quién y cuándo">
            <div className="tabla-wrap">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Acción</th>
                    <th>Responsable</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {a.plan.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <input className="tabla__input" value={p.que} placeholder="Qué se hace" onChange={(e) => editarAccion(p.id, 'que', e.target.value)} />
                      </td>
                      <td>
                        <input className="tabla__input" value={p.quien} placeholder="Quién" onChange={(e) => editarAccion(p.id, 'quien', e.target.value)} />
                      </td>
                      <td>
                        <input className="tabla__input" value={p.cuando} placeholder="Cuándo" onChange={(e) => editarAccion(p.id, 'cuando', e.target.value)} />
                      </td>
                      <td>
                        <button className="boton--icono" onClick={() => borrarAccion(p.id)} disabled={a.plan.length <= 1} title="Quitar">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="boton--sec" style={{ marginTop: 'var(--sp-3)' }} onClick={agregarAccion}>
              + Agregar acción
            </button>
          </CajaA3>

          <CajaA3 n="07 · Resultado esperado" titulo="Cómo se va a saber si funcionó">
            <textarea
              className="campo__area"
              value={a.resultado}
              placeholder="El indicador, la meta y la fecha de corte."
              onChange={(e) => campo('resultado', e.target.value)}
            />
          </CajaA3>

          <CajaA3 n="08 · Seguimiento" titulo="Quién revisa y cada cuándo">
            <textarea
              className="campo__area"
              value={a.seguimiento}
              placeholder="Ritmo de revisión y qué pasa si no se cumple."
              onChange={(e) => campo('seguimiento', e.target.value)}
            />
          </CajaA3>
        </div>
      </div>
    </div>
  );
}

/* ---------- Estado inicial del módulo ---------- */

export const ESTADO_RP = {
  definicion: {
    que: '',
    donde: '',
    desdeCuando: '',
    frecuencia: '',
    impacto: '',
    quien: '',
    evidencia: '',
    noDonde: '',
    noCuando: '',
    diferencia: '',
  },
  pareto: [nuevaIncidencia()],
  porques: { sintoma: '', cadena: ['', '', '', '', ''], causaRaiz: '', verificacion: '' },
  ishikawa: CATEGORIAS_ISHIKAWA.reduce((a, c) => ({ ...a, [c.id]: [nuevoItem()] }), {}),
  validacion: [nuevaHipotesis()],
  soluciones: [nuevaSolucion()],
  pesosSol: { impacto: 30, costo: 20, tiempo: 15, riesgo: 15, viabilidad: 20 },
  a3: {
    fecha: '',
    antecedentes: '',
    meta: '',
    contramedidas: '',
    plan: [nuevaAccion()],
    resultado: '',
    seguimiento: '',
  },
};
