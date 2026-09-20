import { test } from 'node:test'
import assert from 'node:assert/strict'
import { specInicial, render } from './demo.js'

const values = new Map([
  ['pagobli.v1', JSON.stringify({
    projects: [],
    settings: { url: 'http://localhost:4096', token: 'secreto-antiguo', template: 'Laravel', connected: true },
  })],
])
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
}

const { addProject, saveVersion, restoreVersion } = await import('./store.ts')
const snapshot = () => JSON.parse(values.get('pagobli.v1'))

test('migra ajustes antiguos sin conservar credenciales ni estado de conexión', () => {
  const settings = snapshot().settings
  assert.equal(settings.url, 'http://localhost:4096')
  assert.equal(settings.template, 'Laravel')
  assert.equal(settings.serverReachable, false)
  assert.equal('token' in settings, false)
  assert.equal('connected' in settings, false)
})

test('recuperar crea una nueva versión y conserva las anteriores', () => {
  const spec = specInicial('Proyecto', {}, 'Sistema de inventario')
  const project = addProject({ name: 'Proyecto', idea: spec.idea, answers: {}, html: render(spec), spec })
  saveVersion(project.id, 'Primera', render(spec), spec)
  const first = snapshot().projects[0].versions[0]
  const changed = { ...spec, titulo: 'Proyecto actualizado' }
  saveVersion(project.id, 'Cambio', render(changed), changed)

  assert.equal(restoreVersion(project.id, first.id), true)
  const after = snapshot().projects[0]
  assert.equal(after.versions.length, 3)
  assert.equal(after.versions[0].label, 'Recuperada: Primera')
  assert.equal(after.currentVersionId, after.versions[0].id)
  assert.equal(after.spec.titulo, 'Proyecto')
  assert.equal(after.versions[1].spec.titulo, 'Proyecto actualizado')
  assert.equal(restoreVersion(project.id, after.currentVersionId), false)
})
