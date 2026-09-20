import { spawn as nodeSpawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const text = (value) => typeof value === 'string' ? value.trim() : ''

export function runtimeConfig(env = process.env) {
  const enabled = env.PAGOBLI_PROJECT_RUNTIME === 'docker-compose'
  const composeFile = text(env.PAGOBLI_PROJECT_COMPOSE_FILE || 'compose.yaml')
  const previewUrlTemplate = text(env.PAGOBLI_PROJECT_PREVIEW_URL_TEMPLATE)
  const timeout = Number(env.PAGOBLI_PROJECT_RUNTIME_TIMEOUT || 120)
  return {
    enabled,
    composeFile,
    previewUrlTemplate,
    timeout: Number.isInteger(timeout) && timeout >= 10 && timeout <= 900 ? timeout : 120,
    dockerBin: text(env.PAGOBLI_DOCKER_BIN || 'docker'),
  }
}

export async function runtimeAvailable(config) {
  if (!config.enabled || !config.composeFile || isAbsolute(config.composeFile)) return false
  if (!config.previewUrlTemplate.includes('{project}')) return false
  try {
    const sample = new URL(config.previewUrlTemplate.replaceAll('{project}', 'proyecto'))
    return ['http:', 'https:'].includes(sample.protocol)
  } catch { return false }
}

function composePath(project, config) {
  const root = resolve(project.localDirectory)
  const file = resolve(root, config.composeFile)
  if (!file.startsWith(root + sep) || relative(root, file).startsWith(`..${sep}`)) throw new Error('El archivo Compose debe estar dentro de la plantilla del proyecto.')
  return file
}

function previewUrl(project, config) {
  return config.previewUrlTemplate.replaceAll('{project}', encodeURIComponent(project.folder))
}

export function run(command, args, { cwd, timeout, spawn = nodeSpawn } = {}) {
  return new Promise((resolve, reject) => {
    let output = ''
    let finished = false
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    const finish = (error, value) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      error ? reject(error) : resolve(value)
    }
    child.stdout?.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000) })
    child.stderr?.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000) })
    child.once('error', (error) => finish(new Error(`No se pudo ejecutar Docker: ${error.message}`)))
    child.once('close', (code) => {
      if (code === 0) finish(null, output.trim())
      else finish(new Error(`Docker terminó con código ${code}.${output ? ` ${output.trim()}` : ''}`))
    })
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish(new Error(`Docker tardó más de ${timeout} segundos en preparar el proyecto.`))
    }, timeout * 1000)
  })
}

export async function startProjectRuntime(project, config, dependencies = {}) {
  if (!(await runtimeAvailable(config))) return { enabled: false, status: 'No configurado', previewUrl: '' }
  const file = composePath(project, config)
  try {
    const info = await stat(file)
    if (!info.isFile()) throw new Error('El archivo Compose no es un archivo.')
  } catch (error) {
    throw new Error(`No se encontró ${config.composeFile} en la plantilla del proyecto. ${error.message}`)
  }
  await run(config.dockerBin, [
    'compose', '--project-name', project.folder, '--project-directory', project.localDirectory,
    '--file', file, 'up', '--detach', '--wait', '--wait-timeout', String(config.timeout),
  ], { cwd: project.localDirectory, timeout: config.timeout, spawn: dependencies.spawn })
  return { enabled: true, status: 'Lista para revisar', previewUrl: previewUrl(project, config) }
}

export async function stopProjectRuntime(project, config, dependencies = {}) {
  if (!(await runtimeAvailable(config))) return
  let file
  try { file = composePath(project, config); if (!(await stat(file)).isFile()) return }
  catch { return }
  try {
    await run(config.dockerBin, [
      'compose', '--project-name', project.folder, '--project-directory', project.localDirectory,
      '--file', file, 'down', '--remove-orphans',
    ], { cwd: project.localDirectory, timeout: Math.min(config.timeout, 120), spawn: dependencies.spawn })
  } catch { /* la carpeta recién creada se limpia aunque Docker ya no responda */ }
}
