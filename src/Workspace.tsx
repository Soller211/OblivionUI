import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  CircleCheck, ExternalLink, History, Monitor, RotateCcw, SendHorizontal, Sparkles, TriangleAlert, Undo2,
} from 'lucide-react'
import { ESTADOS, interpretar, render } from './demo.js'
import { fecha, msg, pushMsg, restoreVersion, saveVersion, updateProject, useDB, type Project } from './store'
import { ir } from './App'
import {
  getHistory, getPending, revertChange, sendPrompt, unrevertChange,
  type Connection, type HistoryEntry, type Pending,
} from './api'
import { PendingDock } from './PendingDock'
import { Estado, folio, TONO_ESTADO } from '@/components/marca'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const hora = (ts: number) => new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
const suave = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

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

  const vive = p.mode === 'live'
  const bloqueado = vive && !linked
  const retenidos = vive && linked && pending && (pending.permissions.length > 0 || pending.questions.length > 0 || !pending.supported)

  return (
    <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 gap-4 p-4 max-lg:grid-cols-1 lg:h-full lg:grid-cols-[minmax(340px,34%)_1fr]">
      <Card className="flex min-h-0 flex-col gap-0 overflow-hidden py-0 max-lg:min-h-[32rem]">
        <header className="bg-muted/40 flex items-center gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{p.name}</h1>
            <p className="text-muted-foreground tabular font-mono text-[11px]">{folio(p.folio)}</p>
          </div>
          {vive
            ? <Estado tono="real">Proyecto real</Estado>
            : <Estado tono="demo"><Sparkles className="size-3" />Demostración</Estado>}
        </header>

        <div className="relative min-h-0 flex-1">
          <div className="h-full space-y-4 overflow-y-auto p-4">
          <Asiento rol="app" ts={p.createdAt} apertura>{p.idea}</Asiento>
          {p.messages.map((m) => (
            <Asiento key={m.id} rol={m.role} ts={m.ts} error={m.kind === 'error'}>{m.text}</Asiento>
          ))}
          <AnimatePresence>
            {estado && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={suave} className="flex items-center gap-2.5">
                <Estado tono={TONO_ESTADO[estado] || 'real'}>{estado}</Estado>
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="bg-primary/60 size-1.5 rounded-full"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={fin} />
          </div>
          <span aria-hidden
            className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t to-transparent" />
        </div>

        <AnimatePresence>
          {retenidos && (
            <PendingDock
              sessionID={p.sessionID || ''}
              directory={p.directory || ''}
              pending={pending!}
              onResolved={() => getPending(p.sessionID!, p.directory || '').then(setPending).catch((e) => setPendingError(e.message))}
            />
          )}
        </AnimatePresence>
        {vive && pendingError && (
          <Alert variant="destructive" role="alert" className="mx-4 mb-2 w-auto">
            <TriangleAlert className="size-4" />
            <AlertDescription>No se pudieron consultar las autorizaciones pendientes: {pendingError}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/40 space-y-2 border-t p-3">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={bloqueado}
            aria-label="Escribe lo que necesitas cambiar"
            className="bg-background max-h-40 min-h-20 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder={vive ? 'Describe el cambio que necesitas…' : 'Pide un cambio para verlo en la demostración…'}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs">
              {bloqueado ? 'Sin conexión con OpenCode' : 'Enter envía · Mayús+Enter salta de línea'}
            </span>
            <Button size="sm" className="gap-1.5" onClick={enviar} disabled={!texto.trim() || !!estado || bloqueado}>
              Enviar <SendHorizontal className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="flex min-h-0 flex-col gap-0 overflow-hidden py-0 max-lg:min-h-[36rem]">
        <header className="bg-muted/40 flex flex-wrap items-center gap-3 border-b px-4 py-2.5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'previa' | 'historial')}>
            <TabsList>
              <TabsTrigger value="previa" className="gap-1.5"><Monitor className="size-3.5" />Vista previa</TabsTrigger>
              <TabsTrigger value="historial" className="gap-1.5">
                <History className="size-3.5" />Historial{vive ? '' : ` (${p.versions.length})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="flex-1" />
          {!estado && !vive && (
            p.versions.length
              ? <Estado tono="ok"><CircleCheck className="size-3" />Listo para revisar</Estado>
              : <Estado tono="neutro">Sin versiones</Estado>
          )}
        </header>

        {tab === 'previa' ? (
          vive ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-2 border-b p-4">
                <Label htmlFor="vista-url" className="text-xs">Dirección donde se ejecuta el proyecto</Label>
                <div className="flex gap-2">
                  <Input id="vista-url" type="url" value={previewInput} className="font-mono text-xs"
                    onChange={(e) => setPreviewInput(e.target.value)} placeholder="https://mi-proyecto.example.com" />
                  <Button variant="outline" size="sm" onClick={guardarVista}>Guardar</Button>
                  {safePreviewUrl && (
                    <Button asChild variant="ghost" size="icon" aria-label="Abrir en otra pestaña">
                      <a href={safePreviewUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a>
                    </Button>
                  )}
                </div>
                {previewError && <p className="text-destructive text-xs" role="alert">{previewError}</p>}
              </div>
              {safePreviewUrl ? (
                <iframe className="min-h-0 w-full flex-1 bg-white" title="Vista previa del proyecto real"
                  src={safePreviewUrl} sandbox="allow-scripts allow-forms" />
              ) : (
                <Vacio titulo="Todavía no hay vista previa">
                  Agrega arriba la dirección donde se ejecuta el proyecto para verlo aquí sin salir de OblivionUI.
                </Vacio>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-demo/25 bg-demo-bg/50 text-demo flex items-center gap-2.5 border-b px-4 py-2.5 text-xs">
                <Sparkles className="size-3.5 shrink-0" />
                <span>Vista ilustrativa del resultado. No hay código real detrás.</span>
              </div>
              <iframe className="min-h-0 w-full flex-1 bg-white" title="Vista previa de demostración"
                srcDoc={p.html} sandbox="allow-forms" />
            </div>
          )
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {vive ? (
              <>
                <p className="text-muted-foreground text-sm text-pretty">
                  Solicitudes de esta sesión de OpenCode. Puedes volver al estado anterior a cualquiera de ellas.
                </p>
                {canUndoRestore && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={deshacerRecuperacion} disabled={historyBusy}>
                    <Undo2 className="size-3.5" />Deshacer la última recuperación
                  </Button>
                )}
                {historyError && (
                  <Alert variant="destructive" role="alert">
                    <TriangleAlert className="size-4" />
                    <AlertDescription>{historyError}</AlertDescription>
                  </Alert>
                )}
                {!linked && <p className="text-muted-foreground text-sm">Conecta la instancia original para consultar el historial.</p>}
                {linked && history.length === 0 && !historyError && (
                  <p className="text-muted-foreground text-sm">Todavía no hay solicitudes registradas en OpenCode.</p>
                )}
                {history.map((entry, i) => (
                  <Version key={entry.id} clave={`${folio(p.folio)}-${String(history.length - i).padStart(2, '0')}`}
                    titulo={entry.text || 'Solicitud sin texto'} ts={entry.createdAt || undefined}>
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={historyBusy || !linked}
                      onClick={() => restaurarReal(entry)}>
                      <RotateCcw className="size-3.5" />Volver aquí
                    </Button>
                  </Version>
                ))}
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm text-pretty">
                  Cada cambio queda guardado como una versión. Recuperar una no borra las demás.
                </p>
                {p.versions.map((v, i) => {
                  const actual = v.id === (p.currentVersionId || p.versions[0]?.id)
                  return (
                    <Version key={v.id} clave={`${folio(p.folio)}-${String(p.versions.length - i).padStart(2, '0')}`}
                      titulo={v.label} ts={v.ts}>
                      {actual
                        ? <Estado tono="ok"><CircleCheck className="size-3" />Vigente</Estado>
                        : (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => restaurar(v)}>
                            <RotateCcw className="size-3.5" />Recuperar
                          </Button>
                        )}
                    </Version>
                  )
                })}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function Asiento({ rol, ts, error, apertura, children }: {
  rol: 'user' | 'app'
  ts: number
  error?: boolean
  apertura?: boolean
  children: React.ReactNode
}) {
  const usuario = rol === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={suave}
      className={cn('flex flex-col gap-1', usuario ? 'items-end' : 'items-start')}
    >
      <div
        className={cn(
          'max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap [overflow-wrap:anywhere]',
          usuario && 'bg-primary text-primary-foreground rounded-br-sm',
          !usuario && !error && 'bg-muted rounded-bl-sm',
          apertura && 'bg-transparent text-muted-foreground border border-dashed',
          error && 'bg-destructive/10 text-destructive border-destructive/30 rounded-bl-sm border',
        )}
      >
        {children}
      </div>
      <time dateTime={new Date(ts).toISOString()} title={fecha(ts)}
        className="text-muted-foreground tabular px-1 font-mono text-[10px]">
        {apertura ? `Alta · ${hora(ts)}` : hora(ts)}
      </time>
    </motion.div>
  )
}

function Version({ clave, titulo, ts, children }: {
  clave: string
  titulo: string
  ts?: number
  children: React.ReactNode
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={suave}
      className="hover:bg-accent/40 flex items-center gap-4 rounded-lg border p-3 transition-colors">
      <span className="text-muted-foreground tabular shrink-0 font-mono text-[11px]">{clave}</span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-3 text-sm [overflow-wrap:anywhere]">{titulo}</p>
        {ts && (
          <time dateTime={new Date(ts).toISOString()} className="text-muted-foreground tabular font-mono text-[10px]">
            {fecha(ts)}
          </time>
        )}
      </div>
      {children}
    </motion.div>
  )
}

function Vacio({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-primary/10 text-primary rounded-xl p-3"><Monitor className="size-5" /></span>
      <p className="font-medium">{titulo}</p>
      <p className="text-muted-foreground max-w-sm text-sm text-pretty">{children}</p>
    </div>
  )
}
