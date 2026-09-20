import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Marca OblivionUI: un anillo interrumpido, la «O» que se está construyendo. */
export function Marca({ className, compacta }: { className?: string; compacta?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 28 28" className="size-7" role="img" aria-label="OblivionUI">
        <defs>
          <linearGradient id="oblivion" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 300)" />
            <stop offset="100%" stopColor="oklch(0.5 0.24 292)" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" rx="8" fill="url(#oblivion)" />
        <circle cx="14" cy="14" r="6.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="28 12" transform="rotate(-38 14 14)" />
      </svg>
      <span className={cn('text-[15px] font-semibold tracking-tight', compacta && 'max-sm:sr-only')}>
        Oblivion<span className="text-primary">UI</span>
      </span>
    </span>
  )
}

type Tono = 'demo' | 'hold' | 'ok' | 'real' | 'neutro'

const tonos: Record<Tono, string> = {
  demo: 'border-demo/35 bg-demo-bg text-demo',
  hold: 'border-hold/35 bg-hold-bg text-hold',
  ok: 'border-ok/35 bg-ok-bg text-ok',
  real: 'border-primary/35 bg-primary/10 text-primary',
  neutro: 'border-border bg-muted text-muted-foreground',
}

/** Estado de un expediente o de un trabajo en curso. */
export function Estado({ tono = 'neutro', className, children }: {
  tono?: Tono
  className?: string
  children: React.ReactNode
}) {
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', tonos[tono], className)}>
      {children}
    </Badge>
  )
}

export const TONO_ESTADO: Record<string, Tono> = {
  'Preparando': 'neutro',
  'Aplicando cambios': 'real',
  'Verificando': 'real',
  'Listo para revisar': 'ok',
  'OpenCode trabajando': 'real',
}

export const folio = (n: number) => `EXP-${String(n).padStart(4, '0')}`
