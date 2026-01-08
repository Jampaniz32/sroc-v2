
import React from 'react';
import { CallStage, CallType, Entity } from './types';

// Manter arrays independentes dos Enums para evitar Temporal Dead Zone (TDZ) no build de produção
export const CALL_STAGES = ['Aberto', 'Em Tratamento', 'Resolvido', 'Pendente', 'Encaminhado'];
export const CALL_TYPES = [
  'Desconto Sem Ter Beneficiado do credito',
  'Descontos Apos Liquidacao do Credito',
  'Descontos Apos Maturidade do Credito',
  'Descontos Apos Top-Up',
  'Descontos incorrectos',
  'Descontos Indevidos / Restrutura',
  'Duplo Desconto',
  'Pedidos de Cotação',
  'Plano de Amortização',
  'Restruturação de Crédito',
  'Plano de pagamento',
  'Financiamento',
  'Maturidade do Crédito',
  'Carta de Quitação',
  'Exposição Escrita',
  'Outro'
];
export const ENTITIES = ['CEDSIF', 'DEFESA', 'CASA MILITAR', 'MINISTERIO DO INTERIOR'];

export const AGENCIES = [
  "AgencyB Lichinga",
  "AgencyB Maxixe",
  "AgencyB Pemba",
  "AgencyB Xai-xai",
  "Beira",
  "Chimoio",
  "Dondo",
  "Gurue",
  "Manica",
  "Maputo",
  "Matendene",
  "Matola",
  "Mocuba",
  "Nacala",
  "Nampula",
  "Quelimane",
  "Sede",
  "Tete"
];

export const TIMEZONES = [
  "Africa/Maputo (GMT+2)",
  "Africa/Johannesburg (GMT+2)",
  "Europe/Lisbon (GMT+0)",
  "UTC"
];

export const DATE_FORMATS = [
  "DD/MM/YYYY HH:mm",
  "YYYY-MM-DD HH:mm",
  "DD-MM-YYYY"
];

export const FIXED_DIRECTIONS = ["Entrada", "Saída", "Perdida"];
export const FIXED_STATUS = ["Nova", "Em atendimento", "Encerrada"];
export const FIXED_PRIORITIES = ["Normal", "Alta"];

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
);

const CallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

export const ICONS = {
  Dashboard: DashboardIcon,
  Call: CallIcon,
  Users: UsersIcon,
  Settings: SettingsIcon,
  Export: ExportIcon,
  Logout: LogoutIcon,
  Plus: PlusIcon
};
