/* Componentes base del sistema de diseño UPAX. */

export function Bloque({ titulo, meta, children }) {
  return (
    <section className="bloque">
      {titulo && (
        <header className="bloque__head">
          <h3 className="bloque__titulo">{titulo}</h3>
          {meta && <span className="bloque__meta">{meta}</span>}
        </header>
      )}
      <div className="bloque__cuerpo">{children}</div>
    </section>
  );
}

export function Campo({ label, pista, valor, onChange, ancho, area, placeholder }) {
  return (
    <div className={ancho ? 'campo campo--ancho' : 'campo'}>
      <label className="campo__label">{label}</label>
      {area ? (
        <textarea
          className="campo__area"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="campo__input"
          type="text"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {pista && <span className="campo__pista">{pista}</span>}
    </div>
  );
}

export function Escala({ valor, onChange, min = 1, max = 5 }) {
  const ops = [];
  for (let i = min; i <= max; i++) ops.push(i);
  return (
    <div className="escala" role="group">
      {ops.map((n) => (
        <button
          key={n}
          className={valor === n ? 'escala__op is-activo' : 'escala__op'}
          onClick={() => onChange(valor === n ? null : n)}
          aria-pressed={valor === n}
          title={String(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function Barra({ pct, ember, tono }) {
  const w = Math.max(0, Math.min(100, pct));
  const clase = ['barra__fill', tono ? 'barra__fill--' + tono : ember ? 'barra__fill--ember' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className="barra">
      <div className={clase} style={{ width: w + '%' }} />
    </div>
  );
}

export function Cifra({ label, valor, pie, ember }) {
  return (
    <div className="cifra">
      <span className="cifra__label">{label}</span>
      <span className={ember ? 'cifra__valor cifra__valor--ember' : 'cifra__valor'}>{valor}</span>
      {pie && <span className="cifra__pie">{pie}</span>}
    </div>
  );
}

export function AvisoProceso({ proceso }) {
  if (proceso) return null;
  return (
    <div className="aviso">
      <span className="aviso__clave">IO-1</span>
      <span>Todavía no eliges el proceso crítico. Puedes capturar, pero el módulo trabaja mejor con el proceso ya definido.</span>
    </div>
  );
}

export function MiniLista({ items, onUpdate, onAdd, onRemove, placeholder }) {
  const unico = items.length <= 1;
  return (
    <>
      {items.map((it) => (
        <div className="mini__item" key={it.id}>
          <textarea
            rows={2}
            value={it.text}
            placeholder={placeholder}
            onChange={(e) => onUpdate(it.id, e.target.value)}
          />
          <button
            className="mini__quitar"
            onClick={() => onRemove(it.id)}
            disabled={unico}
            title={unico ? 'Debe quedar al menos uno' : 'Quitar'}
          >
            ✕
          </button>
        </div>
      ))}
      <button className="mini__agregar" onClick={onAdd}>
        + Agregar
      </button>
    </>
  );
}
