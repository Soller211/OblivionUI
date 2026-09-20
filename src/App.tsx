import { useEffect, useState } from 'react'
import { addProject, deleteProject, fecha, setSettings, useDB } from './store'
import { PREGUNTAS, render, specInicial } from './demo.js'
import { Workspace } from './Workspace'
import { connect, createSession, disconnect, getConnection, provisionProject, type Connection } from './api'

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

export function App() {
  const ruta = useHash()
  const { projects } = useDB()
  const proyecto = ruta.match(/^\/p\/(\w+)/)?.[1]
  const [connection, setConnection] = useState<Connection | null>(null)
  useEffect(() => { getConnection().then(setConnection).catch(() => setConnection({ connected: false, available: false })) }, [])
  const activeProject = proyecto ? projects.find((p) => p.id === proyecto) : undefined
  const live = activeProject?.mode === 'live'
  const linked = !!connection?.connected && (!activeProject?.serverUrl || activeProject.serverUrl.replace(/\/$/, '') === connection.url?.replace(/\/$/, ''))

  return (
    <>
      <div className="top">
        <span className="brand">PagObli</span>
        <nav>
          <a href="#/" className={ruta === '/' || ruta.startsWith('/p/') ? 'on' : ''}>Proyectos</a>
          <a href="#/config" className={ruta === '/config' ? 'on' : ''}>Configuración</a>
        </nav>
        <span className="spacer" />
        {ruta !== '/nuevo' && <a className="btn" href="#/nuevo">Nuevo proyecto</a>}
      </div>
      <div className={live && linked ? 'demo live-banner' : 'demo'}>
          <strong>{live ? linked ? 'OpenCode conectado.' : 'Proyecto sin conexión.' : 'Modo demostración disponible.'}</strong>
          <span>{live ? linked ? 'Los mensajes de este proyecto se envían a OpenCode.' : 'Conecta la instancia de OpenCode asociada con este proyecto.' : 'La vista ilustrativa no ejecuta código real.'}</span>
          <a href="#/config">{live ? 'Configuración' : 'Conectar OpenCode'}</a>
      </div>
      {proyecto ? (
        <Workspace id={proyecto} connection={connection} />
      ) : ruta === '/nuevo' ? (
        <Nuevo connection={connection} />
      ) : ruta === '/config' ? (
        <Config connection={connection} onConnection={setConnection} />
      ) : (
        <Proyectos />
      )}
    </>
  )
}

function Proyectos() {
  const { projects } = useDB()
  return (
    <div className="wrap">
      <h1>Tus proyectos</h1>
      <p className="sub">Describe lo que necesitas y revisa el resultado sin tocar código.</p>
      {projects.length === 0 ? (
        <div className="empty">
          <p>Todavía no hay proyectos.</p>
          <a className="btn" href="#/nuevo">Crear el primero</a>
        </div>
      ) : (
        <div className="grid">
          {projects.map((p) => (
            <div className="card" key={p.id}>
              <a href={`#/p/${p.id}`}>
                <h3>{p.name}</h3>
                <p>{p.idea}</p>
              </a>
              <div className="meta">
                <span>{p.mode === 'live' ? 'OpenCode' : `${p.versions.length} ${p.versions.length === 1 ? 'versión' : 'versiones'}`} · {fecha(p.createdAt)}</span>
                <button
                  className="btn link"
                  onClick={() => confirm(`¿Eliminar «${p.name}»? No se puede deshacer.`) && deleteProject(p.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Nuevo({ connection }: { connection: Connection | null }) {
  const { projects } = useDB()
  const [paso, setPaso] = useState(0)
  const [name, setName] = useState('')
  const [idea, setIdea] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [demo, setDemo] = useState(false)
  const [directory, setDirectory] = useState('')
  const [source, setSource] = useState<'template' | 'existing'>('template')
  const [previewUrl, setPreviewUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

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
      const session = live ? fromTemplate ? await provisionProject(name.trim()) : await createSession(name.trim(), workspace) : null
      const p = addProject({
        name: name.trim(), idea: idea.trim(), answers, spec,
        html: live ? '' : render(spec), mode: live ? 'live' : 'demo',
        sessionID: session?.id, directory: session?.directory,
        serverUrl: live ? connection?.url : undefined,
        previewUrl: live ? previewUrl.trim() : undefined,
      })
      ir(`/p/${p.id}`)
    } catch (e) {
      setError((e as Error).message)
    } finally { setCreating(false) }
  }

  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <p className="steps">Paso {paso + 1} de 2</p>
      {paso === 0 ? (
        <>
          <h1>¿Qué necesitas construir?</h1>
          <p className="sub">Escríbelo con tus palabras, como se lo explicarías a un compañero.</p>
          <label className="f">
            <span>Nombre del proyecto</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aprobación de presupuestos" />
          </label>
          <label className="f">
            <span>¿Qué debe resolver?</span>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Necesito un sistema para aprobar presupuestos del área…"
            />
          </label>
          <button className="btn" disabled={!name.trim() || !idea.trim()} onClick={() => setPaso(1)}>
            Continuar
          </button>
        </>
      ) : (
        <>
          <h1>Tres preguntas rápidas</h1>
          <p className="sub">Con esto se arma la primera versión. Puedes cambiar todo después.</p>
          {PREGUNTAS.map((q: { id: string; label: string; ph: string }) => (
            <label className="f" key={q.id}>
              <span>{q.label}</span>
              <input
                value={answers[q.id] || ''}
                placeholder={q.ph}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            </label>
          ))}
          {connection?.connected && (
            <>
              <label className="f choice"><input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} /> Probar solo la demostración</label>
              {!demo && connection.provisioning && <div className="source-choice">
                <label><input type="radio" checked={source === 'template'} onChange={() => setSource('template')} /> Crear desde la plantilla configurada</label>
                <label><input type="radio" checked={source === 'existing'} onChange={() => setSource('existing')} /> Usar un proyecto existente</label>
              </div>}
              {!demo && <details className="advanced"><summary>Opciones del proyecto para el administrador</summary>
                {(!connection.provisioning || source === 'existing') && <label className="f"><span>Directorio existente en el servidor OpenCode</span>
                  <input value={directory} onChange={(e) => setDirectory(e.target.value)} placeholder={connection.directory || '/ruta/del/proyecto'} />
                </label>}
                <label className="f"><span>URL de vista previa (opcional)</span>
                  <input value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://mi-proyecto.example.com" />
                </label>
              </details>}
            </>
          )}
          {!connection?.connected && <p className="sub">Este proyecto se creará como demostración. Para trabajar con OpenCode, conéctalo en Configuración.</p>}
          {error && <p className="bad" role="alert">{error}</p>}
          <div className="row">
            <button className="btn ghost" onClick={() => setPaso(0)}>Atrás</button>
            <button className="btn" onClick={crear} disabled={creating}>{creating ? 'Creando sesión…' : 'Crear proyecto'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function Config({ connection, onConnection }: { connection: Connection | null; onConnection: (value: Connection) => void }) {
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
    <div className="wrap" style={{ maxWidth: 640 }}>
      <h1>Configuración</h1>
      <p className="sub">Conecta tu instancia de OpenCode. Las credenciales se mantienen en el servidor de esta instalación durante la sesión.</p>
      <div className="card">
        <h2>Conexión con OpenCode</h2>
        {connection?.available === false && <p className="bad">El administrador debe definir PAGOBLI_ACCESS_KEY en el servidor de PagObli y reiniciarlo.</p>}
        {connection?.connected && <p className="ok">Conectado a {connection.url} · versión {connection.version} · directorio {connection.directory}</p>}
        <label className="f">
          <span>Dirección del servidor</span>
          <input
            value={settings.url}
            placeholder="http://192.168.1.10:4096"
            onChange={(e) => setSettings({ url: e.target.value, serverReachable: false })}
          />
        </label>
        <label className="f"><span>Clave de esta instalación</span><input type="password" autoComplete="off" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} /></label>
        <label className="f"><span>Usuario de OpenCode</span><input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label className="f"><span>Contraseña de OpenCode <small>(si está protegida)</small></span><input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <p className="sub">{connection?.provisioning ? 'Hay una plantilla configurada: puedes crear proyectos desde ella o usar un directorio existente.' : 'Se usará un directorio que ya existe en OpenCode. El administrador puede habilitar una plantilla con un volumen compartido.'}</p>
        <div className="row">
          <button className="btn" onClick={probar} disabled={!settings.url || !accessKey || probando}>
            {probando ? 'Conectando…' : 'Conectar OpenCode'}
          </button>
          {resultado && <span className={resultado.ok ? 'ok' : 'bad'}>{resultado.texto}</span>}
        </div>
        {connection?.connected && <button className="btn ghost disconnect" onClick={salir}>Desconectar</button>}
      </div>
    </div>
  )
}
