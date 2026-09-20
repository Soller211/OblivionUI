import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, MessageCircleQuestion, PauseCircle, ShieldCheck, X } from 'lucide-react'
import { replyPermission, replyQuestion, type Pending } from './api'
import { Estado } from '@/components/marca'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const permisos: Record<string, string> = {
  edit: 'Modificar archivos del proyecto',
  bash: 'Ejecutar un comando en el servidor',
  read: 'Leer archivos del proyecto',
  external_directory: 'Acceder a archivos fuera del proyecto',
  webfetch: 'Consultar una página web',
  websearch: 'Buscar en internet',
  question: 'Hacer una pregunta',
}

export function PendingDock({ sessionID, directory, pending, onResolved }: {
  sessionID: string; directory: string; pending: Pending; onResolved: () => void
}) {
  const total = pending.permissions.length + pending.questions.length
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      aria-label="Autorizaciones pendientes"
      className="border-hold/30 bg-hold-bg/40 relative flex max-h-[min(56vh,30rem)] flex-col border-t"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-3 pt-3 pb-2">
        <Estado tono="hold"><PauseCircle className="size-3" />Retenido</Estado>
        <span className="text-hold text-xs">
          {total > 0
            ? `El trabajo está detenido hasta que respondas · ${total} ${total === 1 ? 'pendiente' : 'pendientes'}`
            : 'Revisa el avance directamente en OpenCode.'}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pt-1 pb-6">
      {!pending.supported && (
        <p className="text-hold/90 text-xs text-pretty">
          Esta versión de OpenCode no expone todas las preguntas y permisos. Si el trabajo se detiene sin avisar,
          revísalo allá.
        </p>
      )}
      {pending.permissions.map((permission) => (
        <TarjetaPermiso key={permission.id} sessionID={sessionID} directory={directory}
          permission={permission} onResolved={onResolved} />
      ))}
      {pending.questions.map((question) => (
        <TarjetaPregunta key={question.id} sessionID={sessionID} directory={directory}
          request={question} onResolved={onResolved} />
      ))}
      </div>
      <span aria-hidden
        className="from-hold-bg/80 pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent" />
    </motion.div>
  )
}

function Tarjeta({ titulo, Icono, children }: {
  titulo: string
  Icono: typeof ShieldCheck
  children: React.ReactNode
}) {
  return (
    <section className="bg-card border-hold/30 space-y-3 rounded-lg border p-3.5 shadow-xs">
      <h3 className="flex items-start gap-2 text-sm font-semibold text-pretty">
        <Icono className="text-hold mt-0.5 size-4 shrink-0" />
        {titulo}
      </h3>
      {children}
    </section>
  )
}

function TarjetaPermiso({ sessionID, directory, permission, onResolved }: {
  sessionID: string; directory: string; permission: Pending['permissions'][number]; onResolved: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function responder(reply: 'once' | 'reject') {
    setBusy(true); setError('')
    try { await replyPermission(sessionID, directory, permission.id, reply); onResolved() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return (
    <Tarjeta Icono={ShieldCheck}
      titulo={`Autoriza: ${(permisos[permission.permission] || `usar ${permission.permission}`).toLowerCase()}`}>
      {!!permission.patterns?.length && (
        <p className="text-muted-foreground text-xs">
          Alcance: <span className="font-mono">{permission.patterns.join(', ')}</span>
        </p>
      )}
      {typeof permission.metadata?.command === 'string' && (
        <code className="bg-muted block rounded-md border p-2.5 font-mono text-xs leading-relaxed [overflow-wrap:anywhere]">
          {permission.metadata.command}
        </code>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" disabled={busy} onClick={() => responder('once')}>
          <Check className="size-3.5" />Autorizar esta vez
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" disabled={busy} onClick={() => responder('reject')}>
          <X className="size-3.5" />No autorizar
        </Button>
      </div>
      {error && <p className="text-destructive text-xs" role="alert">{error}</p>}
    </Tarjeta>
  )
}

function TarjetaPregunta({ sessionID, directory, request, onResolved }: {
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
  async function responder() {
    if (answers.some((answer) => answer.length === 0)) { setError('Responde todas las preguntas.'); return }
    setBusy(true); setError('')
    try { await replyQuestion(sessionID, directory, request.id, answers); onResolved() }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return (
    <Tarjeta Icono={MessageCircleQuestion} titulo="Responde para que el trabajo continúe">
      {request.questions.map((question, index) => (
        <div className="space-y-2.5" key={index}>
          <div>
            <p className="text-sm font-semibold">{question.header}</p>
            <p className="text-muted-foreground text-sm text-pretty">{question.question}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const elegida = (selected[index] || []).includes(option.label)
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={elegida}
                  onClick={() => setSelected((prev) => ({
                    ...prev,
                    [index]: question.multiple
                      ? elegida ? (prev[index] || []).filter((label) => label !== option.label) : [...(prev[index] || []), option.label]
                      : [option.label],
                  }))}
                  className={cn(
                    'hover:bg-accent/50 rounded-lg border p-2.5 text-left transition-colors',
                    elegida && 'border-primary/50 bg-primary/5',
                  )}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="text-muted-foreground block text-xs text-pretty">{option.description}</span>
                </button>
              )
            })}
          </div>
          <Input
            aria-label={`Otra respuesta para ${question.header}`}
            value={custom[index] || ''}
            onChange={(event) => setCustom((prev) => ({ ...prev, [index]: event.target.value }))}
            placeholder="Otra respuesta (opcional)"
          />
        </div>
      ))}
      <Button size="sm" disabled={busy} onClick={responder}>Enviar respuesta</Button>
      {error && <p className="text-destructive text-xs" role="alert">{error}</p>}
    </Tarjeta>
  )
}
