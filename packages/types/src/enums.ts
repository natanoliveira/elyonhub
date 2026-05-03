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

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  PipelineStage.NEW,
  PipelineStage.CONTACT,
  PipelineStage.NEGOTIATION,
  PipelineStage.PROPOSAL,
  PipelineStage.CLOSED,
  PipelineStage.LOST,
]
