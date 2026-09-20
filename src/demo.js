// Motor del MODO DEMOSTRACIÓN. No ejecuta IA ni escribe código real:
// traduce lo que pide el usuario a una especificación y dibuja una vista previa
// para recorrer el flujo completo antes de conectar OpenCode.

export const PREGUNTAS = [
  { id: 'solicita', label: '¿Quién inicia el proceso?', ph: 'cualquier colaborador' },
  { id: 'aprueba', label: '¿Quién revisa o aprueba?', ph: 'jefe de área y finanzas' },
  { id: 'datos', label: '¿Qué datos se capturan?', ph: 'concepto, monto, fecha' },
]

export const ESTADOS = ['Preparando', 'Aplicando cambios', 'Verificando', 'Listo para revisar']

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
    accent: COLORES.azul,
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
:root{--a:${esc(spec.accent)}}
*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,sans-serif;color:#111827;background:#f8fafc}
header{background:var(--a);color:#fff;padding:18px 24px}header h1{margin:0;font-size:20px}
header p{margin:4px 0 0;opacity:.85;font-size:13px}
.idea{margin:0;color:#475569}.hint{font-size:12px;color:#64748b}
main{padding:24px;display:grid;gap:20px;max-width:900px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px}
h2{margin:0 0 14px;font-size:16px}form{display:grid;gap:12px;grid-template-columns:1fr 1fr}
label{display:grid;gap:5px;font-size:13px;color:#4b5563}
input{padding:9px 10px;border:1px solid #d1d5db;border-radius:7px;font:inherit}
button{background:var(--a);color:#fff;border:0;padding:10px 16px;border-radius:7px;font:inherit;cursor:pointer;justify-self:start}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:9px;border-bottom:1px solid #eef2f7}
th{font-size:12px;text-transform:uppercase;color:#6b7280}
.e{padding:2px 9px;border-radius:999px;font-size:12px;background:#fef3c7;color:#92400e}
.e.Aprobado{background:#dcfce7;color:#166534}.e.Rechazado{background:#fee2e2;color:#991b1b}
.notas{border-left:3px solid var(--a);background:#fff;padding:14px 18px;border-radius:0 10px 10px 0}
.notas h3{margin:0 0 8px;font-size:14px}
</style></head><body>
<header><h1>${esc(spec.titulo)}</h1><p>Prototipo de ${esc(tipo.lista.toLowerCase())} · Inicia: ${esc(spec.solicita)} · Revisa: ${esc(spec.aprueba)}</p></header>
<main>
${spec.idea ? `<p class="idea">${esc(spec.idea)}</p>` : ''}
<p class="hint">Vista ilustrativa. Estos datos y controles son de ejemplo.</p>
<section class="card"><h2>${esc(tipo.nuevo)}</h2><form onsubmit="return false">${campos}<button>${esc(tipo.accion)}</button></form></section>
<section class="card"><h2>${esc(tipo.lista)}</h2><table><thead><tr><th>Folio</th><th>Responsable</th><th>Detalle</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table></section>
${notas}
</main></body></html>`
}
