import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type Tema = 'claro' | 'oscuro' | 'sistema'

const CLAVE = 'oblivionui.tema'
const Contexto = createContext<{ tema: Tema; setTema: (t: Tema) => void }>({
  tema: 'sistema',
  setTema: () => {},
})

function leer(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTemaEstado] = useState<Tema>(leer)

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const aplicar = () => {
      const oscuro = tema === 'oscuro' || (tema === 'sistema' && media.matches)
      document.documentElement.classList.toggle('dark', oscuro)
      document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
    }
    aplicar()
    media.addEventListener('change', aplicar)
    return () => media.removeEventListener('change', aplicar)
  }, [tema])

  const setTema = (t: Tema) => {
    setTemaEstado(t)
    try {
      if (t === 'sistema') localStorage.removeItem(CLAVE)
      else localStorage.setItem(CLAVE, t)
    } catch {
      /* navegación privada: la preferencia dura lo que la pestaña */
    }
  }

  return <Contexto.Provider value={{ tema, setTema }}>{children}</Contexto.Provider>
}

export function SelectorTema() {
  const { tema, setTema } = useContext(Contexto)
  const opciones: { valor: Tema; texto: string; Icono: typeof Sun }[] = [
    { valor: 'claro', texto: 'Claro', Icono: Sun },
    { valor: 'oscuro', texto: 'Oscuro', Icono: Moon },
    { valor: 'sistema', texto: 'Igual que el sistema', Icono: Monitor },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cambiar tema">
          <Sun className="size-4 scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {opciones.map(({ valor, texto, Icono }) => (
          <DropdownMenuItem key={valor} onClick={() => setTema(valor)} className="gap-2">
            <Icono className="size-4" />
            {texto}
            {tema === valor && <span className="ml-auto text-primary">•</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
