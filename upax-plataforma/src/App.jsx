import { useState, useEffect, useMemo, Fragment } from 'react';
import logo from './assets/upax-logotipo.png';
import './app.css';
import { PALAS, DOT, ORDEN } from './lib/aspa.js';
import { AnalisisUpaxBrain } from './lib/ia.jsx';

import { Selector, Diagnostico, Ficha, VozCliente, Brecha, ESTADO_IO } from './modules/io.jsx';
import { Sipoc, Inventario, Valor, Desperdicios, Problemas, Costo, Prioridad, ESTADO_DP } from './modules/dp.jsx';
import { Mapa, Swimlane, Tiempos, Cuellos, Transferencias, Futuro, Comparador, ESTADO_MR } from './modules/mr.jsx';
import { Capacidad, Carga, Balanceo, Productividad, Saturaciones, Automatizables, Simulador, ESTADO_PC } from './modules/pc.jsx';
import { Definicion, Pareto, Porques, Ishikawa, Validacion, Soluciones, A3, ESTADO_RP } from './modules/rp.jsx';
import { FichaEstandar, Poe, Checklists, Raci, Controles, Pokayoke, Versiones, ESTADO_ES } from './modules/es.jsx';
import { Arbol, FichaKpi, BaseMeta, Scorecard, Tendencias, Alertas, Motor, ESTADO_IE } from './modules/ie.jsx';
import { Portafolio, PlanAccion, Tablero, Semaforo, Bloqueos, Beneficios, Plan90, ESTADO_EJ } from './modules/ej.jsx';

/* =========================================================================
   UPAX · Plataforma de Análisis Operativo y Mejora Continua
   Login → hub de módulos → módulo con pestañas.
   Paleta tomada del logo oficial (#323644 / #E44611). Modo claro.
   ========================================================================= */





/** Provisional: el botón Entrar no valida credenciales.
 *  Cambiar a false para exigir usuario y contraseña. */
const ACCESO_LIBRE = true;


const CICLO = [
  { pala: 'N', nombre: 'Planear', frase: 'Define el estándar y la meta del proceso.' },
  { pala: 'E', nombre: 'Hacer', frase: 'Ejecuta el cambio en piso, a escala controlada.' },
  { pala: 'S', nombre: 'Verificar', frase: 'Mide contra el estándar. Sin dato no hay juicio.' },
  { pala: 'W', nombre: 'Actuar', frase: 'Estandariza lo que sirvió. Descarta lo que no.' },
];

function UpaxMark({ activa = 'E', tono = 'ink', className }) {
  return (
    <svg
      className={['upax-mark', 'upax-mark--' + tono, className].filter(Boolean).join(' ')}
      viewBox="-2 -2 662 662"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {ORDEN.map((id) => (
        <path
          key={id}
          d={PALAS[id]}
          className={id === activa ? 'upax-pala upax-pala--activa' : 'upax-pala'}
        />
      ))}
      <path d={DOT} className="upax-pala upax-dot" />
    </svg>
  );
}

function useCiclo(intervalo = 700) {
  const [i, setI] = useState(1); // 'Hacer': pala naranja del logo oficial

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % CICLO.length), intervalo);
    return () => clearInterval(t);
  }, [intervalo]);

  return i;
}

/* ---------- Directorio de usuarios ----------
   Punto único de reemplazo cuando se conecte API o SSO.
   Hoy no se consulta porque ACCESO_LIBRE está activo. */

const DIRECTORIO = [
  { usuario: 'admin', password: 'upax2026', nombre: 'Administrador', rol: 'admin', area: 'Dirección de Operaciones' },
  { usuario: 'analista', password: 'upax2026', nombre: 'Analista de Operación', rol: 'analista', area: 'Mejora Continua' },
  { usuario: 'consulta', password: 'upax2026', nombre: 'Usuario de Consulta', rol: 'consulta', area: 'Cliente interno' },
];

const INVITADO = { usuario: 'invitado', nombre: 'Administrador', rol: 'admin', area: 'Dirección de Operaciones' };

async function validarCredenciales(usuario, password) {
  await new Promise((r) => setTimeout(r, 350));
  const hit = DIRECTORIO.find(
    (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase() && u.password === password
  );
  if (!hit) return null;
  const { password: _o, ...perfil } = hit;
  return perfil;
}

/* ---------- Registro de módulos ----------
   Única fuente de la navegación: menú lateral, hub y pestañas salen de aquí.
   Para dar de alta una pestaña:
     pestanas: [{ id: 'flujo', nombre: 'Flujo', componente: Flujo }]
*/

const MODULOS = [
  {
    id: 'inteligencia-operativa',
    clave: 'IO',
    nombre: 'Inteligencia Operativa',
    descripcion: 'Un proceso seleccionado, su diagnóstico inicial, la definición de valor, la brecha operativa y un caso de mejora claramente formulado.',
    pestanas: [
      { id: 'selector', nombre: 'Selector de Proceso Crítico', componente: Selector },
      { id: 'diagnostico', nombre: 'Diagnóstico de Inteligencia Operativa', componente: Diagnostico },
      { id: 'ficha', nombre: 'Ficha Maestra del Proceso', componente: Ficha },
      { id: 'voz', nombre: 'Voz del Cliente y Definición de Valor', componente: VozCliente },
      { id: 'brecha', nombre: 'Análisis de Brecha Operativa', componente: Brecha },
    ],
  },
  {
    id: 'diagnostico-procesos',
    clave: 'DP',
    nombre: 'Diagnóstico de Procesos',
    descripcion: 'Actividades, desperdicios, problemas, costos y oportunidades prioritarias.',
    pestanas: [
      { id: 'sipoc', nombre: 'SIPOC Inteligente', componente: Sipoc },
      { id: 'inventario', nombre: 'Inventario de Actividades', componente: Inventario },
      { id: 'valor', nombre: 'Clasificación de Valor Agregado', componente: Valor },
      { id: 'desperdicios', nombre: 'Diagnóstico de Desperdicios Lean', componente: Desperdicios },
      { id: 'problemas', nombre: 'Matriz de Problemas Operativos', componente: Problemas },
      { id: 'costo', nombre: 'Cuantificación del Costo del Desperdicio', componente: Costo },
      { id: 'prioridad', nombre: 'Priorización de Oportunidades', componente: Prioridad },
    ],
  },
  {
    id: 'mapeo-rediseno',
    clave: 'MR',
    nombre: 'Mapeo y Rediseño',
    descripcion: 'Mapa actual, principales restricciones, proceso futuro y mejora esperada cuantificada.',
    pestanas: [
      { id: 'mapa', nombre: 'Mapa del Proceso Actual', componente: Mapa },
      { id: 'swimlane', nombre: 'Diagrama Swimlane', componente: Swimlane },
      { id: 'tiempos', nombre: 'Análisis de Tiempos', componente: Tiempos },
      { id: 'cuellos', nombre: 'Detección de Cuellos de Botella', componente: Cuellos },
      { id: 'transferencias', nombre: 'Análisis de Transferencias y Autorizaciones', componente: Transferencias },
      { id: 'futuro', nombre: 'Diseño del Proceso Futuro', componente: Futuro },
      { id: 'comparador', nombre: 'Comparador Estado Actual vs. Estado Futuro', componente: Comparador },
    ],
  },
  {
    id: 'productividad-capacidad',
    clave: 'PC',
    nombre: 'Productividad y Capacidad',
    descripcion: 'Capacidad instalada, carga real, saturaciones, productividad actual y oportunidades de automatización cuantificadas.',
    pestanas: [
      { id: 'capacidad', nombre: 'Calculadora de Capacidad Instalada', componente: Capacidad },
      { id: 'carga', nombre: 'Análisis de Carga de Trabajo', componente: Carga },
      { id: 'balanceo', nombre: 'Balanceo de Cargas', componente: Balanceo },
      { id: 'productividad', nombre: 'Matriz de Productividad', componente: Productividad },
      { id: 'saturaciones', nombre: 'Detección de Saturaciones y Cuellos de Capacidad', componente: Saturaciones },
      { id: 'automatizables', nombre: 'Análisis de Actividades Repetitivas y Automatizables', componente: Automatizables },
      { id: 'simulador', nombre: 'Simulador de Liberación de Capacidad', componente: Simulador },
    ],
  },
  {
    id: 'resolucion-problemas',
    clave: 'RP',
    nombre: 'Resolución de Problemas',
    descripcion: 'Problema definido, causas priorizadas y validadas, solución seleccionada y A3 completo.',
    pestanas: [
      { id: 'definicion', nombre: 'Definición Estructurada del Problema', componente: Definicion },
      { id: 'pareto', nombre: 'Pareto de Problemas', componente: Pareto },
      { id: 'porques', nombre: 'Cinco Porqués Asistido por IA', componente: Porques },
      { id: 'ishikawa', nombre: 'Diagrama de Ishikawa', componente: Ishikawa },
      { id: 'validacion', nombre: 'Matriz de Validación de Causas', componente: Validacion },
      { id: 'soluciones', nombre: 'Generador y Evaluador de Soluciones', componente: Soluciones },
      { id: 'a3', nombre: 'A3 de Resolución de Problemas', componente: A3 },
    ],
  },
  {
    id: 'estandarizacion',
    clave: 'ES',
    nombre: 'Estandarización',
    descripcion: 'Proceso estandarizado, procedimiento documentado, checklist, responsables, controles y mecanismos de prevención de errores.',
    pestanas: [
      { id: 'ficha-estandar', nombre: 'Ficha de Estándar Operativo', componente: FichaEstandar },
      { id: 'poe', nombre: 'Procedimiento Operativo Estándar', componente: Poe },
      { id: 'checklists', nombre: 'Generador de Checklists', componente: Checklists },
      { id: 'raci', nombre: 'Matriz RACI', componente: Raci },
      { id: 'controles', nombre: 'Puntos de Control y Criterios de Calidad', componente: Controles },
      { id: 'pokayoke', nombre: 'Poka-Yoke y Prevención de Errores', componente: Pokayoke },
      { id: 'versiones', nombre: 'Control de Versiones y Actualización del Estándar', componente: Versiones },
    ],
  },
  {
    id: 'indicadores-bi',
    clave: 'IE',
    nombre: 'Indicadores e Inteligencia Empresarial',
    descripcion: 'KPIs definidos, scorecard operativo, alertas, análisis de desviaciones y recomendaciones de acción.',
    pestanas: [
      { id: 'arbol', nombre: 'Árbol de Indicadores', componente: Arbol },
      { id: 'ficha-kpi', nombre: 'Ficha Técnica de KPI', componente: FichaKpi },
      { id: 'base-meta', nombre: 'Línea Base y Meta', componente: BaseMeta },
      { id: 'scorecard', nombre: 'Scorecard Operativo', componente: Scorecard },
      { id: 'tendencias', nombre: 'Análisis de Tendencias y Desviaciones', componente: Tendencias },
      { id: 'alertas', nombre: 'Alertas Inteligentes', componente: Alertas },
      { id: 'motor', nombre: 'Motor de Recomendaciones', componente: Motor },
    ],
  },
  {
    id: 'ejecucion-seguimiento',
    clave: 'EJ',
    nombre: 'Ejecución y Seguimiento',
    descripcion: 'Portafolio priorizado, plan de acción, tablero de seguimiento, control de bloqueos y medición del impacto real.',
    pestanas: [
      { id: 'portafolio', nombre: 'Portafolio de Iniciativas', componente: Portafolio },
      { id: 'plan-accion', nombre: 'Plan de Acción', componente: PlanAccion },
      { id: 'tablero-ej', nombre: 'Tablero de Ejecución', componente: Tablero },
      { id: 'semaforo', nombre: 'Semáforo de Cumplimiento', componente: Semaforo },
      { id: 'bloqueos', nombre: 'Gestión de Bloqueos', componente: Bloqueos },
      { id: 'beneficios', nombre: 'Seguimiento de Beneficios', componente: Beneficios },
      { id: 'plan90', nombre: 'Plan de Transformación a 90 Días', componente: Plan90 },
    ],
  },
];

function modulosVisibles(rol) {
  return MODULOS.filter((m) => !m.roles || m.roles.includes(rol)).map((m) => ({
    ...m,
    pestanas: m.pestanas.filter((p) => !p.roles || p.roles.includes(rol)),
  }));
}

/* ---------- Login ---------- */

function LoginPage({ onEntrar }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const iFase = useCiclo();
  const fase = CICLO[iFase];

  async function onSubmit() {
    setError(null);

    if (ACCESO_LIBRE) {
      const conocido = DIRECTORIO.find(
        (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
      );
      const { password: _o, ...perfil } = conocido ?? INVITADO;
      onEntrar(perfil);
      return;
    }

    if (!usuario.trim() || !password) {
      setError('Captura tu usuario y tu contraseña.');
      return;
    }
    setEnviando(true);
    const perfil = await validarCredenciales(usuario, password);
    setEnviando(false);
    if (!perfil) {
      setError('Usuario o contraseña incorrectos. Revisa tus datos e intenta de nuevo.');
      setPassword('');
      return;
    }
    onEntrar(perfil);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') onSubmit();
  }

  return (
    <div className="login">
      <aside className="login__ciclo" aria-hidden="true">
        <p className="login__eyebrow login__eyebrow--claro">Ciclo de mejora</p>

        <div className="ciclo">
          {CICLO.map((f) => (
            <span
              key={f.pala}
              className={[
                'ciclo__etiqueta',
                'ciclo__etiqueta--' + f.pala,
                f.pala === fase.pala ? 'is-activa' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {f.nombre}
            </span>
          ))}
          <div className="ciclo__mark">
            <UpaxMark activa={fase.pala} tono="claro" />
          </div>
        </div>

        <div className="login__frase">
          <span className="login__contador">
            {String(iFase + 1).padStart(2, '0')} / {String(CICLO.length).padStart(2, '0')}
          </span>
          <ol className="login__frases">
            {CICLO.map((f, idx) => (
              <li
                key={f.pala}
                className={
                  idx === iFase ? 'login__frase-item is-activa' : 'login__frase-item'
                }
              >
                {f.frase}
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <main className="login__panel">
        <div className="login__caja">
          <img className="login__logo" src={logo} alt="UPAX" />

          <p className="login__eyebrow">Acceso</p>
          <h1 className="login__titulo">Plataforma de Análisis Operativo y Mejora Continua</h1>
          <p className="login__intro">
            Acceso restringido a personal autorizado. Entra con el usuario que te asignó tu
            administrador.
          </p>

          <div className="login__form">
            <div className="campo">
              <label className="campo__label" htmlFor="usuario">
                Usuario
              </label>
              <input
                id="usuario"
                className="campo__input"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={enviando}
              />
            </div>

            <div className="campo">
              <label className="campo__label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="campo__input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={enviando}
              />
            </div>

            <p className="login__error" role="alert" aria-live="polite">
              {error}
            </p>

            <button className="boton" onClick={onSubmit} disabled={enviando}>
              {enviando ? 'Validando…' : 'Entrar'}
            </button>
          </div>

          <p className="login__ayuda">
            ¿No puedes entrar? Solicita el restablecimiento a tu administrador de plataforma.
          </p>
        </div>

        <footer className="login__pie">Powered by AXON B2B</footer>
      </main>
    </div>
  );
}

/* ---------- Hub de módulos ---------- */

function Hub({ usuario, modulos, onAbrir }) {
  return (
    <div className="hub">
      <header className="hub__head">
        <h2 className="hub__titulo">Hola, {usuario.nombre}</h2>
        <p className="hub__sub">
          {usuario.area} · {modulos.length} módulos disponibles
        </p>
      </header>

      <div className="hub__grid">
        {modulos.map((m) => (
          <button key={m.id} className="tarjeta" onClick={() => onAbrir(m.id)}>
            <span className="tarjeta__nombre">{m.nombre}</span>
            <p className="tarjeta__desc">{m.descripcion}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Módulo sin pestañas dadas de alta ---------- */

function Pendiente({ modulo }) {
  return (
    <div className="pendiente">
      <p className="pendiente__clave">{modulo.clave} · SIN PESTAÑAS</p>
      <h3 className="pendiente__titulo">{modulo.nombre}</h3>
      <p className="pendiente__texto">
        {modulo.descripcion} El módulo ya está dado de alta y navegable. Falta definir sus
        pestañas y el contenido de cada una.
      </p>
    </div>
  );
}

/* ---------- Shell ---------- */

function AppShell({ usuario, onSalir, datos, setters }) {
  const modulos = useMemo(() => modulosVisibles(usuario.rol), [usuario]);

  const [moduloId, setModuloId] = useState(null); // null = hub
  const modulo = modulos.find((m) => m.id === moduloId) ?? null;

  const [pestanaId, setPestanaId] = useState(null);
  const pestana = modulo?.pestanas.find((p) => p.id === pestanaId) ?? modulo?.pestanas[0] ?? null;
  const Contenido = pestana?.componente;

  function abrirModulo(id) {
    const m = modulos.find((x) => x.id === id);
    if (!m) return;
    setModuloId(id);
    setPestanaId(m.pestanas[0]?.id ?? null);
  }

  const procesoElegido = useMemo(() => {
    const p = datos.io.selector.procesos.find((x) => x.id === datos.io.selector.elegido);
    return p && p.nombre.trim() ? p : null;
  }, [datos.io.selector]);

  /* Cada módulo edita su propio estado y puede leer el de los demás. */
  const LLAVE_ESTADO = {
    'inteligencia-operativa': 'io',
    'diagnostico-procesos': 'dp',
    'mapeo-rediseno': 'mr',
    'productividad-capacidad': 'pc',
    'resolucion-problemas': 'rp',
    'estandarizacion': 'es',
    'indicadores-bi': 'ie',
    'ejecucion-seguimiento': 'ej',
  };
  const llave = modulo ? LLAVE_ESTADO[modulo.id] : null;

  const iniciales = usuario.nombre
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <div className="shell">
      <nav className="shell__nav" aria-label="Módulos">
        <button
          className={moduloId === null ? 'shell__mark is-activo' : 'shell__mark'}
          onClick={() => setModuloId(null)}
          title="Ver todos los módulos"
        >
          <UpaxMark activa="E" tono="claro" />
        </button>

        <ul className="shell__modulos">
          {modulos.map((m, i) => (
            <li key={m.id}>
              <button
                className={m.id === moduloId ? 'modulo is-activo' : 'modulo'}
                onClick={() => abrirModulo(m.id)}
                title={m.nombre + ' — ' + m.descripcion}
                aria-current={m.id === moduloId ? 'true' : undefined}
              >
                <span className="modulo__clave">{i + 1}</span>
                <span className="modulo__nombre">{m.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shell__cuerpo">
        <header className="shell__head">
          <div className="shell__marca">
            <img className="shell__logo" src={logo} alt="UPAX" />
            <span className="shell__divisor" aria-hidden="true" />
            <p className="shell__nombre">
              {modulo ? modulo.nombre : 'Análisis Operativo y Mejora Continua'}
            </p>
          </div>

          <div className="sesion">
            <span className="sesion__avatar" aria-hidden="true">
              {iniciales}
            </span>
            <span className="sesion__datos">
              <span className="sesion__usuario">{usuario.nombre}</span>
              <span className="sesion__area">{usuario.area}</span>
            </span>
            <button className="sesion__salir" onClick={onSalir}>
              Salir
            </button>
          </div>
        </header>

        {modulo && modulo.pestanas.length > 0 && (
          <div className="pestanas" role="tablist" aria-label={'Pestañas de ' + modulo.nombre}>
            {modulo.pestanas.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={p.id === pestana?.id}
                className={p.id === pestana?.id ? 'pestana is-activa' : 'pestana'}
                onClick={() => setPestanaId(p.id)}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        )}

        <main className="shell__main">
          {modulo === null && <Hub usuario={usuario} modulos={modulos} onAbrir={abrirModulo} />}
          {modulo !== null && Contenido && llave && (
            <>
              <Contenido
                usuario={usuario}
                modulo={modulo}
                estado={datos[llave]}
                set={setters[llave]}
                proceso={procesoElegido}
                otros={datos}
              />
              <AnalisisUpaxBrain
                key={llave + ':' + (pestana?.id ?? '')}
                titulo={modulo.nombre + ' · ' + (pestana?.nombre ?? '')}
                contexto={{
                  modulo: modulo.nombre,
                  herramienta: pestana?.nombre ?? null,
                  procesoElegido: procesoElegido?.nombre ?? null,
                  datos: datos[llave],
                }}
              />
            </>
          )}
          {modulo !== null && !Contenido && <Pendiente modulo={modulo} />}
        </main>

        <footer className="shell__pie">Powered by AXON B2B</footer>
      </div>
    </div>
  );
}

/* ---------- Raíz ---------- */

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [io, setIo] = useState(ESTADO_IO);
  const [dp, setDp] = useState(ESTADO_DP);
  const [mr, setMr] = useState(ESTADO_MR);
  const [pc, setPc] = useState(ESTADO_PC);
  const [rp, setRp] = useState(ESTADO_RP);
  const [es, setEs] = useState(ESTADO_ES);
  const [ie, setIe] = useState(ESTADO_IE);
  const [ej, setEj] = useState(ESTADO_EJ);

  return (
    <div className="upax-app">
      {usuario ? (
        <AppShell
          usuario={usuario}
          onSalir={() => setUsuario(null)}
          datos={{ io, dp, mr, pc, rp, es, ie, ej }}
          setters={{ io: setIo, dp: setDp, mr: setMr, pc: setPc, rp: setRp, es: setEs, ie: setIe, ej: setEj }}
        />
      ) : (
        <LoginPage onEntrar={setUsuario} />
      )}
    </div>
  );
}
