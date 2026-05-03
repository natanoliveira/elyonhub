'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Button } from './button'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  resolve: (value: boolean) => void
}

interface ConfirmContextValue {
  confirm: (options?: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    resolve: () => {},
  })

  const confirm = useCallback((options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, open: true, resolve })
    })
  }, [])

  function handleResponse(value: boolean) {
    setState((s) => ({ ...s, open: false }))
    state.resolve(value)
  }

  const isDestructive = state.variant === 'destructive'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => handleResponse(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                isDestructive ? 'bg-red-100' : 'bg-primary/10',
              )}>
                {isDestructive
                  ? <AlertTriangle className="h-5 w-5 text-destructive" />
                  : <Info className="h-5 w-5 text-primary" />
                }
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {state.title ?? 'Confirmar ação'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {state.description ?? 'Deseja realmente continuar?'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" size="sm" onClick={() => handleResponse(false)}>
                {state.cancelLabel ?? 'Cancelar'}
              </Button>
              <Button
                variant={isDestructive ? 'destructive' : 'primary'}
                size="sm"
                onClick={() => handleResponse(true)}
              >
                {state.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider')
  return ctx.confirm
}
