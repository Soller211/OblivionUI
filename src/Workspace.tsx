import { useEffect, useRef, useState } from 'react'
import { ESTADOS, interpretar, render } from './demo.js'
import { fecha, msg, pushMsg, restoreVersion, saveVersion, updateProject, useDB, type Project } from './store'
import { ir } from './App'
import { getHistory, getPending, revertChange, sendPrompt, unrevertChange, type Connection, type HistoryEntry, type Pending } from './api'
import { PendingDock } from './PendingDock'

export function Workspace({ id, connection }: { id: string; connection: Connection | null }) {
  const { projects } = useDB()
  const p = projects.find((x) => x.id === id)
  const linked = !!connection?.connected && (!p?.serverUrl || p.serverUrl.replace(/\/$/, '') === connection.url?.replace(/\/$/, ''))
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<string | null>(null)
  const [tab, setTab] = useState<'previa' | 'historial'>('previa')
  const [previewInput, setPreviewInput] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [pending, setPending] = useState<Pending | null>(null)
  const [pendingError, setPendingError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyError, setHistoryError] = useState('')
  const [historyBusy, setHistoryBusy] = useState(false)
  const [canUndoRestore, setCanUndoRestore] = useState(false)
  const safePreviewUrl = (() => {
    try {
      const url = new URL(p?.previewUrl || '')
      return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch { return '' }
  })()
  const fin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!p) ir('/')
  }, [p])

  useEffect(() => { setPreviewInput(p?.previewUrl || '') }, [p?.id])

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' })
  }, [p?.messages.length, estado])

  // Primera versión: se construye al abrir un proyecto recién creado.
  useEffect(() => {
    if (p?.mode !== 'live' && p && p.versions.length === 0 && !estado) correr(`Crear la primera versión: ${p.idea}`, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id])

  useEffect(() => {
    if (p?.mode === 'live' && p.sessionID && !p.started && linked) {
      updateProject(p.id, (project) => ({ ...project, started: true }))
      const brief = `Crea este proyecto en el directorio actual. Idea: ${p.idea}. Quién inicia: ${p.answers.solicita || 'por definir'}. Quién revisa: ${p.answers.aprueba || 'por definir'}. Datos: ${p.answers.datos || 'por definir'}. Trabaja sobre los archivos reales, verifica los cambios y responde en español claro para una persona que no programa.`
      correrLive(brief, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id, linked])

  useEffect(() => {
    if (tab !== 'historial' || p?.mode !== 'live' || !p.sessionID || !linked) return
    let active = true
    getHistory(p.sessionID, p.directory || '').then((entries) => {
      if (active) { setHistory(entries); setHistoryError('') }
    }).catch((error) => { if (active) setHistoryError(error.message) })
    return () => { active = false }
  }, [tab, p?.id, p?.messages.length, linked])

  useEffect(() => {
    if (p?.mode !== 'live' || !p.sessionID || !linked) { setPending(null); return }
    let active = true
    let inFlight = false
    const check = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const result = await getPending(p.sessionID!, p.directory || '')
        if (active) { setPending(result); setPendingError('') }
      } catch (e) { if (active) setPendingError((e as Error).message) }
      finally { inFlight = false }
    }
    check()
    const timer = setInterval(check, 2500)
    return () => { active = false; clearInterval(timer) }
  }, [p?.id, linked])

  if (!p) return null

  async function correr(peticion: string, inicial = false) {
    const proyecto = p as Project
    if (!inicial) pushMsg(proyecto.id, msg('user', peticion))
    for (const e of ESTADOS.slice(0, -1)) {
      setEstado(e)
      await new Promise((r) => setTimeout(r, 700))
    }
    const { spec, resumen } = inicial
      ? { spec: proyecto.spec, resumen: 'Preparé una primera versión con lo que me contaste. Revísala y dime qué cambio.' }
      : interpretar(peticion, proyecto.spec)
    saveVersion(proyecto.id, inicial ? 'Primera versión' : resumen, render(spec), spec)
    pushMsg(proyecto.id, msg('app', resumen))
    setEstado(null)
    setTab('previa')
  }

  async function correrLive(peticion: string, inicial = false) {
    if (!p?.sessionID) return
    if (!inicial) pushMsg(p.id, msg('user', peticion))
    setEstado('OpenCode trabajando')
    try {
      const result = await sendPrompt(p.sessionID, p.directory || '', peticion)
      pushMsg(p.id, msg('app', result.answer))
    } catch (e) {
      pushMsg(p.id, msg('app', (e as Error).message, 'error'))
      if (inicial) updateProject(p.id, (project) => ({ ...project, started: false }))
    } finally { setEstado(null) }
  }

  function enviar() {
    const t = texto.trim()
    if (!t || estado || !p) return
    setTexto('')
    if (p.mode === 'live') {
      if (!linked) { setTexto(t); return }
      correrLive(t)
    } else correr(t)
  }

  function guardarVista() {
    const value = previewInput.trim()
    if (value) {
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      } catch { setPreviewError('Escribe una URL http o https válida.'); return }
    }
    updateProject(p!.id, (project) => ({ ...project, previewUrl: value }))
    setPreviewError('')
  }

  function restaurar(v: Project['versions'][number]) {
    if (!restoreVersion(p!.id, v.id)) return
    pushMsg(p!.id, msg('app', `Recuperé la versión «${v.label}» (${fecha(v.ts)}) y guardé una nueva versión del proyecto.`))
    setTab('previa')
  }

  async function restaurarReal(entry: HistoryEntry) {
    if (!p?.sessionID || !confirm('OpenCode deshará los cambios de esta solicitud y los posteriores. ¿Quieres continuar?')) return
    setHistoryBusy(true); setHistoryError('')
    try {
      await revertChange(p.sessionID, p.directory || '', entry.id)
      pushMsg(p.id, msg('app', 'OpenCode recuperó el estado anterior a esa solicitud. Revisa la aplicación antes de seguir.'))
      setCanUndoRestore(true)
      setHistory(await getHistory(p.sessionID, p.directory || ''))
    } catch (error) { setHistoryError((error as Error).message) }
    finally { setHistoryBusy(false) }
  }

  async function deshacerRecuperacion() {
    if (!p?.sessionID) return
    setHistoryBusy(true); setHistoryError('')
    try {
      await unrevertChange(p.sessionID, p.directory || '')
      pushMsg(p.id, msg('app', 'OpenCode deshizo la recuperación anterior.'))
      setCanUndoRestore(false)
      setHistory(await getHistory(p.sessionID, p.directory || ''))
    } catch (error) { setHistoryError((error as Error).message) }
    finally { setHistoryBusy(false) }
  }

  return (
    <div className="ws">
      <div className="pane">
        <header>
          <h2>{p.name}</h2>
        </header>
        <div className="chat">
          <div className="m app">
            {p.idea}
            <time>{fecha(p.createdAt)}</time>
          </div>
          {p.messages.map((m) => (
            <div className={`m ${m.role} ${m.kind === 'error' ? 'error' : ''}`} key={m.id}>
              {m.text}
              <time>{fecha(m.ts)}</time>
            </div>
          ))}
          <div ref={fin} />
        </div>
        {estado && (
          <div className="estado">
            <span className="dot" /> {estado}…
          </div>
        )}
        {p.mode === 'live' && linked && pending && (pending.permissions.length > 0 || pending.questions.length > 0 || !pending.supported) &&
          <PendingDock sessionID={p.sessionID || ''} directory={p.directory || ''} pending={pending}
            onResolved={() => getPending(p.sessionID!, p.directory || '').then(setPending).catch((e) => setPendingError(e.message))} />}
        {p.mode === 'live' && pendingError && <p className="bad pending-error">No se pudieron consultar preguntas pendientes: {pendingError}</p>}
        <div className="composer">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder={p.mode === 'live' ? 'Describe el cambio que necesitas…' : 'Pide un cambio (modo demostración)…'}
          />
          <button className="btn" onClick={enviar} disabled={!texto.trim() || !!estado || (p.mode === 'live' && !linked)}>
            Enviar
          </button>
        </div>
      </div>

      <div className="pane">
        <header>
          <div className="tabs">
            <button className={tab === 'previa' ? 'on' : ''} onClick={() => setTab('previa')}>Vista previa</button>
            <button className={tab === 'historial' ? 'on' : ''} onClick={() => setTab('historial')}>
              Historial {p.mode === 'live' ? '' : `(${p.versions.length})`}
            </button>
          </div>
          <span className="spacer" />
          <span className="estado" style={{ border: 0, padding: 0 }}>
            {estado ? p.mode === 'live' ? estado : `${estado} · demostración` : p.mode === 'live' ? 'Proyecto real' : p.versions.length ? 'Vista ilustrativa lista' : 'Sin versiones'}
          </span>
        </header>
        {tab === 'previa' ? p.mode === 'live' ? (
          <div className="real-preview">
            <div className="preview-config">
              <p>Vista previa del proyecto</p>
              <div className="row"><input type="url" value={previewInput} onChange={(e) => setPreviewInput(e.target.value)} placeholder="URL donde se ejecuta este proyecto" />
                <button className="btn ghost" onClick={guardarVista}>Guardar URL</button></div>
              {previewError && <span className="bad">{previewError}</span>}
              <small>La URL debe apuntar a la aplicación que ya está ejecutándose. Algunas aplicaciones impiden mostrarse dentro de otra página.</small>
            </div>
            {safePreviewUrl ? <><a className="open-preview" href={safePreviewUrl} target="_blank" rel="noreferrer">Abrir vista previa en otra pestaña ↗</a>
              <iframe className="preview" title="Vista previa del proyecto real" src={safePreviewUrl} sandbox="allow-scripts allow-forms" /></>
              : <div className="empty preview-empty">Agrega la URL de la aplicación para verla aquí.</div>}
          </div>
        ) : (
          <iframe className="preview" title="Vista previa de demostración" srcDoc={p.html} sandbox="allow-forms" />
        ) : (
          <div className="vers">
            {p.mode === 'live' ? <>
              <p className="sub">Solicitudes de esta sesión de OpenCode. Puedes volver al estado anterior a una de ellas.</p>
              {canUndoRestore && <button className="btn ghost" onClick={deshacerRecuperacion} disabled={historyBusy}>Deshacer última recuperación</button>}
              {historyError && <p className="bad" role="alert">{historyError}</p>}
              {!linked && <p className="sub">Conecta la instancia original para consultar el historial.</p>}
              {linked && history.length === 0 && !historyError && <p className="sub">Todavía no hay solicitudes en OpenCode.</p>}
              {history.map((entry) => <div className="ver" key={entry.id}>
                <div className="history-text">{entry.text || 'Solicitud sin texto'}<br />
                  {entry.createdAt && <small>{fecha(entry.createdAt)}</small>}</div>
                <button className="btn ghost" onClick={() => restaurarReal(entry)} disabled={historyBusy || !linked}>Volver aquí</button>
              </div>)}
            </> : p.versions.map((v) => (
              <div className="ver" key={v.id}>
                <div>
                  {v.label}
                  <br />
                  <small>{fecha(v.ts)}</small>
                </div>
                <button className="btn ghost" onClick={() => restaurar(v)} disabled={v.id === (p.currentVersionId || p.versions[0]?.id)}>
                  {v.id === (p.currentVersionId || p.versions[0]?.id) ? 'Actual' : 'Recuperar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
