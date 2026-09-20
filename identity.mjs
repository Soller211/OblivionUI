import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const id = (prefix) => `${prefix}_${randomBytes(9).toString('base64url')}`
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  if (typeof password !== 'string' || password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.')
  const hash = await scrypt(password, salt, 64)
  return `${salt}:${Buffer.from(hash).toString('hex')}`
}
async function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || '').split(':')
  if (!salt || !expected) return false
  const actual = Buffer.from(await scrypt(password, salt, 64)).toString('hex')
  const a = Buffer.from(actual, 'hex'); const b = Buffer.from(expected, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function publicUser(user) { return { id: user.id, name: user.name, email: user.email } }
export function publicWorkspace(workspace, role) { return { id: workspace.id, name: workspace.name, role } }

export async function createIdentity({ file, bootstrapEmail, bootstrapPassword, bootstrapName = 'Administración' } = {}) {
  let data = { users: [], workspaces: [], memberships: [] }
  if (file) {
    try { data = JSON.parse(await readFile(file, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  data.users ||= []; data.workspaces ||= []; data.memberships ||= []

  async function save() {
    if (!file) return
    await mkdir(dirname(file), { recursive: true })
    const temporary = `${file}.tmp`
    await writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 })
    await rename(temporary, file)
  }

  if (data.users.length === 0 && bootstrapEmail && bootstrapPassword) {
    const user = { id: id('usr'), name: bootstrapName.trim() || 'Administración', email: normalizeEmail(bootstrapEmail), password: await hashPassword(bootstrapPassword) }
    const workspace = { id: id('ws'), name: 'Mi organización' }
    data.users.push(user); data.workspaces.push(workspace); data.memberships.push({ userId: user.id, workspaceId: workspace.id, role: 'owner' })
    await save()
  }

  const enabled = data.users.length > 0
  function membershipsFor(userId) { return data.memberships.filter((m) => m.userId === userId) }
  function workspaceFor(userId, workspaceId) {
    const member = data.memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId)
    const workspace = data.workspaces.find((item) => item.id === workspaceId)
    return member && workspace ? publicWorkspace(workspace, member.role) : null
  }
  return {
    enabled,
    async login(email, password) {
      const user = data.users.find((item) => item.email === normalizeEmail(email))
      if (!user || !(await verifyPassword(password, user.password))) return null
      const memberships = membershipsFor(user.id).map((m) => publicWorkspace(data.workspaces.find((w) => w.id === m.workspaceId), m.role)).filter(Boolean)
      return { user: publicUser(user), workspaces: memberships, workspace: memberships[0] || null }
    },
    async createWorkspace(userId, name) {
      if (typeof name !== 'string' || name.trim().length < 2) throw new Error('El espacio necesita un nombre de al menos 2 caracteres.')
      const workspace = { id: id('ws'), name: name.trim() }
      data.workspaces.push(workspace); data.memberships.push({ userId, workspaceId: workspace.id, role: 'owner' }); await save()
      return publicWorkspace(workspace, 'owner')
    },
    workspaceFor,
    listWorkspaces(userId) { return membershipsFor(userId).map((m) => publicWorkspace(data.workspaces.find((w) => w.id === m.workspaceId), m.role)).filter(Boolean) },
    async addMember(ownerId, workspaceId, { name, email, password, role = 'member' }) {
      const membership = data.memberships.find((m) => m.userId === ownerId && m.workspaceId === workspaceId)
      if (!membership || membership.role !== 'owner') throw new Error('Solo la persona propietaria puede añadir integrantes.')
      if (!['admin', 'member'].includes(role)) throw new Error('Rol no válido.')
      const normalized = normalizeEmail(email)
      if (!normalized.includes('@')) throw new Error('Escribe un correo válido.')
      if (data.memberships.some((m) => m.workspaceId === workspaceId && data.users.find((u) => u.id === m.userId)?.email === normalized)) throw new Error('Esta persona ya pertenece al espacio.')
      let user = data.users.find((item) => item.email === normalized)
      if (!user) {
        user = { id: id('usr'), name: String(name || '').trim() || normalized.split('@')[0], email: normalized, password: await hashPassword(password) }
        data.users.push(user)
      }
      data.memberships.push({ userId: user.id, workspaceId, role }); await save()
      return publicUser(user)
    },
  }
}
