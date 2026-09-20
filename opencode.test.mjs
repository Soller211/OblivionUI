import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOpenCode, normalizeUrl } from './opencode.mjs'

const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })

test('acepta únicamente una dirección HTTP sin credenciales incrustadas', () => {
  assert.equal(normalizeUrl('http://localhost:4096/'), 'http://localhost:4096')
  assert.throws(() => normalizeUrl('file:///tmp/opencode'))
  assert.throws(() => normalizeUrl('http://usuario:clave@localhost:4096'))
})

test('comprueba OpenCode con autenticación básica sin exponer la contraseña', async () => {
  const calls = []
  const client = createOpenCode({
    url: 'http://localhost:4096', password: 'secreta',
    fetcher: async (url, options) => {
      calls.push({ url: String(url), auth: options.headers.Authorization })
      return response(String(url).endsWith('/global/health') ? { healthy: true, version: '1.0' } : { directory: '/proyecto' })
    },
  })
  assert.deepEqual(await client.check(), { version: '1.0', directory: '/proyecto' })
  assert.equal(calls[0].auth, `Basic ${Buffer.from('opencode:secreta').toString('base64')}`)
  assert.ok(calls.every((call) => !call.url.includes('secreta')))
})

test('rechaza una sesión si OpenCode la crea en otro directorio', async () => {
  const client = createOpenCode({ url: 'http://localhost:4096', fetcher: async () => response({ id: 'ses_1', directory: '/otro' }) })
  await assert.rejects(client.createSession({ title: 'Proyecto', directory: '/esperado' }), /en vez de/)
})

test('verifica que OpenCode lea el mismo volumen antes de crear desde plantilla', async () => {
  const client = createOpenCode({
    url: 'http://localhost:4096',
    fetcher: async (url) => {
      assert.match(String(url), /\/file\/content\?path=\.pagobli-workspace-id&directory=%2Fproyecto/)
      return response({ type: 'text', content: 'marcador-correcto' })
    },
  })
  assert.equal(await client.verifyWorkspace({ directory: '/proyecto', marker: 'marcador-correcto' }), true)
  await assert.rejects(client.verifyWorkspace({ directory: '/proyecto', marker: 'otro' }), /no ve los mismos archivos/)
})

test('envía el mensaje a la sesión y resume la respuesta textual', async () => {
  let seen
  const client = createOpenCode({
    url: 'http://localhost:4096',
    fetcher: async (url, options) => {
      seen = { url: String(url), body: JSON.parse(options.body) }
      return response({ info: { id: 'msg_1' }, parts: [{ type: 'text', text: 'Ya creé el formulario.' }, { type: 'tool', name: 'edit' }] })
    },
  })
  const result = await client.prompt({ sessionID: 'ses_1', directory: '/proyecto', text: 'Crea un formulario' })
  assert.equal(result.answer, 'Ya creé el formulario.')
  assert.equal(seen.body.parts[0].text, 'Crea un formulario')
  assert.match(seen.url, /directory=%2Fproyecto/)
})

test('solo muestra solicitudes de la sesión y responde sin aprobar permanentemente', async () => {
  const sent = []
  const client = createOpenCode({
    url: 'http://localhost:4096',
    fetcher: async (url, options) => {
      const path = new URL(url).pathname
      if (path === '/permission') return response([
        { id: 'per_1', sessionID: 'ses_1', permission: 'edit', patterns: ['src/*'] },
        { id: 'per_2', sessionID: 'ses_2', permission: 'bash', patterns: ['*'] },
      ])
      if (path === '/question') return response([
        { id: 'que_1', sessionID: 'ses_1', questions: [{ header: 'Rol', question: '¿Quién aprueba?' }] },
      ])
      sent.push({ path, body: JSON.parse(options.body) })
      return response(true)
    },
  })
  const pending = await client.pending({ sessionID: 'ses_1', directory: '/proyecto' })
  assert.deepEqual(pending.permissions.map((item) => item.id), ['per_1'])
  assert.deepEqual(pending.questions.map((item) => item.id), ['que_1'])
  await client.replyPermission({ sessionID: 'ses_1', directory: '/proyecto', requestID: 'per_1', reply: 'once' })
  await client.replyQuestion({ sessionID: 'ses_1', directory: '/proyecto', requestID: 'que_1', answers: [['Gerencia']] })
  assert.deepEqual(sent, [
    { path: '/permission/per_1/reply', body: { reply: 'once' } },
    { path: '/question/que_1/reply', body: { answers: [['Gerencia']] } },
  ])
  await assert.rejects(client.replyPermission({ sessionID: 'ses_1', directory: '/proyecto', requestID: 'per_2', reply: 'once' }), /ya no está pendiente/)
  await assert.rejects(client.replyPermission({ sessionID: 'ses_1', directory: '/proyecto', requestID: 'per_1', reply: 'always' }), /no válida/)
})

test('el historial permite recuperar solo mensajes de la sesión', async () => {
  const sent = []
  const client = createOpenCode({
    url: 'http://localhost:4096',
    fetcher: async (url, options) => {
      const path = new URL(url).pathname
      if (path.endsWith('/message')) return response([
        { info: { id: 'msg_usuario', role: 'user', time: { created: 123 } }, parts: [{ type: 'text', text: 'Crea un formulario' }] },
        { info: { id: 'msg_asistente', role: 'assistant' }, parts: [{ type: 'text', text: 'Listo' }] },
      ])
      sent.push({ path, body: JSON.parse(options.body) })
      return response({ id: 'ses_1' })
    },
  })
  assert.deepEqual(await client.history({ sessionID: 'ses_1', directory: '/proyecto' }), [
    { id: 'msg_usuario', text: 'Crea un formulario', createdAt: 123 },
  ])
  await client.revert({ sessionID: 'ses_1', directory: '/proyecto', messageID: 'msg_usuario' })
  await client.unrevert({ sessionID: 'ses_1', directory: '/proyecto' })
  assert.deepEqual(sent, [
    { path: '/session/ses_1/revert', body: { messageID: 'msg_usuario' } },
    { path: '/session/ses_1/unrevert', body: {} },
  ])
  await assert.rejects(client.revert({ sessionID: 'ses_1', directory: '/proyecto', messageID: 'msg_otro' }), /no pertenece/)
})
