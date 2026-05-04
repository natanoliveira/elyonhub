import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LeadStatus, PipelineStage, FinanceType } from '@prisma/client'
import { subDays } from 'date-fns'
import * as pdfmake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

;(pdfmake as any).vfs = (pdfFonts as any).vfs

const STAGE_LABELS: Record<string, string> = {
  NEW: 'Novo Lead', CONTACT: 'Contato', NEGOTIATION: 'Negociação',
  PROPOSAL: 'Proposta', CLOSED: 'Fechado', LOST: 'Perdido',
}
const LEAD_STATUS_LABELS: Record<string, string> = { ACTIVE: 'Ativo', CLOSED: 'Fechado', LOST: 'Perdido' }
const FINANCE_TYPE_LABELS: Record<string, string> = { INCOME: 'Receita', EXPENSE: 'Despesa' }
const FINANCE_STATUS_LABELS: Record<string, string> = { PENDING: 'Pendente', PAID: 'Pago' }
const PAYMENT_TYPE_LABELS: Record<string, string> = { CASH: 'À Vista', FINANCING: 'Financiamento', CARD: 'Cartão' }
const CONTRACT_STATUS_LABELS: Record<string, string> = { ACTIVE: 'Ativo', PENDING: 'Pendente', CANCELED: 'Cancelado' }

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

const tableLayout = {
  hLineWidth: (i: number) => (i <= 1 ? 0 : 0.5),
  vLineWidth: () => 0,
  hLineColor: () => '#e5e7eb',
  paddingLeft: () => 8,
  paddingRight: () => 8,
  paddingTop: () => 6,
  paddingBottom: () => 6,
  fillColor: (i: number) => (i === 0 ? null : i % 2 === 0 ? '#f9fafb' : null),
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private dateFilter(from?: string, to?: string) {
    return {
      gte: from ? new Date(from) : subDays(new Date(), 30),
      lte: to ? new Date(to) : new Date(),
    }
  }

  private buildPeriodText(from?: string, to?: string): string {
    const f = from ? new Date(from).toLocaleDateString('pt-BR') : subDays(new Date(), 30).toLocaleDateString('pt-BR')
    const t = to ? new Date(to).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
    return `Período: ${f} a ${t}`
  }

  private async getCompany(companyId: string) {
    return this.prisma.company.findUnique({ where: { id: companyId } })
  }

  private makeHeader(cols: string[]) {
    return cols.map((text) => ({ text, style: 'tableHeader', fillColor: '#553159' }))
  }

  private buildDoc(company: any, title: string, period: string, content: any[]): Promise<Buffer> {
    const now = new Date().toLocaleDateString('pt-BR')
    const docDef: any = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: `${company?.name ?? 'Elyon Hub'} · Elyon Hub`, fontSize: 8, color: '#aaa', margin: [40, 0, 0, 0] },
          { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: '#aaa', alignment: 'right', margin: [0, 0, 40, 0] },
        ],
      }),
      content: [
        // Cabeçalho em `content` — aparece somente na primeira página
        {
          columns: [
            {
              stack: [
                { text: company?.name ?? 'Elyon Hub', fontSize: 16, bold: true, color: '#553159' },
                { text: title, fontSize: 11, bold: true, color: '#333', margin: [0, 4, 0, 0] },
                { text: period, fontSize: 9, color: '#888', margin: [0, 2, 0, 0] },
              ],
            },
            { text: `Gerado em ${now}`, fontSize: 9, color: '#888', alignment: 'right', width: 'auto', margin: [0, 4, 0, 0] },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#553159' }],
          margin: [0, 0, 0, 18],
        },
        ...content,
      ],
      styles: {
        tableHeader: { bold: true, color: '#ffffff', fontSize: 9 },
        summaryValue: { fontSize: 9, bold: true },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9 },
    }
    return new Promise((resolve) => {
      const pdf = (pdfmake as any).createPdf(docDef)
      pdf.getBuffer(resolve)
    })
  }

  async generateLeadsPDF(companyId: string, from?: string, to?: string, stage?: string, status?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const where: any = { companyId, createdAt: this.dateFilter(from, to) }
    if (stage) where.pipelineStage = stage
    if (status) where.status = status
    const leads = await this.prisma.lead.findMany({
      where,
      include: { assignedUser: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const rows = leads.map((l) => [
      l.name, l.phone,
      STAGE_LABELS[l.pipelineStage] ?? l.pipelineStage,
      LEAD_STATUS_LABELS[l.status] ?? l.status,
      l.assignedUser?.name ?? '—',
      formatDate(l.createdAt),
    ])
    return this.buildDoc(company, 'Relatório de Leads', this.buildPeriodText(from, to), [
      { text: `Total de registros: ${leads.length}`, fontSize: 9, color: '#666', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [this.makeHeader(['Nome', 'Telefone', 'Etapa', 'Status', 'Vendedor', 'Data']), ...rows],
        },
        layout: tableLayout,
      },
    ])
  }

  async generateConversionPDF(companyId: string, from?: string, to?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const byStage = await this.prisma.lead.groupBy({
      by: ['pipelineStage'],
      where: { companyId, createdAt: this.dateFilter(from, to) },
      _count: { _all: true },
    })
    const total = byStage.reduce((sum, r) => sum + r._count._all, 0)
    const rows = Object.values(PipelineStage).map((stage) => {
      const row = byStage.find((r) => r.pipelineStage === stage)
      const count = row?._count._all ?? 0
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      return [STAGE_LABELS[stage], { text: String(count), alignment: 'right' }, { text: `${pct}%`, alignment: 'right' }]
    })
    return this.buildDoc(company, 'Relatório de Conversão', this.buildPeriodText(from, to), [
      { text: `Total de leads no período: ${total}`, fontSize: 9, color: '#666', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 80, 80],
          body: [this.makeHeader(['Etapa', 'Quantidade', '% do Total']), ...rows],
        },
        layout: tableLayout,
      },
    ])
  }

  async generateSalesPDF(companyId: string, from?: string, to?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const leads = await this.prisma.lead.findMany({
      where: { companyId, status: LeadStatus.CLOSED, updatedAt: this.dateFilter(from, to) },
      include: { assignedUser: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    const rows = leads.map((l) => [l.name, l.phone, l.assignedUser?.name ?? '—', formatDate(l.updatedAt)])
    return this.buildDoc(company, 'Relatório de Vendas', this.buildPeriodText(from, to), [
      { text: `Total de vendas fechadas: ${leads.length}`, fontSize: 9, color: '#666', margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [this.makeHeader(['Cliente', 'Telefone', 'Vendedor', 'Data de Fechamento']), ...rows],
        },
        layout: tableLayout,
      },
    ])
  }

  async generateFinancePDF(companyId: string, from?: string, to?: string, type?: string, status?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const where: any = { companyId, dueDate: this.dateFilter(from, to) }
    if (type) where.type = type
    if (status) where.status = status
    const records = await this.prisma.finance.findMany({ where, orderBy: { dueDate: 'asc' } })
    const income = records.filter((r) => r.type === FinanceType.INCOME).reduce((s, r) => s + Number(r.amount), 0)
    const expense = records.filter((r) => r.type === FinanceType.EXPENSE).reduce((s, r) => s + Number(r.amount), 0)
    const rows = records.map((r) => [
      r.description,
      FINANCE_TYPE_LABELS[r.type] ?? r.type,
      r.category ?? '—',
      formatDate(r.dueDate),
      { text: formatBRL(Number(r.amount)), alignment: 'right' },
      FINANCE_STATUS_LABELS[r.status] ?? r.status,
    ])
    return this.buildDoc(company, 'Relatório Financeiro', this.buildPeriodText(from, to), [
      {
        columns: [
          { text: `Receitas: ${formatBRL(income)}`, fontSize: 9, bold: true, color: '#16a34a' },
          { text: `Despesas: ${formatBRL(expense)}`, fontSize: 9, bold: true, color: '#dc2626' },
          { text: `Saldo: ${formatBRL(income - expense)}`, fontSize: 9, bold: true, color: income - expense >= 0 ? '#1d4ed8' : '#ea580c' },
        ],
        margin: [0, 0, 0, 14],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [this.makeHeader(['Descrição', 'Tipo', 'Categoria', 'Vencimento', 'Valor', 'Status']), ...rows],
        },
        layout: tableLayout,
      },
    ])
  }

  async generateContractsPDF(companyId: string, from?: string, to?: string, status?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const where: any = { companyId, startDate: this.dateFilter(from, to) }
    if (status) where.status = status
    const contracts = await this.prisma.contract.findMany({ where, orderBy: { startDate: 'desc' } })
    const totalValue = contracts.reduce((s, c) => s + Number(c.contractValue), 0)
    const rows = contracts.map((c) => [
      c.clientName, c.document ?? '—', c.phone,
      PAYMENT_TYPE_LABELS[c.paymentType] ?? c.paymentType,
      formatDate(c.startDate),
      { text: formatBRL(Number(c.contractValue)), alignment: 'right' },
      CONTRACT_STATUS_LABELS[c.status] ?? c.status,
    ])
    return this.buildDoc(company, 'Relatório de Contratos', this.buildPeriodText(from, to), [
      {
        columns: [
          { text: `Total de contratos: ${contracts.length}`, fontSize: 9, bold: true },
          { text: `Valor total: ${formatBRL(totalValue)}`, fontSize: 9, bold: true, color: '#553159' },
        ],
        margin: [0, 0, 0, 14],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [this.makeHeader(['Cliente', 'CPF/CNPJ', 'Telefone', 'Pagamento', 'Início', 'Valor', 'Status']), ...rows],
        },
        layout: tableLayout,
      },
    ])
  }
}
