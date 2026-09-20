/** Cliente pequeño para la API HTTP documentada de OpenCode. */
export class OpenCodeError extends Error {
  constructor(message, status = 502, upstreamStatus = null) {
    super(message)
    this.status = status
    this.upstreamStatus = upstreamStatus
  }
}

export function normalizeUrl(raw) {
  let url
  try { url = new URL(raw) }
  catch { throw new OpenCodeError('Escribe una dirección válida de OpenCode.', 400) }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new OpenCodeError('La dirección debe ser una URL http o https sin credenciales ni parámetros.', 400)
  }
  return url.href.replace(/\/$/, '')
}

export function createOpenCode({ url, username = 'opencode', password = '', fetcher = fetch }) {
  const base = normalizeUrl(url)
  const auth = password ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` : null

  async function request(method, path, { directory, body, timeout = 15000 } = {}) {
    const target = new URL(base + path)
    if (directory) target.searchParams.set('directory', directory)
    let response
    try {
      response = await fetcher(target, {
        method,
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: auth } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeout),
      })
    } catch (error) {
      throw new OpenCodeError(`No se pudo hablar con OpenCode: ${error.message}`, 502)
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400)
      if (response.status === 401) throw new OpenCodeError('OpenCode rechazó el usuario o la contraseña.', 401)
      throw new OpenCodeError(`OpenCode respondió ${response.status}${detail ? `: ${detail}` : ''}`, 502, response.status)
    }
    const data = await response.json().catch(() => null)
    if (data === null) throw new OpenCodeError('OpenCode no devolvió una respuesta JSON válida.', 502)
    return data
  }

  async function readProjectFile(directory, path) {
    try {
      const file = await request('GET', `/file/content?path=${encodeURIComponent(path)}`, { directory })
      return file?.type === 'text' && typeof file.content === 'string' ? file.content : null
    } catch (error) {
      if (error.upstreamStatus === 404) return null
      throw error
    }
  }

  const text = (value, max = 600) => typeof value === 'string' ? value.trim().slice(0, max) : ''
  const httpUrl = (value) => {
    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch { return '' }
  }

  return {
    async check() {
      const health = await request('GET', '/global/health')
      if (health.healthy !== true) throw new OpenCodeError('OpenCode no informa que esté saludable.', 502)
      const path = await request('GET', '/path')
      return { version: health.version || 'desconocida', directory: path.directory || path.root || '' }
    },
    async createSession({ title, directory }) {
      const session = await request('POST', '/session', { directory, body: { title } })
      if (typeof session.id !== 'string') throw new OpenCodeError('OpenCode no devolvió el identificador de la sesión.', 502)
      if (directory && session.directory !== directory) {
        throw new OpenCodeError(`OpenCode creó la sesión en «${session.directory || 'otro directorio'}» en vez de «${directory}». No se enviará ningún cambio.`, 409)
      }
      return { id: session.id, directory: session.directory || directory || '' }
    },
    async verifyWorkspace({ directory, marker }) {
      const path = new URLSearchParams({ path: '.pagobli-workspace-id' }).toString()
      const file = await request('GET', `/file/content?${path}`, { directory })
      if (file.type !== 'text' || file.content.trim() !== marker) {
        throw new OpenCodeError('OpenCode no ve los mismos archivos que PagObli en este directorio. Revisa los volúmenes compartidos.', 409)
      }
      return true
    },
    async projectContext({ directory }) {
      const [project, notes, agents, rawConfig] = await Promise.all([
        readProjectFile(directory, 'PROJECT.md'),
        readProjectFile(directory, 'NOTAS.md'),
        readProjectFile(directory, 'AGENTS.md'),
        readProjectFile(directory, '.pagobli/context.json'),
      ])
      let config = {}
      let configError = ''
      if (rawConfig) {
        try {
          const parsed = JSON.parse(rawConfig)
          if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error()
          config = parsed
        } catch { configError = 'El archivo de contexto no contiene JSON válido.' }
      }
      const features = config.features && typeof config.features === 'object' && !Array.isArray(config.features)
        ? Object.fromEntries(['preview', 'history', 'visualEditing'].filter((key) => typeof config.features[key] === 'boolean').map((key) => [key, config.features[key]]))
        : {}
      return {
        project: {
          name: text(config.name || config.title, 120),
          description: text(config.description || config.summary, 800),
          template: text(config.template, 120),
          status: text(config.status, 80),
          previewUrl: httpUrl(config.previewUrl),
          features,
        },
        documents: {
          project: !!project,
          notes: !!notes,
          agentInstructions: !!agents,
          configuration: !!rawConfig,
        },
        ...(configError ? { warning: configError } : {}),
      }
    },
    async prompt({ sessionID, directory, text }) {
      if (!/^[a-zA-Z0-9_-]+$/.test(sessionID)) throw new OpenCodeError('Sesión no válida.', 400)
      const result = await request('POST', `/session/${sessionID}/message`, {
        directory,
        body: { parts: [{ type: 'text', text }] },
        timeout: 600000,
      })
      const answer = Array.isArray(result.parts)
        ? result.parts.filter((part) => part.type === 'text' && typeof part.text === 'string').map((part) => part.text).join('\n\n').trim()
        : ''
      return { answer: answer || 'OpenCode terminó sin enviar una explicación en texto.', info: result.info || null }
    },
    async pending({ sessionID, directory }) {
      const read = async (kind) => {
        try {
          const data = await request('GET', `/${kind}`, { directory })
          return { supported: true, items: Array.isArray(data) ? data.filter((item) => item.sessionID === sessionID) : [] }
        } catch (error) {
          if (error.upstreamStatus === 404) return { supported: false, items: [] }
          throw error
        }
      }
      const [permissions, questions] = await Promise.all([read('permission'), read('question')])
      return { permissions: permissions.items, questions: questions.items, supported: permissions.supported && questions.supported }
    },
    async replyPermission({ sessionID, directory, requestID, reply }) {
      if (!['once', 'reject'].includes(reply)) throw new OpenCodeError('Respuesta de permiso no válida.', 400)
      const pending = await this.pending({ sessionID, directory })
      if (!pending.permissions.some((item) => item.id === requestID)) throw new OpenCodeError('Esta solicitud de permiso ya no está pendiente.', 404)
      return request('POST', `/permission/${encodeURIComponent(requestID)}/reply`, { directory, body: { reply } })
    },
    async replyQuestion({ sessionID, directory, requestID, answers }) {
      const pending = await this.pending({ sessionID, directory })
      const question = pending.questions.find((item) => item.id === requestID)
      if (!question) throw new OpenCodeError('Esta pregunta ya no está pendiente.', 404)
      if (!Array.isArray(answers) || answers.length !== question.questions.length ||
          answers.some((answer) => !Array.isArray(answer) || !answer.length || answer.some((value) => typeof value !== 'string' || !value.trim()))) {
        throw new OpenCodeError('Responde todas las preguntas.', 400)
      }
      return request('POST', `/question/${encodeURIComponent(requestID)}/reply`, { directory, body: { answers } })
    },
    async history({ sessionID, directory }) {
      if (!/^[a-zA-Z0-9_-]+$/.test(sessionID)) throw new OpenCodeError('Sesión no válida.', 400)
      const messages = await request('GET', `/session/${sessionID}/message`, { directory })
      if (!Array.isArray(messages)) throw new OpenCodeError('OpenCode devolvió un historial no válido.', 502)
      return messages.filter((entry) => entry.info?.role === 'user').map((entry) => ({
        id: entry.info.id,
        text: Array.isArray(entry.parts) ? entry.parts.filter((part) => part.type === 'text').map((part) => part.text).join('\n').trim() : '',
        createdAt: entry.info.time?.created || null,
      })).filter((entry) => typeof entry.id === 'string')
    },
    async revert({ sessionID, directory, messageID }) {
      if (!/^[a-zA-Z0-9_-]+$/.test(messageID)) throw new OpenCodeError('Mensaje no válido.', 400)
      const messages = await this.history({ sessionID, directory })
      if (!messages.some((entry) => entry.id === messageID)) throw new OpenCodeError('Este cambio no pertenece a la sesión.', 404)
      return request('POST', `/session/${sessionID}/revert`, { directory, body: { messageID } })
    },
    async unrevert({ sessionID, directory }) {
      if (!/^[a-zA-Z0-9_-]+$/.test(sessionID)) throw new OpenCodeError('Sesión no válida.', 400)
      return request('POST', `/session/${sessionID}/unrevert`, { directory, body: {} })
    },
  }
}
