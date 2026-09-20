// Motor del MODO DEMOSTRACIÓN. No ejecuta IA ni escribe código real:
// traduce lo que pide el usuario a una especificación y dibuja una vista previa
// para recorrer el flujo completo antes de conectar OpenCode.

export const PREGUNTAS = [
  { id: 'solicita', label: '¿Quién inicia el proceso?', ph: 'cualquier colaborador' },
  { id: 'aprueba', label: '¿Quién revisa o aprueba?', ph: 'jefe de área y finanzas' },
  { id: 'datos', label: '¿Qué datos se capturan?', ph: 'concepto, monto, fecha' },
]

const COLORES = {
  azul: '#2563eb', verde: '#16a34a', rojo: '#dc2626', naranja: '#ea580c',
  morado: '#7c3aed', rosa: '#db2777', negro: '#111827', gris: '#4b5563', amarillo: '#ca8a04',
}

const TIPOS = {
  solicitudes: { nuevo: 'Nueva solicitud', lista: 'Solicitudes', accion: 'Enviar a revisión', item: 'Solicitud' },
  inventario: { nuevo: 'Nuevo artículo', lista: 'Artículos', accion: 'Guardar artículo', item: 'Artículo' },
  clientes: { nuevo: 'Nuevo cliente', lista: 'Clientes', accion: 'Guardar cliente', item: 'Cliente' },
  tareas: { nuevo: 'Nueva tarea', lista: 'Tareas', accion: 'Guardar tarea', item: 'Tarea' },
  general: { nuevo: 'Nuevo registro', lista: 'Registros', accion: 'Guardar registro', item: 'Registro' },
}

/** @returns {'solicitudes' | 'inventario' | 'clientes' | 'tareas' | 'general'} */
function tipoDe(idea) {
  const t = idea.toLowerCase()
  if (/inventario|almac[eé]n|existencias|productos|stock/.test(t)) return 'inventario'
  if (/clientes|contactos|crm|ventas/.test(t)) return 'clientes'
  if (/tareas|actividades|pendientes|proyectos/.test(t)) return 'tareas'
  if (/solicitudes|aprobaci[oó]n|presupuestos|permisos|requisiciones/.test(t)) return 'solicitudes'
  return 'general'
}

/** Especificación inicial a partir de la idea y las respuestas de negocio. */
export function specInicial(nombre, respuestas = {}, idea = '') {
  const campos = (respuestas.datos || 'concepto, monto, fecha')
    .split(/,| y | e /i)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)
  return {
    titulo: nombre,
    idea,
    tipo: tipoDe(idea),
    accent: COLORES.morado,
    campos: campos.length ? campos : ['Concepto', 'Monto'],
    solicita: respuestas.solicita || 'Solicitante',
    aprueba: respuestas.aprueba || 'Responsable de aprobar',
    notas: [],
  }
}

/**
 * Interpreta una petición en lenguaje natural sobre la especificación.
 * Devuelve la nueva spec y un resumen en palabras de negocio.
 */
export function interpretar(texto, spec) {
  const t = texto.toLowerCase()
  const next = { ...spec, campos: [...spec.campos], notas: [...spec.notas] }

  const color = Object.keys(COLORES).find((c) => t.includes(c))
  if (color && /color|tono|azul|verde|rojo|naranja|morado|rosa|negro|gris|amarillo/.test(t)) {
    next.accent = COLORES[color]
    return { spec: next, resumen: `Cambié el color principal a ${color}.` }
  }

  const quitar = t.match(/(?:quita|quitar|elimina|eliminar|borra|borrar)\s+(?:el\s+)?(?:campo\s+)?(.+)/)
  if (quitar) {
    const buscado = limpiar(quitar[1])
    const antes = next.campos.length
    next.campos = next.campos.filter((c) => !c.toLowerCase().includes(buscado.toLowerCase()))
    if (next.campos.length < antes) return { spec: next, resumen: `Quité el campo «${buscado}».` }
  }

  const agregar = t.match(/(?:agrega|agregar|añade|añadir|incluye|incluir|quiero)\s+(?:un |una |el |la )?(?:campo\s+)?(.+)/)
  if (agregar && /campo|dato|columna|casilla/.test(t)) {
    const nuevo = titulo(limpiar(agregar[1]))
    if (nuevo && !next.campos.some((c) => c.toLowerCase() === nuevo.toLowerCase())) {
      next.campos.push(nuevo)
      return { spec: next, resumen: `Agregué el campo «${nuevo}».` }
    }
  }

  const tit = texto.match(/t[ií]tulo\s+(?:a|por|:)?\s*["«]?([^"»]+)["»]?/i)
  if (tit) {
    next.titulo = tit[1].trim()
    return { spec: next, resumen: `Cambié el título a «${next.titulo}».` }
  }

  next.notas.push(texto.trim())
  return {
    spec: next,
    resumen: 'Registré tu petición y la dejé anotada en la vista previa. En modo demostración no se construye código real.',
  }
}

const limpiar = (s) =>
  s.replace(/^(campo|dato|columna|casilla)\s+/i, '').replace(/[.,;!?]+$/, '').replace(/^(de|del|la|el)\s+/i, '').trim()

const titulo = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Dibuja la vista previa (HTML autocontenido para el iframe). */
export function render(spec) {
  const tipo = TIPOS[spec.tipo] || TIPOS.general
  const campos = spec.campos
    .map((c) => `<label>${esc(titulo(c))}<input placeholder="${esc(titulo(c))}" /></label>`)
    .join('')
  const filas = ['Pendiente', 'Aprobado', 'Rechazado']
    .map(
      (estado, i) => `<tr><td>#${1001 + i}</td><td>${esc(spec.solicita)}</td>
      <td>${esc(spec.campos[0] || tipo.item)} de ejemplo</td><td><span class="e ${estado}">${estado}</span></td></tr>`,
    )
    .join('')
  const notas = spec.notas.length
    ? `<section class="notas"><h3>Pendientes anotados</h3><ul>${spec.notas.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>`
    : ''

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" /><style>
:root{--a:${esc(spec.accent)};--ink:#272235;--muted:#675f72;--border:#e9e3ef}
*{box-sizing:border-box}body{margin:0;font:15px/1.55 system-ui,sans-serif;color:var(--ink);background:#faf9fc}
header{background:#fff;border-top:4px solid var(--a);border-bottom:1px solid var(--border);padding:22px 28px}
header h1{margin:0;font-size:23px;letter-spacing:-.025em;line-height:1.25}
header p{margin:6px 0 0;color:var(--muted);font-size:13px}
.eyebrow{display:block;margin-bottom:8px;color:var(--a);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
main{width:min(100%,1040px);margin:auto;padding:28px;display:grid;gap:18px}
.intro{padding:0 2px}.idea{margin:0;color:var(--ink);font-size:15px}.hint{margin:7px 0 0;color:var(--muted);font-size:13px}
.card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:24px}
h2{margin:0 0 18px;font-size:17px;letter-spacing:-.01em}form{display:grid;gap:16px;grid-template-columns:1fr 1fr}
label{display:grid;gap:7px;font-size:13px;font-weight:600;color:#494054}
input{min-width:0;height:40px;padding:9px 12px;border:1px solid #dcd4e5;border-radius:9px;background:#fff;font:inherit;font-weight:400}
input:focus{outline:2px solid var(--a);outline-offset:1px}
button{min-height:40px;background:color-mix(in srgb,var(--a) 50%,#241b35);color:#fff;border:0;padding:9px 16px;border-radius:9px;font:inherit;font-weight:600;cursor:pointer;justify-self:start}
button:hover{filter:brightness(1.12)}button:focus-visible{outline:2px solid var(--a);outline-offset:2px}
.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px;min-width:520px}
th,td{text-align:left;padding:12px 10px;border-bottom:1px solid #eee9f2}tr:last-child td{border-bottom:0}
th{font-size:12px;color:var(--muted);font-weight:600}
.e{padding:4px 10px;border-radius:999px;font-size:12px;background:#fff3dc;color:#825500}
.e.Aprobado{background:#e3f7ed;color:#126844}.e.Rechazado{background:#fde9e9;color:#9b3030}
.notas{border-left:3px solid var(--a);background:#fff;padding:16px 20px;border-radius:0 10px 10px 0}
.notas h3{margin:0 0 8px;font-size:14px}
@media(max-width:600px){header{padding:18px 20px}main{padding:18px;gap:14px}.card{padding:18px}form{grid-template-columns:1fr}}
</style></head><body>
<header><span class="eyebrow">Vista de ejemplo</span><h1>${esc(spec.titulo)}</h1><p>${esc(tipo.lista)} · Inicia: ${esc(spec.solicita)} · Revisa: ${esc(spec.aprueba)}</p></header>
<main>
<div class="intro">${spec.idea ? `<p class="idea">${esc(spec.idea)}</p>` : ''}
<p class="hint">Vista ilustrativa. Estos datos y controles son de ejemplo.</p></div>
<section class="card"><h2>${esc(tipo.nuevo)}</h2><form onsubmit="return false">${campos}<button>${esc(tipo.accion)}</button></form></section>
<section class="card"><h2>${esc(tipo.lista)}</h2><div class="table-wrap"><table><thead><tr><th>Folio</th><th>Responsable</th><th>Detalle</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table></div></section>
${notas}
</main></body></html>`
}
