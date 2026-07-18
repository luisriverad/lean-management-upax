/* Utilidades compartidas por todos los módulos. */

/* Convierte cualquier captura a número. Ignora símbolos, comas y espacios. */
export const num = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
};

/* Formato de moneda mexicana, sin centavos. */
export const moneda = (n) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

/* Elemento vacío con id único para las listas editables. */
export const nuevoItem = () => ({
  id: 'x' + Date.now() + Math.random().toString(16).slice(2, 6),
  text: '',
});
