export type Account = { id: string; name: string; email: string }
export type WorkspaceAccount = { id: string; name: string; role: 'owner' | 'admin' | 'member' }
export type Identity = { enabled: boolean; authenticated: boolean; user?: Account; workspace?: WorkspaceAccount; workspaces: WorkspaceAccount[] }

export type Connection = { connected: boolean; available?: boolean; provisioning?: boolean; runtime?: boolean; url?: string; version?: string; directory?: string }
export const staticDemo = import.meta.env.VITE_STATIC_DEMO === 'true'

async function call<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `La solicitud falló (${response.status}).`)
  return data as T
}

export const getIdentity = () => staticDemo
  ? Promise.resolve<Identity>({ enabled: false, authenticated: true, user: { id: 'demo', name: 'Visitante', email: '' }, workspace: { id: 'demo', name: 'Demostración pública', role: 'owner' }, workspaces: [{ id: 'demo', name: 'Demostración pública', role: 'owner' }] })
  : call<Identity>('/api/auth/status')
export const login = (email: string, password: string) => call<Identity>('/api/auth/login', { email, password })
export const logout = () => call<{ authenticated: false }>('/api/auth/logout', {})
export const createWorkspace = (name: string) => call<{ workspace: WorkspaceAccount; workspaces: WorkspaceAccount[] }>('/api/workspaces', { name })
export const selectWorkspace = (id: string) => call<{ workspace: WorkspaceAccount; workspaces: WorkspaceAccount[] }>(`/api/workspaces/${encodeURIComponent(id)}/select`, {})
export const addWorkspaceMember = (workspaceId: string, input: { name: string; email: string; password: string; role: 'admin' | 'member' }) => call<{ member: Account }>(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`, input)

export const getConnection = () => staticDemo
  ? Promise.resolve<Connection>({ connected: false, available: false, provisioning: false, runtime: false })
  : call<Connection>('/api/connection')
export const connect = (input: { accessKey: string; url: string; username: string; password: string }) =>
  staticDemo ? Promise.reject(new Error('La versión pública es una demostración. Conecta OpenCode en una instalación propia de OblivionUI.')) : call<Connection>('/api/connect', input)
export const disconnect = () => call<Connection>('/api/disconnect', {})
export const createSession = (title: string, directory: string) =>
  call<{ id: string; directory: string }>('/api/session', { title, directory })
export const provisionProject = (title: string) =>
  call<{ id: string; directory: string; provisioned: boolean; runtime: { enabled: boolean; status: string; previewUrl: string } }>('/api/provision', { title })
export const sendPrompt = (sessionID: string, directory: string, text: string) =>
  call<{ answer: string }>(`/api/session/${encodeURIComponent(sessionID)}/message`, { directory, text })

export type ProjectContext = {
  project: {
    name: string
    description: string
    template: string
    status: string
    previewUrl: string
    features: Record<'preview' | 'history' | 'visualEditing', boolean>
  }
  documents: { project: boolean; notes: boolean; agentInstructions: boolean; configuration: boolean }
  warning?: string
}
export const getProjectContext = (sessionID: string, directory: string) =>
  call<ProjectContext>(`/api/session/${encodeURIComponent(sessionID)}/context?directory=${encodeURIComponent(directory)}`)

export type Pending = {
  supported: boolean
  permissions: { id: string; sessionID: string; permission: string; patterns: string[]; metadata?: Record<string, unknown> }[]
  questions: { id: string; sessionID: string; questions: { header: string; question: string; options: { label: string; description: string }[]; multiple?: boolean }[] }[]
}
export const getPending = (sessionID: string, directory: string) =>
  call<Pending>(`/api/session/${encodeURIComponent(sessionID)}/pending?directory=${encodeURIComponent(directory)}`)
export const replyPermission = (sessionID: string, directory: string, requestID: string, reply: 'once' | 'reject') =>
  call<{ accepted: boolean }>(`/api/session/${encodeURIComponent(sessionID)}/permission/${encodeURIComponent(requestID)}/reply`, { directory, reply })
export const replyQuestion = (sessionID: string, directory: string, requestID: string, answers: string[][]) =>
  call<{ accepted: boolean }>(`/api/session/${encodeURIComponent(sessionID)}/question/${encodeURIComponent(requestID)}/reply`, { directory, answers })

export type HistoryEntry = { id: string; text: string; createdAt: number | null }
export const getHistory = (sessionID: string, directory: string) =>
  call<HistoryEntry[]>(`/api/session/${encodeURIComponent(sessionID)}/history?directory=${encodeURIComponent(directory)}`)
export const revertChange = (sessionID: string, directory: string, messageID: string) =>
  call<{ restored: boolean }>(`/api/session/${encodeURIComponent(sessionID)}/revert`, { directory, messageID })
export const unrevertChange = (sessionID: string, directory: string) =>
  call<{ restored: boolean }>(`/api/session/${encodeURIComponent(sessionID)}/unrevert`, { directory })
