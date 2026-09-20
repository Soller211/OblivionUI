import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { provisionAvailable, provisionProject, removeProvisionedProject } from './provision.mjs'

test('crea un proyecto aislado desde plantilla sin copiar secretos ni dependencias', async () => {
  const base = await mkdtemp(join(tmpdir(), 'pagobli-provision-'))
  try {
    const templateDir = join(base, 'template')
    const workspaceRoot = join(base, 'workspaces')
    await mkdir(join(templateDir, 'vendor'), { recursive: true })
    await writeFile(join(templateDir, 'artisan'), 'laravel')
    await writeFile(join(templateDir, '.env'), 'APP_KEY=secreto')
    await writeFile(join(templateDir, '.env.example'), 'APP_KEY=')
    await writeFile(join(templateDir, 'vendor', 'package.php'), 'dependencia')
    const config = { templateDir, workspaceRoot, remoteRoot: '/remote/projects' }
    assert.equal(await provisionAvailable(config), true)
    const project = await provisionProject('Gestión de Órdenes', config)
    assert.match(project.folder, /^gestion-de-ordenes-[a-f0-9]{8}$/)
    assert.equal(project.directory, `/remote/projects/${project.folder}`)
    assert.equal(await readFile(join(project.localDirectory, 'artisan'), 'utf8'), 'laravel')
    assert.equal(await readFile(join(project.localDirectory, '.pagobli-workspace-id'), 'utf8'), project.marker)
    assert.deepEqual((await readdir(project.localDirectory)).sort(), ['.env.example', '.pagobli-workspace-id', 'artisan'])
    await removeProvisionedProject(project.localDirectory, config)
    assert.deepEqual(await readdir(workspaceRoot), [])
  } finally { await rm(base, { recursive: true, force: true }) }
})
