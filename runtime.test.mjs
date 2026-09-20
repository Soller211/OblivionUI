import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runtimeAvailable, runtimeConfig, startProjectRuntime } from './runtime.mjs'

function spawnOk(calls) {
  return (command, args, options) => {
    calls.push({ command, args, options })
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    child.kill = () => {}
    queueMicrotask(() => child.emit('close', 0))
    return child
  }
}

test('solo habilita Docker Compose con una URL de preview única y válida', async () => {
  assert.equal(await runtimeAvailable(runtimeConfig({ PAGOBLI_PROJECT_RUNTIME: 'docker-compose', PAGOBLI_PROJECT_PREVIEW_URL_TEMPLATE: 'https://{project}.apps.interna' })), true)
  assert.equal(await runtimeAvailable(runtimeConfig({ PAGOBLI_PROJECT_RUNTIME: 'docker-compose', PAGOBLI_PROJECT_PREVIEW_URL_TEMPLATE: 'https://apps.interna' })), false)
  assert.equal(await runtimeAvailable(runtimeConfig({ PAGOBLI_PROJECT_RUNTIME: 'docker-compose', PAGOBLI_PROJECT_PREVIEW_URL_TEMPLATE: 'file:///tmp/{project}' })), false)
})

test('arranca solo el Compose que pertenece al proyecto y devuelve su preview', async () => {
  const base = await mkdtemp(join(tmpdir(), 'pagobli-runtime-'))
  try {
    await mkdir(join(base, 'proyecto'))
    await writeFile(join(base, 'proyecto', 'compose.yaml'), 'services: {}')
    const calls = []
    const result = await startProjectRuntime({ localDirectory: join(base, 'proyecto'), folder: 'proyecto-1234' }, runtimeConfig({
      PAGOBLI_PROJECT_RUNTIME: 'docker-compose', PAGOBLI_PROJECT_PREVIEW_URL_TEMPLATE: 'https://{project}.apps.interna', PAGOBLI_PROJECT_RUNTIME_TIMEOUT: '45',
    }), { spawn: spawnOk(calls) })
    assert.deepEqual(result, { enabled: true, status: 'Lista para revisar', previewUrl: 'https://proyecto-1234.apps.interna' })
    assert.equal(calls[0].command, 'docker')
    assert.deepEqual(calls[0].args.slice(0, 8), ['compose', '--project-name', 'proyecto-1234', '--project-directory', join(base, 'proyecto'), '--file', join(base, 'proyecto', 'compose.yaml'), 'up'])
    assert.ok(calls[0].args.includes('--wait'))
  } finally { await rm(base, { recursive: true, force: true }) }
})
