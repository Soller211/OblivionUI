import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { lstatSync } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { randomBytes } from 'node:crypto'

const excluded = new Set(['.git', 'node_modules', 'vendor', '.DS_Store', '.pagobli-workspace-id'])

export async function provisionAvailable(config) {
  if (!config.templateDir || !config.workspaceRoot || !config.remoteRoot) return false
  if (![config.templateDir, config.workspaceRoot, config.remoteRoot].every(isAbsolute)) return false
  try {
    const info = await stat(config.templateDir)
    return info.isDirectory() && (await readdir(config.templateDir)).length > 0
  } catch { return false }
}

export function provisionConfig(env = process.env) {
  return {
    templateDir: env.PAGOBLI_TEMPLATE_DIR || '',
    workspaceRoot: env.PAGOBLI_WORKSPACE_ROOT || '',
    remoteRoot: env.PAGOBLI_OPENCODE_WORKSPACE_ROOT || env.PAGOBLI_WORKSPACE_ROOT || '',
  }
}

export async function provisionProject(name, config) {
  if (!(await provisionAvailable(config))) throw new Error('La plantilla de proyectos no está configurada o está vacía.')
  const slug = String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'proyecto'
  const folder = `${slug}-${randomBytes(4).toString('hex')}`
  const localDirectory = join(config.workspaceRoot, folder)
  const directory = join(config.remoteRoot, folder)
  const marker = randomBytes(16).toString('hex')
  await mkdir(config.workspaceRoot, { recursive: true })
  try {
    await cp(config.templateDir, localDirectory, {
      recursive: true,
      force: false,
      errorOnExist: true,
      filter: (source) => {
        const rel = relative(resolve(config.templateDir), resolve(source))
        if (!rel) return true
        const parts = rel.split(sep)
        if (parts.some((part) => excluded.has(part))) return false
        const file = basename(source)
        if (file === '.env' || (file.startsWith('.env.') && file !== '.env.example')) return false
        return !lstatSync(source).isSymbolicLink()
      },
    })
    await writeFile(join(localDirectory, '.pagobli-workspace-id'), marker, { flag: 'wx', mode: 0o600 })
    const contextDirectory = join(localDirectory, '.pagobli')
    const contextFile = join(contextDirectory, 'context.json')
    await mkdir(contextDirectory, { recursive: true })
    try {
      await writeFile(contextFile, `${JSON.stringify({
        name: String(name).trim(),
        description: '',
        status: 'Por definir',
        features: { preview: false, history: true, visualEditing: false },
      }, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
    }
    return { localDirectory, directory, folder, marker }
  } catch (error) {
    await rm(localDirectory, { recursive: true, force: true })
    throw error
  }
}

export async function removeProvisionedProject(localDirectory, config) {
  const root = resolve(config.workspaceRoot)
  const target = resolve(localDirectory)
  if (!target.startsWith(root + sep)) throw new Error('Ruta de proyecto inválida.')
  await rm(target, { recursive: true, force: true })
}
