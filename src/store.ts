import { useSyncExternalStore } from 'react'

export type Spec = {
  titulo: string
  idea: string
  tipo: 'solicitudes' | 'inventario' | 'clientes' | 'tareas' | 'general'
  accent: string
  campos: string[]
  solicita: string
  aprueba: string
  notas: string[]
}
export type Msg = { id: string; role: 'user' | 'app'; text: string; kind?: 'estado' | 'error'; ts: number }
export type Version = { id: string; label: string; ts: number; html: string; spec: Spec }
export type Project = {
  id: string
  folio: number
  name: string
  idea: string
  answers: Record<string, string>
  messages: Msg[]
  versions: Version[]
  currentVersionId?: string
  html: string
  spec: Spec
  createdAt: number
  mode?: 'demo' | 'live'
  sessionID?: string
  serverUrl?: string
  directory?: string
  previewUrl?: string
  started?: boolean
}
export type Settings = { url: string; template: string; serverReachable: boolean }
type DB = { projects: Project[]; settings: Settings }

let scope = 'local'
const key = () => scope === 'local' ? 'pagobli.v1' : `pagobli.v2.${scope}`
const empty: DB = { projects: [], settings: { url: '', template: 'Base Laravel', serverReachable: false } }

function load(): DB {
  try {
    const raw = localStorage.getItem(key())
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    const { url = '', template = 'Base Laravel' } = parsed.settings || {}
    // La versión anterior guardaba el token en localStorage. No se migra ni se vuelve a guardar.
    // La accesibilidad debe comprobarse de nuevo al abrir la aplicación.
    // Expedientes anteriores al folio: se numeran una sola vez por antigüedad.
    const projects: Project[] = parsed.projects || []
    let siguiente = 0
    for (const project of [...projects].sort((a, b) => a.createdAt - b.createdAt)) {
      if (typeof project.folio === 'number') siguiente = Math.max(siguiente, project.folio)
      else project.folio = ++siguiente
    }
    const clean: DB = { projects, settings: { url, template, serverReachable: false } }
    try { localStorage.setItem(key(), JSON.stringify(clean)) } catch { /* memoria disponible */ }
    return clean
  } catch {
    return empty
  }
}

let db = load()
const subs = new Set<() => void>()

function commit(next: DB) {
  db = next
  try {
    localStorage.setItem(key(), JSON.stringify(db))
  } catch {
    /* modo privado: la sesión sigue funcionando en memoria */
  }
  subs.forEach((f) => f())
}

export function setScope(next: string) {
  scope = next || 'local'
  db = load()
  subs.forEach((f) => f())
}

export function useDB(): DB {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => db,
  )
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function addProject(p: Omit<Project, 'id' | 'folio' | 'createdAt' | 'messages' | 'versions'>): Project {
  const folio = db.projects.reduce((mayor, project) => Math.max(mayor, project.folio || 0), 0) + 1
  const project: Project = { ...p, id: uid(), folio, createdAt: Date.now(), messages: [], versions: [] }
  commit({ ...db, projects: [project, ...db.projects] })
  return project
}

export function updateProject(id: string, patch: (p: Project) => Project) {
  commit({ ...db, projects: db.projects.map((p) => (p.id === id ? patch(p) : p)) })
}

export function deleteProject(id: string) {
  commit({ ...db, projects: db.projects.filter((p) => p.id !== id) })
}

export function setSettings(patch: Partial<Settings>) {
  commit({ ...db, settings: { ...db.settings, ...patch } })
}

export const msg = (role: Msg['role'], text: string, kind?: Msg['kind']): Msg => ({
  id: uid(),
  role,
  text,
  kind,
  ts: Date.now(),
})

export function pushMsg(id: string, m: Msg) {
  updateProject(id, (p) => ({ ...p, messages: [...p.messages, m] }))
}

export function saveVersion(id: string, label: string, html: string, spec: Spec) {
  const version: Version = { id: uid(), label, ts: Date.now(), html, spec: structuredClone(spec) }
  updateProject(id, (p) => ({
    ...p,
    html,
    spec,
    currentVersionId: version.id,
    versions: [version, ...p.versions],
  }))
}

export function restoreVersion(id: string, sourceId: string) {
  const p = db.projects.find((project) => project.id === id)
  const source = p?.versions.find((version) => version.id === sourceId)
  if (!source || p?.currentVersionId === source.id) return false
  saveVersion(id, `Recuperada: ${source.label}`, source.html, structuredClone(source.spec))
  return true
}

export const fecha = (ts: number) =>
  new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
