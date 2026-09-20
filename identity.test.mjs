import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createIdentity } from './identity.mjs'

test('crea una cuenta inicial, valida acceso y aísla los espacios', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'pagobli-identity-'))
  try {
    const auth = await createIdentity({ file: join(folder, 'identity.json'), bootstrapEmail: 'admin@empresa.mx', bootstrapPassword: 'contraseña-larga-123', bootstrapName: 'Ana' })
    assert.equal(auth.enabled, true)
    assert.equal(await auth.login('admin@empresa.mx', 'incorrecta'), null)
    const login = await auth.login('ADMIN@empresa.mx', 'contraseña-larga-123')
    assert.equal(login.user.name, 'Ana')
    assert.equal(login.workspace.role, 'owner')
    const other = await auth.createWorkspace(login.user.id, 'Operaciones')
    assert.equal(auth.workspaceFor(login.user.id, other.id).name, 'Operaciones')
    await auth.addMember(login.user.id, other.id, { name: 'Luis', email: 'luis@empresa.mx', password: 'otra-contraseña-123', role: 'member' })
    const member = await auth.login('luis@empresa.mx', 'otra-contraseña-123')
    assert.equal(member.workspaces.length, 1)
    assert.equal(member.workspaces[0].id, other.id)
    assert.equal(auth.workspaceFor(member.user.id, login.workspace.id), null)
  } finally { await rm(folder, { recursive: true, force: true }) }
})
