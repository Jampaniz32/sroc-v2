
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  agency?: string;
  requiresPasswordChange?: boolean;
}

export type ExportFormat = 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'XML';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  roomId: string; // 'global', 'ai', ou 'userId_userId'
  isRead?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'private' | 'ai';
  lastMessage?: string;
  lastTimestamp?: string;
  unreadCount: number;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  frequency: 'daily' | 'weekly';
  retentionMonths: number; // 0 para permanente
  autoDeleteExpired: boolean;
  lastBackupDate?: string;
}

export interface SystemConfig {
  logo: string;
  institutionName: string;
  timezone: string;
  dateFormat: string;
  departments: string[];
  fieldVisibility: {
    clientName: boolean;
    phoneNumber: boolean;
    reason: boolean;
    observations: boolean;
  };
  slaMinutes: number;
  notificationsEnabled: boolean;
  exportSettings: {
    defaultFormat: ExportFormat;
    allowMultipleFormats: boolean;
    reportLogo: string; // Base64 image
    selectedFields: string[]; // Colunas selecionadas para exportação
  };
  backupSettings: BackupSettings;
}

export enum CallStage {
  ABERTO = 'Aberto',
  EM_TRATAMENTO = 'Em Tratamento',
  RESOLVIDO = 'Resolvido',
  PENDENTE = 'Pendente',
  ENCAMINHADO = 'Encaminhado'
}

export enum Entity {
  CEDSIF = 'CEDSIF',
  DEFESA = 'DEFESA',
  CASA_MILITAR = 'CASA MILITAR',
  MININTER = 'MINISTERIO DO INTERIOR'
}

export enum CallType {
  DP = 'Deposito a Prazo',
  DP_ERRO = 'Deposito a Prazo - ERRO',
  DESC_SEM_BENEF = 'Desconto Sem Ter Beneficiado do credito',
  DESC_APOS_LIQ = 'Descontos Apos Liquidacao do Credito',
  DESC_APOS_MAT = 'Descontos Apos Maturidade do Credito',
  DESC_APOS_TOPUP = 'Descontos Apos Top-Up',
  DESC_INCORRETOS = 'Descontos incorrectos',
  DESC_INDEVIDOS = 'Descontos Indevidos / Restrutura',
  DUPLO_DESC = 'Duplo Desconto',
  COTACAO = 'Pedidos de Cotação',
  PLANO_AMORT = 'Plano de Amortização',
  ABERTURA_CONTAS = 'Processo de Abertura de Contas',
  REMEDIACAO = 'Remediação de Contas',
  REMOÇÃO_DIGITAL = 'Remoção de Impressão Digital',
  RESTRUTURA_CREDITO = 'Restruturação de Crédito',
  OUTRO = 'Outro'
}

export enum Shift {
  PRIMEIRO = '1º Turno (08:00-17:00)',
  SEGUNDO = '2º Turno (16:00-23:30)',
  TERCEIRO = '3º Turno (23:30-08:00)'
}

export interface CallRecord {
  id: string;
  nuit: string;
  cliente: string;
  entidade: Entity | string;
  agencia: string;
  estagio: CallStage;
  data: string;
  contacto: string;
  agenteId: string;
  agenteNome: string;
  tipoPedido: CallType;
  outroTipoPedido?: string;
  whatsapp: boolean;
  turno: Shift;
  observacoes: string;
  departamento?: string;
  prioridade?: 'Normal' | 'Alta';
  direcao?: 'Entrada' | 'Saída' | 'Perdida';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}
