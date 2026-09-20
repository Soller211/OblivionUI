import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft, ArrowRight, CircleCheck, FileText, Plug, Plus, ShieldAlert, Sparkles, Trash2, TriangleAlert,
} from 'lucide-react'
import { addProject, deleteProject, fecha, setSettings, useDB, type Project } from './store'
import { PREGUNTAS, render, specInicial } from './demo.js'
import { Workspace } from './Workspace'
import { connect, createSession, disconnect, getConnection, provisionProject, type Connection } from './api'
import { Estado, folio, Marca } from '@/components/marca'
import { SelectorTema } from '@/components/tema'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

function useHash() {
  const [hash, setHash] = useState(location.hash.slice(1) || '/')
  useEffect(() => {
    const f = () => setHash(location.hash.slice(1) || '/')
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return hash
}

export const ir = (ruta: string) => (location.hash = ruta)

const limpia = (url?: string) => (url || '').replace(/\/$/, '')
const entrada = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } }
const suave = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
const EJEMPLOS = {
  presupuestos: { nombre: 'Aprobación de presupuestos', idea: 'Necesito que cada área solicite presupuestos, un responsable los revise y podamos consultar su estado.' },
  inventario: { nombre: 'Control de inventario', idea: 'Quiero registrar entradas y salidas de productos, saber qué hay disponible y recibir avisos cuando algo se agote.' },
  vacaciones: { nombre: 'Solicitudes de vacaciones', idea: 'Necesito que el equipo solicite vacaciones, sus responsables las aprueben y todos puedan ver los días disponibles.' },
} as const

export function App() {
  const ruta = useHash()
  const { projects } = useDB()
  const proyecto = ruta.match(/^\/p\/(\w+)/)?.[1]
  const [connection, setConnection] = useState<Connection | null>(null)
  useEffect(() => {
    getConnection().then(setConnection).catch(() => setConnection({ connected: false, available: false }))
  }, [])
  const activo = proyecto ? projects.find((p) => p.id === proyecto) : undefined
  const linked = !!connection?.connected && (!activo?.serverUrl || limpia(activo.serverUrl) === limpia(connection.url))
  const enRegistro = ruta === '/' || ruta.startsWith('/p/')
  const enTallerDemo = !!proyecto && activo?.mode !== 'live'
  const conBoton = !ruta.startsWith('/nuevo') && ruta !== '/'

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <a href="#/" className="focus-visible:ring-ring/50 rounded-md focus-visible:ring-[3px] focus-visible:outline-none">
            <Marca compacta={conBoton} />
          </a>
          <Separator orientation="vertical" className="mx-2 !h-6 max-sm:hidden" />
          <nav className="flex items-center gap-1">
            <Enlace href="#/" activo={enRegistro}>Proyectos</Enlace>
            <Enlace href="#/config" activo={ruta === '/config'}>Configuración</Enlace>
          </nav>
          <span className="flex-1" />
          <SelectorTema />
          {conBoton && (
            <Button asChild size="sm" className="gap-1.5 max-sm:size-8 max-sm:p-0">
              <a href="#/nuevo" aria-label="Nuevo proyecto">
                <Plus className="size-4" /><span className="max-sm:hidden">Nuevo proyecto</span>
              </a>
            </Button>
          )}
        </div>
      </header>

      {!enTallerDemo && <BandaInstalacion activo={activo} connection={connection} linked={linked} />}

      <main className={cn('flex min-h-0 flex-1 flex-col', proyecto ? 'overflow-y-auto lg:overflow-hidden' : 'overflow-y-auto')}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={proyecto || ruta} {...entrada} transition={suave}
            className={cn('flex flex-col', proyecto && 'min-h-0 flex-1 max-lg:min-h-max')}>
            {proyecto ? (
              <Workspace id={proyecto} connection={connection} />
            ) : ruta.startsWith('/nuevo') ? (
              <Alta connection={connection} ejemplo={EJEMPLOS[new URLSearchParams(ruta.split('?')[1] || '').get('ejemplo') as keyof typeof EJEMPLOS]} />
            ) : ruta === '/config' ? (
              <Configuracion connection={connection} onConnection={setConnection} />
            ) : (
              <Registro />
            )}
          </motion.div>
        </AnimatePresence>

        {!proyecto && (
            <footer className="text-muted-foreground mx-auto mt-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 border-t px-4 py-5 text-xs sm:px-6">
            <span>OblivionUI · herramienta interna</span>
            <span className="font-mono">
              {connection?.connected ? `Conectado · ${limpia(connection.url)}` : 'Modo demostración · sin conexión'}
            </span>
            <span className="max-sm:hidden">Los proyectos se guardan en este navegador</span>
          </footer>
        )}
      </main>
    </div>
  )
}

function Enlace({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm" className={cn('relative', !activo && 'text-muted-foreground')}>
      <a href={href} aria-current={activo ? 'page' : undefined}>
        {children}
        {activo && (
          <motion.span layoutId="nav-activo" transition={suave}
            className="bg-primary absolute inset-x-2 -bottom-px h-0.5 rounded-full" />
        )}
      </a>
    </Button>
  )
}

function BandaInstalacion({ activo, connection, linked }: {
  activo?: Project
  connection: Connection | null
  linked: boolean
}) {
  if (activo?.mode === 'live' && !linked) {
    return (
      <Franja tono="hold" Icono={TriangleAlert}>
        <strong className="font-medium">Este proyecto trabaja contra OpenCode y la instancia no responde.</strong>
        <span className="max-sm:hidden">Conéctala para poder seguir.</span>
        <a href="#/config" className="ml-2 underline underline-offset-4">Ir a configuración</a>
      </Franja>
    )
  }
  if (connection?.connected) {
    return (
      <Franja tono="ok" Icono={CircleCheck}>
        <strong className="font-medium">OpenCode conectado.</strong>
        <span className="max-sm:hidden">Los proyectos reales se construyen en tu servidor.</span>
        <span className="ml-auto font-mono text-xs max-sm:hidden">{limpia(connection.url)}</span>
      </Franja>
    )
  }
  return (
    <Franja tono="demo" Icono={Sparkles}>
      <strong className="font-medium">Modo demostración.</strong>
      <span className="max-sm:hidden">Lo que se ve es ilustrativo: no se ejecuta código real.</span>
      <a href="#/config" className="ml-2 underline underline-offset-4">Conectar OpenCode</a>
    </Franja>
  )
}

function Franja({ tono, Icono, children }: {
  tono: 'demo' | 'ok' | 'hold'
  Icono: typeof Sparkles
  children: React.ReactNode
}) {
  const tonos = {
    demo: 'border-demo/25 bg-demo-bg/60 text-demo',
    ok: 'border-ok/25 bg-ok-bg/60 text-ok',
    hold: 'border-hold/25 bg-hold-bg/60 text-hold',
  }
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={suave}
      className={cn('flex items-center gap-2.5 border-b px-4 py-2.5 text-sm sm:px-6', tonos[tono])}
    >
      <Icono className="size-4 shrink-0" />
      <span className="flex w-full flex-wrap items-center gap-x-1">{children}</span>
    </motion.div>
  )
}

function Registro() {
  const { projects } = useDB()
  const [porBorrar, setPorBorrar] = useState<Project | null>(null)
  const movimiento = (p: Project) => p.messages[p.messages.length - 1]?.ts || p.createdAt

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Tus proyectos</h1>
          <p className="text-muted-foreground text-sm">
            Describe lo que necesitas y revisa el resultado sin tocar código.
          </p>
        </div>
        {projects.length > 0 && <Button asChild className="gap-1.5 max-sm:w-full">
          <a href="#/nuevo"><Plus className="size-4" />Nuevo proyecto</a>
        </Button>}
      </div>

      {projects.length === 0 ? (
        <motion.div {...entrada} transition={suave}>
          <Card className="overflow-hidden py-0">
            <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-12">
              <div className="flex flex-col items-start justify-center gap-5">
                <span className="bg-primary/10 text-primary rounded-xl p-3"><FileText className="size-6" /></span>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Empieza con un proceso que hoy haces a mano</h2>
                  <p className="text-muted-foreground max-w-md text-sm leading-relaxed text-pretty">
                    Cuéntanos qué necesitas, responde tres preguntas y revisa una primera propuesta. Puedes pedir cambios después.
                  </p>
                </div>
                <Button asChild className="gap-1.5">
                  <a href="#/nuevo"><Plus className="size-4" />Crear un proyecto</a>
                </Button>
              </div>
              <div className="space-y-3 lg:border-l lg:pl-8">
                <p className="text-muted-foreground text-sm font-medium">O empieza con un ejemplo</p>
                {Object.entries(EJEMPLOS).map(([id, ejemplo]) => (
                  <a key={id} href={`#/nuevo?ejemplo=${id}`}
                    className="hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-ring/50 flex items-center gap-4 rounded-lg border p-4 transition-colors focus-visible:ring-[3px] focus-visible:outline-none">
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-medium">{ejemplo.nombre}</strong>
                      <span className="text-muted-foreground mt-1 block text-sm leading-snug text-pretty">{ejemplo.idea}</span>
                    </span>
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                  </a>
                ))}
                <p className="text-muted-foreground text-xs">Los ejemplos rellenan la idea; puedes cambiarla antes de crear el proyecto.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* En pantallas chicas la tabla no cabe: cada proyecto es una tarjeta. */}
          <div className="space-y-3 sm:hidden">
            {projects.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...suave, delay: Math.min(i * 0.04, 0.2) }}>
                <Card className="gap-0 py-0">
                  <div className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-muted-foreground tabular font-mono text-xs">{folio(p.folio)}</span>
                      <a href={`#/p/${p.id}`} className="block font-medium underline-offset-4 hover:underline">
                        {p.name}
                      </a>
                      <p className="text-muted-foreground line-clamp-2 text-sm text-pretty">{p.idea}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mr-1"
                      aria-label={`Eliminar ${p.name}`} onClick={() => setPorBorrar(p)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-3">
                    {p.mode === 'live'
                      ? <Estado tono="real"><Plug className="size-3" />Proyecto real</Estado>
                      : <Estado tono="demo"><Sparkles className="size-3" />Demostración</Estado>}
                    <span className="text-muted-foreground tabular font-mono text-xs">
                      {p.versions.length} {p.versions.length === 1 ? 'versión' : 'versiones'} · {fecha(movimiento(p))}
                    </span>
                    <Button asChild variant="ghost" size="sm" className="ml-auto gap-1">
                      <a href={`#/p/${p.id}`}>Abrir <ArrowRight className="size-3.5" /></a>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="overflow-hidden py-0 max-sm:hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28 pl-5">Folio</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead className="w-44">Estado</TableHead>
                <TableHead className="w-40 max-lg:hidden">Último movimiento</TableHead>
                <TableHead className="w-28 pr-5 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...suave, delay: Math.min(i * 0.04, 0.2) }}
                  className="hover:bg-accent/40 border-b transition-colors last:border-0"
                >
                  <TableCell className="text-muted-foreground tabular pl-5 font-mono text-xs">
                    {folio(p.folio)}
                  </TableCell>
                  <TableCell className="min-w-0 py-3">
                    <a href={`#/p/${p.id}`} className="block truncate font-medium underline-offset-4 hover:underline">
                      {p.name}
                    </a>
                    <p className="text-muted-foreground mt-0.5 truncate text-sm">{p.idea}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1.5">
                      {p.mode === 'live'
                        ? <Estado tono="real"><Plug className="size-3" />Proyecto real</Estado>
                        : <Estado tono="demo"><Sparkles className="size-3" />Demostración</Estado>}
                      <span className="text-muted-foreground tabular font-mono text-xs">
                        {p.versions.length} {p.versions.length === 1 ? 'versión' : 'versiones'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular font-mono text-xs max-lg:hidden">
                    {fecha(movimiento(p))}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <a href={`#/p/${p.id}`} aria-label={`Abrir ${p.name}`}>
                          Abrir <ArrowRight className="size-3.5" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Eliminar ${p.name}`}
                        onClick={() => setPorBorrar(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          </Card>
        </>
      )}

      <Dialog open={!!porBorrar} onOpenChange={(abierto) => !abierto && setPorBorrar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar «{porBorrar?.name}»?</DialogTitle>
            <DialogDescription>
              Se borra el proyecto y su historial de este navegador. No se puede deshacer.
              {porBorrar?.mode === 'live' && ' El trabajo que OpenCode ya hizo en el servidor no se toca.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              variant="destructive"
              onClick={() => { if (porBorrar) deleteProject(porBorrar.id); setPorBorrar(null) }}
            >
              Eliminar proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const ROL: Record<string, string> = { solicita: 'Solicita', aprueba: 'Autoriza', datos: 'Datos que se capturan' }

function Alta({ connection, ejemplo }: { connection: Connection | null; ejemplo?: typeof EJEMPLOS[keyof typeof EJEMPLOS] }) {
  const { projects } = useDB()
  const [paso, setPaso] = useState(0)
  const [name, setName] = useState<string>(ejemplo?.nombre || '')
  const [idea, setIdea] = useState<string>(ejemplo?.idea || '')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [demo, setDemo] = useState(false)
  const [directory, setDirectory] = useState('')
  const [source, setSource] = useState<'template' | 'existing'>('template')
  const [previewUrl, setPreviewUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const siguienteFolio = projects.reduce((mayor, p) => Math.max(mayor, p.folio || 0), 0) + 1

  async function crear() {
    setCreating(true)
    setError('')
    const live = !!connection?.connected && !demo
    const fromTemplate = live && !!connection?.provisioning && source === 'template'
    const spec = specInicial(name.trim(), answers, idea.trim())
    try {
      if (live && previewUrl.trim()) {
        let parsed
        try { parsed = new URL(previewUrl.trim()) } catch { throw new Error('La vista previa necesita una URL http o https válida.') }
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('La vista previa necesita una URL http o https válida.')
      }
      const workspace = directory.trim() || connection?.directory || ''
      if (live && !fromTemplate && projects.some((project) => project.mode === 'live' && project.directory === workspace && project.serverUrl === connection?.url)) {
        throw new Error('Ya tienes un proyecto vinculado a ese directorio de OpenCode. Abre ese proyecto o usa otro directorio.')
      }
      let session: { id: string; directory: string } | null = null
      let automaticPreview = ''
      if (live) {
        if (fromTemplate) {
          const provisioned = await provisionProject(name.trim())
          session = provisioned
          automaticPreview = provisioned.runtime.previewUrl
        } else session = await createSession(name.trim(), workspace)
      }
      const p = addProject({
        name: name.trim(), idea: idea.trim(), answers, spec,
        html: live ? '' : render(spec), mode: live ? 'live' : 'demo',
        sessionID: session?.id, directory: session?.directory,
        serverUrl: live ? connection?.url : undefined,
        previewUrl: live ? previewUrl.trim() || automaticPreview : undefined,
      })
      ir(`/p/${p.id}`)
    } catch (e) {
      setError((e as Error).message)
    } finally { setCreating(false) }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Paso {paso + 1} de 2</span>
        <span className="bg-border h-1 w-28 overflow-hidden rounded-full">
          <motion.span
            className="bg-primary block h-full origin-left"
            initial={false}
            animate={{ scaleX: paso === 0 ? 0.5 : 1 }}
            transition={suave}
          />
        </span>
        <Badge variant="secondary" className="tabular ml-auto font-mono text-xs">
          {folio(siguienteFolio)} · por asignar
        </Badge>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {paso === 0 ? (
          <motion.div key="paso-1" {...entrada} transition={suave}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">¿Qué necesitas construir?</CardTitle>
                <CardDescription>Escríbelo con tus palabras, como se lo explicarías a un compañero.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del proyecto</Label>
                  <Input id="nombre" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Aprobación de presupuestos" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idea">¿Qué debe resolver?</Label>
                  <Textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} className="min-h-28"
                    placeholder="Necesito un sistema para aprobar los presupuestos del área; hoy se hace por correo…" />
                  <p className="text-muted-foreground text-xs">
                    Entre más concreto sea el proceso actual, mejor queda la primera versión.
                  </p>
                </div>
                <Button className="gap-1.5" disabled={!name.trim() || !idea.trim()} onClick={() => setPaso(1)}>
                  Continuar <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="paso-2" {...entrada} transition={suave} className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Responsables y datos</CardTitle>
                <CardDescription>Con esto armamos la primera versión. Todo se puede cambiar después.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {PREGUNTAS.map((q: { id: string; label: string; ph: string }) => (
                  <div className="space-y-2" key={q.id}>
                    <Label htmlFor={q.id}>{ROL[q.id] || q.label}</Label>
                    <Input id={q.id} value={answers[q.id] || ''} placeholder={`Ej. ${q.ph}`}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                    <p className="text-muted-foreground text-xs">{q.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {connection?.connected ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cómo se va a construir</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label className="hover:bg-accent/40 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5 flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox checked={demo} onCheckedChange={(v) => setDemo(v === true)} className="mt-0.5" />
                    <span className="space-y-1 font-normal">
                      <span className="block font-medium">Solo como demostración</span>
                      <span className="text-muted-foreground block text-sm">
                        No se toca el servidor: sirve para enseñar el recorrido sin construir nada real.
                      </span>
                    </span>
                  </Label>

                  {!demo && connection.provisioning && (
                    <RadioGroup value={source} onValueChange={(v) => setSource(v as 'template' | 'existing')} className="gap-3">
                      {([
                        ['template', 'Crear desde la plantilla configurada', 'El administrador ya dejó una base lista para proyectos nuevos.'],
                        ['existing', 'Usar un proyecto que ya existe', 'Se trabaja sobre un directorio que ya está en el servidor.'],
                      ] as const).map(([valor, titulo, detalle]) => (
                        <Label key={valor}
                          className="hover:bg-accent/40 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5 flex items-start gap-3 rounded-lg border p-3">
                          <RadioGroupItem value={valor} className="mt-0.5" />
                          <span className="space-y-1 font-normal">
                            <span className="block font-medium">{titulo}</span>
                            <span className="text-muted-foreground block text-sm">{detalle}</span>
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}

                  {!demo && connection.provisioning && connection.runtime && source === 'template' && (
                    <Alert>
                      <Sparkles className="size-4" />
                      <AlertDescription>Al crear el proyecto, también se iniciará su aplicación y se preparará una vista previa.</AlertDescription>
                    </Alert>
                  )}

                  {!demo && (
                    <Collapsible className="rounded-lg border">
                      <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-sm font-medium">
                        <ShieldAlert className="text-muted-foreground size-4" />
                        Opciones para el administrador
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 border-t p-3">
                        {(!connection.provisioning || source === 'existing') && (
                          <div className="space-y-2">
                            <Label htmlFor="dir">Directorio en el servidor de OpenCode</Label>
                            <Input id="dir" value={directory} onChange={(e) => setDirectory(e.target.value)}
                              placeholder={connection.directory || '/ruta/del/proyecto'} className="font-mono text-sm" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="vista">URL de vista previa <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                          <Input id="vista" type="url" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)}
                            placeholder="https://mi-proyecto.example.com" className="font-mono text-sm" />
                          <p className="text-muted-foreground text-xs">
                            Dirección donde ya se ejecuta el proyecto, para verlo dentro de OblivionUI.
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Sparkles className="size-4" />
                <AlertDescription>
                  Este proyecto se creará como demostración. Para que la IA trabaje de verdad, conecta OpenCode
                  en <a href="#/config" className="underline underline-offset-4">Configuración</a>.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" role="alert">
                <TriangleAlert className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-1.5" onClick={() => setPaso(0)}>
                <ArrowLeft className="size-4" />Atrás
              </Button>
              <Button onClick={crear} disabled={creating} className="gap-1.5">
                {creating ? 'Creando proyecto…' : 'Crear proyecto'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Configuracion({ connection, onConnection }: {
  connection: Connection | null
  onConnection: (value: Connection) => void
}) {
  const { settings } = useDB()
  const [probando, setProbando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null)
  const [accessKey, setAccessKey] = useState('')
  const [username, setUsername] = useState('opencode')
  const [password, setPassword] = useState('')

  async function probar() {
    setProbando(true)
    setResultado(null)
    try {
      const status = await connect({ accessKey, url: settings.url, username, password })
      onConnection(status)
      setAccessKey('')
      setPassword('')
      setResultado({ ok: true, texto: `Conectado a OpenCode ${status.version || ''}. Ya puedes crear un proyecto real.` })
    } catch (e) {
      setResultado({ ok: false, texto: (e as Error).message })
    } finally {
      setProbando(false)
    }
  }

  async function salir() {
    await disconnect()
    onConnection({ connected: false, available: true })
    setResultado(null)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-7 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Configuración</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Datos de administrador. Las credenciales se quedan en el servidor de esta instalación mientras dura
          la sesión; nunca se guardan en el navegador.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Conexión con OpenCode</CardTitle>
            <CardDescription>El motor que construye los proyectos.</CardDescription>
          </div>
          {connection?.connected
            ? <Estado tono="ok"><CircleCheck className="size-3" />Conectado</Estado>
            : <Estado tono="demo">Sin conexión</Estado>}
        </CardHeader>
        <CardContent className="space-y-5">
          {connection?.available === false && (
            <Alert variant="destructive">
              <TriangleAlert className="size-4" />
              <AlertDescription>
                El administrador debe definir <code className="font-mono text-xs">PAGOBLI_ACCESS_KEY</code> en
                el servidor y reiniciarlo.
              </AlertDescription>
            </Alert>
          )}
          {connection?.connected && (
            <Alert className="border-ok/30 bg-ok-bg/50 text-ok [&>svg]:text-ok">
              <CircleCheck className="size-4" />
              <AlertDescription className="text-ok/90">
                <span className="font-mono text-xs">{limpia(connection.url)}</span> · versión {connection.version} ·
                directorio <span className="font-mono text-xs">{connection.directory}</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Dirección del servidor</Label>
            <Input id="url" value={settings.url} placeholder="http://192.168.1.10:4096" className="font-mono text-sm"
              onChange={(e) => setSettings({ url: e.target.value, serverReachable: false })} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clave">Clave de esta instalación</Label>
              <Input id="clave" type="password" autoComplete="off" value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario de OpenCode</Label>
              <Input id="usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">
              Contraseña de OpenCode <span className="text-muted-foreground font-normal">(si está protegida)</span>
            </Label>
            <Input id="pass" type="password" autoComplete="off" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>

          <p className="text-muted-foreground bg-muted/50 rounded-md p-3 text-sm">
            {connection?.provisioning
              ? 'Hay una plantilla configurada: los proyectos nuevos pueden crearse desde ella o sobre un directorio existente.'
              : 'Se usará un directorio que ya exista en OpenCode. El administrador puede habilitar una plantilla con un volumen compartido.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={probar} disabled={!settings.url || !accessKey || probando} className="gap-1.5">
              <Plug className="size-4" />{probando ? 'Conectando…' : 'Conectar OpenCode'}
            </Button>
            {connection?.connected && <Button variant="outline" onClick={salir}>Desconectar</Button>}
          </div>

          <AnimatePresence>
            {resultado && (
              <motion.div {...entrada} transition={suave}>
                <Alert variant={resultado.ok ? 'default' : 'destructive'} role="alert"
                  className={cn(resultado.ok && 'border-ok/30 bg-ok-bg/50 text-ok [&>svg]:text-ok')}>
                  {resultado.ok ? <CircleCheck className="size-4" /> : <TriangleAlert className="size-4" />}
                  <AlertDescription className={cn(resultado.ok && 'text-ok/90')}>{resultado.texto}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
