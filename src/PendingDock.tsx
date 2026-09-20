import { useState } from 'react'
import { replyPermission, replyQuestion, type Pending } from './api'

const permissionNames: Record<string, string> = {
  edit: 'Modificar archivos', bash: 'Ejecutar un comando', read: 'Leer archivos',
  external_directory: 'Acceder fuera del proyecto', webfetch: 'Consultar una página web',
  websearch: 'Buscar en internet', question: 'Hacer una pregunta',
}

export function PendingDock({ sessionID, directory, pending, onResolved }: {
  sessionID: string; directory: string; pending: Pending; onResolved: () => void
}) {
  return <div className="pending-dock" aria-live="polite">
    {!pending.supported && <p className="pending-note">Esta versión de OpenCode no expone todas las preguntas y permisos a PagObli. Si el trabajo se detiene, revísalo en OpenCode.</p>}
    {pending.permissions.map((permission) =>
      <PermissionCard key={permission.id} sessionID={sessionID} directory={directory} permission={permission} onResolved={onResolved} />)}
    {pending.questions.map((question) =>
      <QuestionCard key={question.id} sessionID={sessionID} directory={directory} request={question} onResolved={onResolved} />)}
  </div>
}

function PermissionCard({ sessionID, directory, permission, onResolved }: {
  sessionID: string; directory: string; permission: Pending['permissions'][number]; onResolved: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function respond(reply: 'once' | 'reject') {
    setBusy(true); setError('')
    try { await replyPermission(sessionID, directory, permission.id, reply); onResolved() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="pending-card">
    <strong>OpenCode necesita tu autorización</strong>
    <p>{permissionNames[permission.permission] || `Usar ${permission.permission}`}</p>
    {!!permission.patterns?.length && <small>Alcance: {permission.patterns.join(', ')}</small>}
    {typeof permission.metadata?.command === 'string' && <code>{permission.metadata.command}</code>}
    <div className="row">
      <button className="btn" disabled={busy} onClick={() => respond('once')}>Permitir esta vez</button>
      <button className="btn ghost" disabled={busy} onClick={() => respond('reject')}>No permitir</button>
    </div>
    {error && <span className="bad" role="alert">{error}</span>}
  </section>
}

function QuestionCard({ sessionID, directory, request, onResolved }: {
  sessionID: string; directory: string; request: Pending['questions'][number]; onResolved: () => void
}) {
  const [selected, setSelected] = useState<Record<number, string[]>>({})
  const [custom, setCustom] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const answers = request.questions.map((question, index) => {
    const own = custom[index]?.trim()
    return question.multiple ? [...(selected[index] || []), ...(own ? [own] : [])] : own ? [own] : selected[index] || []
  })
  async function respond() {
    if (answers.some((answer) => answer.length === 0)) { setError('Responde todas las preguntas.'); return }
    setBusy(true); setError('')
    try { await replyQuestion(sessionID, directory, request.id, answers); onResolved() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="pending-card">
    <strong>OpenCode necesita una decisión</strong>
    {request.questions.map((question, index) => <div className="question-block" key={index}>
      <p><b>{question.header}</b> · {question.question}</p>
      <div className="option-list">{question.options.map((option) => {
        const chosen = (selected[index] || []).includes(option.label)
        return <button key={option.label} type="button" className={`option ${chosen ? 'selected' : ''}`}
          onClick={() => setSelected((prev) => ({ ...prev, [index]: question.multiple
            ? chosen ? (prev[index] || []).filter((label) => label !== option.label) : [...(prev[index] || []), option.label]
            : [option.label] }))}>
          <b>{option.label}</b><small>{option.description}</small>
        </button>
      })}</div>
      <input aria-label={`Otra respuesta para ${question.header}`} value={custom[index] || ''}
        onChange={(event) => setCustom((prev) => ({ ...prev, [index]: event.target.value }))}
        placeholder="Otra respuesta (opcional)" />
    </div>)}
    <button className="btn" disabled={busy} onClick={respond}>Enviar respuesta</button>
    {error && <span className="bad" role="alert">{error}</span>}
  </section>
}
