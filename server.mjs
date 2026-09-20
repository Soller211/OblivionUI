import { createServer } from 'node:http'
import { readFile, stat, unlink } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createOpenCode, OpenCodeError } from './opencode.mjs'
import { provisionAvailable, provisionConfig, provisionProject, removeProvisionedProject } from './provision.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), 'dist')
const port = Number(process.env.PORT || 8080)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}
const connections = new Map()
const ttl = 12 * 60 * 60 * 1000
setInterval(() => {
  for (const [token, connection] of connections) if (connection.expires < Date.now()) connections.delete(token)
}, 5 * 60 * 1000).unref()

function send(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(body)
}

function keyMatches(received) {
  const expected = process.env.PAGOBLI_ACCESS_KEY
  if (!expected || typeof received !== 'string') return false
  const a = createHash('sha256').update(received).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 65536) throw new OpenCodeError('La petición es demasiado grande.', 413)
  }
  try { return JSON.parse(raw || '{}') } catch { throw new OpenCodeError('JSON no válido.', 400) }
}

function connectionFor(req) {
  const token = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('pagobli_session='))?.slice('pagobli_session='.length)
  const connection = connections.get(token)
  if (!connection || connection.expires < Date.now()) {
    if (token) connections.delete(token)
    return null
  }
  connection.expires = Date.now() + ttl
  return connection
}

async function api(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'Método no permitido.' })
  const origin = req.headers.origin
  if (origin && new URL(origin).host !== req.headers.host) return send(res, 403, { error: 'Origen no permitido.' })
  if (pathname === '/api/connection' && req.method === 'GET') {
    const connection = connectionFor(req)
    const provisioning = await provisionAvailable(provisionConfig())
    return send(res, 200, connection
      ? { connected: true, url: connection.url, version: connection.version, directory: connection.directory, provisioning }
      : { connected: false, available: !!process.env.PAGOBLI_ACCESS_KEY, provisioning })
  }
  if (pathname === '/api/connect' && req.method === 'POST') {
    if (!process.env.PAGOBLI_ACCESS_KEY) return send(res, 503, { error: 'Esta instalación necesita PAGOBLI_ACCESS_KEY para activar OpenCode.' })
    const body = await readJson(req)
    if (!keyMatches(body.accessKey)) return send(res, 401, { error: 'La clave de esta instalación es incorrecta.' })
    const client = createOpenCode({ url: body.url, username: body.username || 'opencode', password: body.password || '' })
    const status = await client.check()
    const oldToken = req.headers.cookie?.match(/(?:^|;\s*)pagobli_session=([^;]+)/)?.[1]
    if (oldToken) connections.delete(oldToken)
    const token = randomBytes(32).toString('hex')
    connections.set(token, { client, url: body.url, version: status.version, directory: status.directory, expires: Date.now() + ttl })
    res.setHeader('Set-Cookie', `pagobli_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${origin?.startsWith('https://') ? '; Secure' : ''}`)
    return send(res, 200, { connected: true, url: body.url, ...status, provisioning: await provisionAvailable(provisionConfig()) })
  }
  const connection = connectionFor(req)
  if (!connection) return send(res, 401, { error: 'Conecta OpenCode desde Configuración para continuar.' })
  if (pathname === '/api/disconnect' && req.method === 'POST') {
    const token = req.headers.cookie?.match(/(?:^|;\s*)pagobli_session=([^;]+)/)?.[1]
    connections.delete(token)
    res.setHeader('Set-Cookie', 'pagobli_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
    return send(res, 200, { connected: false })
  }
  if (pathname === '/api/session' && req.method === 'POST') {
    const body = await readJson(req)
    if (typeof body.title !== 'string' || !body.title.trim()) return send(res, 400, { error: 'Escribe un nombre para el proyecto.' })
    const directory = typeof body.directory === 'string' && body.directory.trim() ? body.directory.trim() : connection.directory
    const session = await connection.client.createSession({ title: body.title.trim(), directory })
    return send(res, 200, session)
  }
  if (pathname === '/api/provision' && req.method === 'POST') {
    const body = await readJson(req)
    if (typeof body.title !== 'string' || !body.title.trim()) return send(res, 400, { error: 'Escribe un nombre para el proyecto.' })
    const config = provisionConfig()
    if (!(await provisionAvailable(config))) return send(res, 409, { error: 'La plantilla de proyectos no está configurada o está vacía.' })
    let project
    try { project = await provisionProject(body.title.trim(), config) }
    catch (error) { throw new OpenCodeError(`No se pudo preparar el proyecto: ${error.message}`, 500) }
    try {
      await connection.client.verifyWorkspace({ directory: project.directory, marker: project.marker })
      await unlink(join(project.localDirectory, '.pagobli-workspace-id'))
      const session = await connection.client.createSession({ title: body.title.trim(), directory: project.directory })
      return send(res, 200, { ...session, provisioned: true })
    } catch (error) {
      await removeProvisionedProject(project.localDirectory, config)
      throw error
    }
  }
  const match = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/message$/)
  if (match && req.method === 'POST') {
    const body = await readJson(req)
    if (typeof body.text !== 'string' || !body.text.trim()) return send(res, 400, { error: 'Escribe una petición.' })
    if (body.text.length > 20000) return send(res, 413, { error: 'La petición es demasiado larga.' })
    const result = await connection.client.prompt({ sessionID: match[1], directory: body.directory || connection.directory, text: body.text.trim() })
    return send(res, 200, result)
  }
  const pending = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/pending$/)
  if (pending && req.method === 'GET') {
    const directory = new URL(req.url, 'http://localhost').searchParams.get('directory') || connection.directory
    return send(res, 200, await connection.client.pending({ sessionID: pending[1], directory }))
  }
  const permission = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/permission\/([a-zA-Z0-9_-]+)\/reply$/)
  if (permission && req.method === 'POST') {
    const body = await readJson(req)
    const result = await connection.client.replyPermission({ sessionID: permission[1], requestID: permission[2], directory: body.directory || connection.directory, reply: body.reply })
    return send(res, 200, { accepted: result === true })
  }
  const question = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/question\/([a-zA-Z0-9_-]+)\/reply$/)
  if (question && req.method === 'POST') {
    const body = await readJson(req)
    const result = await connection.client.replyQuestion({ sessionID: question[1], requestID: question[2], directory: body.directory || connection.directory, answers: body.answers })
    return send(res, 200, { accepted: result === true })
  }
  const history = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/history$/)
  if (history && req.method === 'GET') {
    const directory = new URL(req.url, 'http://localhost').searchParams.get('directory') || connection.directory
    return send(res, 200, await connection.client.history({ sessionID: history[1], directory }))
  }
  const revert = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/revert$/)
  if (revert && req.method === 'POST') {
    const body = await readJson(req)
    await connection.client.revert({ sessionID: revert[1], directory: body.directory || connection.directory, messageID: body.messageID })
    return send(res, 200, { restored: true })
  }
  const unrevert = pathname.match(/^\/api\/session\/([a-zA-Z0-9_-]+)\/unrevert$/)
  if (unrevert && req.method === 'POST') {
    const body = await readJson(req)
    await connection.client.unrevert({ sessionID: unrevert[1], directory: body.directory || connection.directory })
    return send(res, 200, { restored: true })
  }
  return send(res, 404, { error: 'Ruta no encontrada.' })
}

createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  let pathname
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) }
  catch { res.writeHead(400).end(); return }
  if (pathname.startsWith('/api/')) {
    try { await api(req, res, pathname) }
    catch (error) { send(res, error.status || 500, { error: error instanceof OpenCodeError ? error.message : 'Error interno del servidor.' }) }
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end(req.method === 'HEAD' ? undefined : 'ok')
    return
  }
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (!file.startsWith(root + sep)) {
    res.writeHead(404).end()
    return
  }
  try {
    const info = await stat(file)
    if (!info.isFile()) throw new Error('Not a file')
    const body = await readFile(file)
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    }).end(req.method === 'HEAD' ? undefined : body)
  } catch {
    res.writeHead(404).end()
  }
}).listen(port, '0.0.0.0', () => console.log(`PagObli en http://0.0.0.0:${port}`))
