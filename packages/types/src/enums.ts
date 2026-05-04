export enum Role {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
}

export enum LeadStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  LOST = 'LOST',
}

export enum PipelineStage {
  NEW = 'NEW',
  CONTACT = 'CONTACT',
  NEGOTIATION = 'NEGOTIATION',
  PROPOSAL = 'PROPOSAL',
  CLOSED = 'CLOSED',
  LOST = 'LOST',
}

export enum LeadSource {
  WHATSAPP = 'WHATSAPP',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  WAITING = 'WAITING',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum PlanType {
  STARTER = 'starter',
  PRO = 'pro',
  SCALE = 'scale',
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NEW]: 'Novo Lead',
  [PipelineStage.CONTACT]: 'Contato',
  [PipelineStage.NEGOTIATION]: 'Negociação',
  [PipelineStage.PROPOSAL]: 'Proposta',
  [PipelineStage.CLOSED]: 'Fechado',
  [PipelineStage.LOST]: 'Perdido',
}

export enum FinanceType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum FinanceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum PaymentType {
  CASH = 'CASH',
  FINANCING = 'FINANCING',
  CARD = 'CARD',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
}

export const FINANCE_TYPE_LABELS: Record<FinanceType, string> = {
  [FinanceType.INCOME]: 'Receita',
  [FinanceType.EXPENSE]: 'Despesa',
}

export const FINANCE_STATUS_LABELS: Record<FinanceStatus, string> = {
  [FinanceStatus.PENDING]: 'Pendente',
  [FinanceStatus.PAID]: 'Pago',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.CASH]: 'À Vista',
  [PaymentType.FINANCING]: 'Financiamento',
  [PaymentType.CARD]: 'Cartão',
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.ACTIVE]: 'Ativo',
  [ContractStatus.PENDING]: 'Pendente',
  [ContractStatus.CANCELED]: 'Cancelado',
}

export enum FinanceStatusExtended {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export const FINANCE_STATUS_EXTENDED_LABELS: Record<FinanceStatusExtended, string> = {
  [FinanceStatusExtended.PENDING]: 'Pendente',
  [FinanceStatusExtended.PARTIAL]: 'Parcial',
  [FinanceStatusExtended.PAID]: 'Pago',
}

export enum PaymentMethod {
  CASH = 'CASH',
  PIX = 'PIX',
  CARD_CREDIT = 'CARD_CREDIT',
  CARD_DEBIT = 'CARD_DEBIT',
  TRANSFER = 'TRANSFER',
  BOLETO = 'BOLETO',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.PIX]: 'Pix',
  [PaymentMethod.CARD_CREDIT]: 'Cartão de Crédito',
  [PaymentMethod.CARD_DEBIT]: 'Cartão de Débito',
  [PaymentMethod.TRANSFER]: 'Transferência',
  [PaymentMethod.BOLETO]: 'Boleto',
}

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  PipelineStage.NEW,
  PipelineStage.CONTACT,
  PipelineStage.NEGOTIATION,
  PipelineStage.PROPOSAL,
  PipelineStage.CLOSED,
  PipelineStage.LOST,
]
