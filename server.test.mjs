import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

test('el backend conecta, crea una sesión y envía un mensaje real por la API', async () => {
  const baseDir = await mkdtemp(join(tmpdir(), 'pagobli-api-'))
  const templateDir = join(baseDir, 'template')
  const workspaceRoot = join(baseDir, 'workspaces')
  await mkdir(templateDir)
  await writeFile(join(templateDir, 'artisan'), 'laravel')
  const upstream = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/global/health') return res.end(JSON.stringify({ healthy: true, version: '1.0' }))
    if (req.url === '/path') return res.end(JSON.stringify({ directory: '/proyecto' }))
    if (req.url?.startsWith('/file/content?') && new URL(req.url, 'http://localhost').searchParams.get('directory') === '/proyecto') {
      const files = {
        'PROJECT.md': '# Presupuestos',
        'NOTAS.md': 'Notas de negocio',
        'AGENTS.md': 'Instrucción privada',
        '.pagobli/context.json': JSON.stringify({ name: 'Presupuestos', description: 'Flujo de aprobación', template: 'Laravel', commands: { test: 'no mostrar' } }),
      }
      const path = new URL(req.url, 'http://localhost').searchParams.get('path')
      if (files[path]) return res.end(JSON.stringify({ type: 'text', content: files[path] }))
    }
    if (req.url === '/session?directory=%2Fproyecto') return res.end(JSON.stringify({ id: 'ses_1', directory: '/proyecto' }))
    if (req.method === 'POST' && req.url.startsWith('/session?directory=%2Fremote%2F')) return res.end(JSON.stringify({ id: 'ses_nuevo', directory: new URL(req.url, 'http://localhost').searchParams.get('directory') }))
    if (req.url.startsWith('/file/content?path=.pagobli-workspace-id&directory=%2Fremote%2F')) {
      const folder = new URL(req.url, 'http://localhost').searchParams.get('directory').split('/').at(-1)
      if (folder.startsWith('fallo-')) return res.end(JSON.stringify({ type: 'text', content: 'otro-volumen' }))
      return res.end(JSON.stringify({ type: 'text', content: await readFile(join(workspaceRoot, folder, '.pagobli-workspace-id'), 'utf8') }))
    }
    if (req.url === '/session/ses_1/message?directory=%2Fproyecto' && req.method === 'POST') return res.end(JSON.stringify({ parts: [{ type: 'text', text: 'Formulario creado.' }] }))
    if (req.url === '/permission?directory=%2Fproyecto') return res.end(JSON.stringify([{ id: 'per_1', sessionID: 'ses_1', permission: 'edit', patterns: ['src/*'] }]))
    if (req.url === '/question?directory=%2Fproyecto') return res.end(JSON.stringify([{ id: 'que_1', sessionID: 'ses_1', questions: [{ header: 'Rol', question: '¿Quién aprueba?' }] }]))
    if (req.url === '/permission/per_1/reply?directory=%2Fproyecto') return res.end('true')
    if (req.url === '/question/que_1/reply?directory=%2Fproyecto') return res.end('true')
    if (req.url === '/session/ses_1/message?directory=%2Fproyecto' && req.method === 'GET') return res.end(JSON.stringify([
      { info: { id: 'msg_1', role: 'user', time: { created: 123 } }, parts: [{ type: 'text', text: 'Crea un formulario' }] },
    ]))
    if (req.url === '/session/ses_1/revert?directory=%2Fproyecto') return res.end(JSON.stringify({ id: 'ses_1' }))
    if (req.url === '/session/ses_1/unrevert?directory=%2Fproyecto') return res.end(JSON.stringify({ id: 'ses_1' }))
    res.writeHead(404).end('{}')
  })
  upstream.listen(0, '127.0.0.1')
  await once(upstream, 'listening')
  const port = await freePort()
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), PAGOBLI_ACCESS_KEY: 'clave-de-prueba',
      PAGOBLI_TEMPLATE_DIR: templateDir, PAGOBLI_WORKSPACE_ROOT: workspaceRoot, PAGOBLI_OPENCODE_WORKSPACE_ROOT: '/remote' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  try {
    await Promise.race([
      once(child.stdout, 'data'),
      once(child, 'exit').then(() => { throw new Error('El backend terminó antes de iniciar.') }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('El backend tardó demasiado en iniciar.')), 5000)),
    ])
    const base = `http://127.0.0.1:${port}`
    const post = (path, body, cookie) => fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body),
    })
    const rejected = await post('/api/connect', { accessKey: 'incorrecta', url: 'http://127.0.0.1:1' })
    assert.equal(rejected.status, 401)
    const connected = await post('/api/connect', { accessKey: 'clave-de-prueba', url: `http://127.0.0.1:${upstream.address().port}` })
    assert.equal(connected.status, 200)
    const cookie = connected.headers.get('set-cookie').split(';')[0]
    const connection = await (await fetch(base + '/api/connection', { headers: { Cookie: cookie } })).json()
    assert.equal(connection.connected, true)
    assert.equal(connection.provisioning, true)
    const sessionResponse = await post('/api/session', { title: 'Mi proyecto', directory: '/proyecto' }, cookie)
    assert.equal(sessionResponse.status, 200)
    const session = await sessionResponse.json()
    assert.equal(session.id, 'ses_1')
    const promptResponse = await post('/api/session/ses_1/message', { directory: '/proyecto', text: 'Crea un formulario' }, cookie)
    assert.equal(promptResponse.status, 200)
    assert.equal((await promptResponse.json()).answer, 'Formulario creado.')
    const context = await (await fetch(base + '/api/session/ses_1/context?directory=%2Fproyecto', { headers: { Cookie: cookie } })).json()
    assert.equal(context.project.name, 'Presupuestos')
    assert.equal(context.documents.agentInstructions, true)
    assert.ok(!JSON.stringify(context).includes('Instrucción privada'))
    assert.ok(!JSON.stringify(context).includes('no mostrar'))
    const pending = await (await fetch(base + '/api/session/ses_1/pending?directory=%2Fproyecto', { headers: { Cookie: cookie } })).json()
    assert.equal(pending.permissions[0].id, 'per_1')
    assert.equal(pending.questions[0].id, 'que_1')
    const permissionReply = await post('/api/session/ses_1/permission/per_1/reply', { directory: '/proyecto', reply: 'once' }, cookie)
    assert.equal((await permissionReply.json()).accepted, true)
    const questionReply = await post('/api/session/ses_1/question/que_1/reply', { directory: '/proyecto', answers: [['Gerencia']] }, cookie)
    assert.equal((await questionReply.json()).accepted, true)
    const history = await (await fetch(base + '/api/session/ses_1/history?directory=%2Fproyecto', { headers: { Cookie: cookie } })).json()
    assert.equal(history[0].id, 'msg_1')
    const reverted = await post('/api/session/ses_1/revert', { directory: '/proyecto', messageID: 'msg_1' }, cookie)
    assert.equal((await reverted.json()).restored, true)
    const provisionedResponse = await post('/api/provision', { title: 'Control de Inventario' }, cookie)
    assert.equal(provisionedResponse.status, 200)
    const provisioned = await provisionedResponse.json()
    assert.match(provisioned.directory, /^\/remote\/control-de-inventario-[a-f0-9]{8}$/)
    assert.equal(await readFile(join(workspaceRoot, provisioned.directory.split('/').at(-1), 'artisan'), 'utf8'), 'laravel')
    const failed = await post('/api/provision', { title: 'Fallo' }, cookie)
    assert.equal(failed.status, 409)
    assert.deepEqual(await readdir(workspaceRoot), [provisioned.directory.split('/').at(-1)])
  } finally {
    child.kill()
    await new Promise((resolve) => upstream.close(resolve))
    await rm(baseDir, { recursive: true, force: true })
  }
})
