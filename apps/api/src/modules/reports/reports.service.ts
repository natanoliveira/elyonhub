import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LeadStatus, PipelineStage } from '@prisma/client'
import { subDays } from 'date-fns'
import * as pdfmake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

(pdfmake as any).vfs = (pdfFonts as any).vfs

const STAGE_LABELS: Record<string, string> = {
  NEW: 'Novo Lead', CONTACT: 'Contato', NEGOTIATION: 'Negociação',
  PROPOSAL: 'Proposta', CLOSED: 'Fechado', LOST: 'Perdido',
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

  private async getCompany(companyId: string) {
    return this.prisma.company.findUnique({ where: { id: companyId } })
  }

  private buildDoc(company: any, title: string, content: any[]): Promise<Buffer> {
    const docDef: any = {
      content: [
        { text: company?.name ?? 'Elyon Hub', style: 'header' },
        { text: title, style: 'subheader' },
        { text: `Gerado em ${new Date().toLocaleDateString('pt-BR')}`, style: 'meta' },
        { text: ' ' },
        ...content,
        { text: '\nGerado por Elyon Hub · Natan Sousa Tech', style: 'footer' },
      ],
      styles: {
        header: { fontSize: 18, bold: true, color: '#553159' },
        subheader: { fontSize: 13, bold: true, margin: [0, 5, 0, 2] },
        meta: { fontSize: 9, color: '#888' },
        footer: { fontSize: 8, color: '#aaa', margin: [0, 20, 0, 0] },
        tableHeader: { bold: true, fillColor: '#553159', color: '#fff' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 },
    }

    return new Promise((resolve) => {
      const pdf = (pdfmake as any).createPdf(docDef)
      pdf.getBuffer(resolve)
    })
  }

  async generateLeadsPDF(companyId: string, from?: string, to?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const leads = await this.prisma.lead.findMany({
      where: { companyId, createdAt: this.dateFilter(from, to) },
      include: { assignedUser: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const rows = leads.map((l) => [
      l.name,
      l.phone,
      STAGE_LABELS[l.pipelineStage],
      l.assignedUser?.name ?? '—',
      new Date(l.createdAt).toLocaleDateString('pt-BR'),
    ])

    const content: any[] = [
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Nome', style: 'tableHeader' },
              { text: 'Telefone', style: 'tableHeader' },
              { text: 'Etapa', style: 'tableHeader' },
              { text: 'Vendedor', style: 'tableHeader' },
              { text: 'Data', style: 'tableHeader' },
            ],
            ...rows,
          ],
        },
      },
    ]

    return this.buildDoc(company, 'Relatório de Leads', content)
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
      return [STAGE_LABELS[stage], String(count), `${pct}%`]
    })

    const content: any[] = [
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Etapa', style: 'tableHeader' },
              { text: 'Quantidade', style: 'tableHeader' },
              { text: '% do Total', style: 'tableHeader' },
            ],
            ...rows,
          ],
        },
      },
    ]

    return this.buildDoc(company, 'Relatório de Conversão', content)
  }

  async generateSalesPDF(companyId: string, from?: string, to?: string): Promise<Buffer> {
    const company = await this.getCompany(companyId)
    const leads = await this.prisma.lead.findMany({
      where: { companyId, status: LeadStatus.CLOSED, updatedAt: this.dateFilter(from, to) },
      include: { assignedUser: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    })

    const rows = leads.map((l) => [
      l.name,
      l.phone,
      l.assignedUser?.name ?? '—',
      new Date(l.updatedAt).toLocaleDateString('pt-BR'),
    ])

    const content: any[] = [
      { text: `Total de vendas fechadas: ${leads.length}`, margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Cliente', style: 'tableHeader' },
              { text: 'Telefone', style: 'tableHeader' },
              { text: 'Vendedor', style: 'tableHeader' },
              { text: 'Data', style: 'tableHeader' },
            ],
            ...rows,
          ],
        },
      },
    ]

    return this.buildDoc(company, 'Relatório de Vendas', content)
  }
}
