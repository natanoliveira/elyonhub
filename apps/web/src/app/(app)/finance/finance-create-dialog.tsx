import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FinanceType, FINANCE_TYPE_LABELS } from '@elyonhub/types'

export interface CreateFinanceForm {
  type: FinanceType
  description: string
  amount: string
  dueDate: string
  category: string
}

interface Props {
  open: boolean
  form: CreateFinanceForm
  isPending: boolean
  onChange: (form: CreateFinanceForm) => void
  onSubmit: () => void
  onClose: () => void
}

export function FinanceCreateDialog({ open, form, isPending, onChange, onSubmit, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Novo Lançamento">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo *</label>
          <select
            value={form.type}
            onChange={(e) => onChange({ ...form, type: e.target.value as FinanceType })}
            className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
          >
            {Object.entries(FINANCE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descrição *</label>
          <Input
            placeholder="Ex: Assinatura de software"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Valor (R$) *</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Vencimento *</label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => onChange({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Categoria</label>
          <Input
            placeholder="Ex: Marketing, Infraestrutura..."
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={onSubmit}
            disabled={!form.description || !form.amount || !form.dueDate || isPending}
          >
            Criar
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
