
import { Shift, CallRecord, SystemConfig, ExportFormat, User } from './types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ============================================
// FORMATAÇÃO E NORMALIZAÇÃO DE TEXTO
// ============================================

/**
 * Mapa de caracteres problemáticos para correção de encoding
 * Corrige problemas como ?? ou caracteres mal codificados
 */
const CHAR_REPLACEMENTS: Record<string, string> = {
  // Sequências complexas primeiro (mais específicas)
  'Amortiza????o': 'Amortização',
  'AMORTIZA????O': 'AMORTIZAÇÃO',
  'Restrutura????o': 'Restruturação',
  'RESTRUTURA????O': 'RESTRUTURAÇÃO',
  'Cota????o': 'Cotação',
  'COTA????O': 'COTAÇÃO',
  'Cr??dito': 'Crédito',
  'CR??DITO': 'CRÉDITO',
  'Informa????es': 'Informações',
  'INFORMA????ES': 'INFORMAÇÕES',
  'Manuten????o': 'Manutenção',
  'MANUTEN????O': 'MANUTENÇÃO',
  'Aprova????o': 'Aprovação',
  'APROVA????O': 'APROVAÇÃO',
  'Solicita????o': 'Solicitação',
  'SOLICITA????O': 'SOLICITAÇÃO',
  'Liquida????o': 'Liquidação',
  'LIQUIDA????O': 'LIQUIDAÇÃO',
  '????o': 'ção',
  '????O': 'ÇÃO',
  '????': 'çã',

  // Mapeamentos individuais
  'Ã§Ã£o': 'ção',
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ãµ': 'õ',
  'Ã¢': 'â',
  'Ãª': 'ê',
  'Ã´': 'ô',
  'Ã€': 'À',
  'Ã‰': 'É',
  'Ã"': 'Ó',
  'Âº': 'º',
  'Âª': 'ª',
  '??': 'ã', // Fallback genérico (pode ser impreciso, mas foi solicitado)
};

/**
 * Palavras que devem permanecer em minúsculas (preposições, artigos, etc.)
 * Exceto quando são a primeira palavra da frase
 */
const LOWERCASE_WORDS = ['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'em', 'para', 'por', 'com', 'a', 'o', 'as', 'os'];

/**
 * Corrige problemas de encoding e caracteres especiais
 */
export const fixEncoding = (text: string | undefined | null): string => {
  if (!text) return '';

  let result = text;

  // Aplicar substituições de caracteres problemáticos usando substituição literal (split/join)
  // para evitar problemas com caracteres especiais de Regex (como ?)
  for (const [bad, good] of Object.entries(CHAR_REPLACEMENTS)) {
    result = result.split(bad).join(good);
  }

  return result;
};

/**
 * Converte texto para Title Case (Primeira Letra Maiúscula)
 * Respeita preposições e artigos em minúsculas, exceto no início
 */
export const toTitleCase = (text: string | undefined | null): string => {
  if (!text) return '';

  // Primeiro, corrigir encoding
  const fixed = fixEncoding(text);

  // Converter para minúsculas e dividir em palavras
  const words = fixed.toLowerCase().trim().split(/\s+/);

  // Processar cada palavra
  const formatted = words.map((word, index) => {
    // Primeira palavra sempre com maiúscula
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Preposições e artigos em minúsculas
    if (LOWERCASE_WORDS.includes(word)) {
      return word;
    }

    // Outras palavras com primeira letra maiúscula
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  return formatted.join(' ');
};

/**
 * Formata nome de pessoa (Title Case completo)
 * Ex: "JOÃO SILVA" -> "João Silva"
 * Ex: "maria da conceição" -> "Maria da Conceição"
 */
export const formatName = (name: string | undefined | null): string => {
  return toTitleCase(name);
};

/**
 * Formata número de telefone (remove espaços extras, mantém formatação)
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '';

  // Remover espaços extras e caracteres inválidos
  let cleaned = phone.replace(/[^\d+\s()-]/g, '').trim();

  // Normalizar espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned;
};

/**
 * Formata NUIT (apenas dígitos)
 */
export const formatNuit = (nuit: string | undefined | null): string => {
  if (!nuit) return '';
  return nuit.replace(/\D/g, '').trim();
};

/**
 * Formata observações (corrige encoding, normaliza espaços, aplica Title Case)
 */
export const formatObservations = (text: string | undefined | null): string => {
  if (!text) return '';

  // O utilizador solicitou que TODOS os campos (incluindo observações) 
  // sigam o padrão: Primeira Letra Maiúscula de cada palavra e demais minúsculas.
  return toTitleCase(text);
};

/**
 * Aplica todas as formatações a um objeto de formulário
 */
export const formatFormData = (data: any): any => {
  return {
    ...data,
    nuit: formatNuit(data.nuit),
    cliente: formatName(data.cliente),
    entidade: data.entidade ? toTitleCase(data.entidade) : data.entidade,
    agencia: data.agencia ? toTitleCase(data.agencia) : data.agencia,
    contacto: formatPhone(data.contacto),
    observacoes: formatObservations(data.observacoes),
    outroTipoPedido: data.outroTipoPedido ? toTitleCase(data.outroTipoPedido) : data.outroTipoPedido,
  };
};


export const getCurrentShift = (): Shift => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 480 && totalMinutes < 960) {
    return Shift.PRIMEIRO;
  } else if (totalMinutes >= 960 && totalMinutes < 1410) {
    return Shift.SEGUNDO;
  } else {
    return Shift.TERCEIRO;
  }
};

export const formatDate = (isoString: string): string => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Maputo'
  });
};

const escapeHTML = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    await Notification.requestPermission();
  }
};

export const sendPushNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/566/566087.png'
    });
  }
};

export const playNotificationSound = (type: 'default' | 'whatsapp' = 'default') => {
  try {
    const sounds = {
      default: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      whatsapp: 'https://cdn.pixabay.com/audio/2022/10/16/audio_1070fc6591.mp3' // Som estilo "ping/pop" leve
    };

    const audio = new Audio(sounds[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn('Falha ao reproduzir áudio (interação necessária):', e));
  } catch (e) {
    console.error('Erro ao tocar som:', e);
  }
};

// --- CONFIGURAÇÃO DE COLUNAS DE EXPORTAÇÃO ---

const EXPORT_COLUMNS_MAP: Record<string, { label: string, getValue: (r: CallRecord) => string }> = {
  nuit: { label: 'NUIT', getValue: r => r.nuit || 'N/A' },
  cliente: { label: 'CLIENTE', getValue: r => r.cliente },
  entidade: { label: 'ENTIDADE', getValue: r => r.entidade },
  agencia: { label: 'AGÊNCIA', getValue: r => r.agencia },
  tipoPedido: { label: 'PEDIDO', getValue: r => `${r.tipoPedido}${r.outroTipoPedido ? ' (' + r.outroTipoPedido + ')' : ''}` },
  estagio: { label: 'ESTÁGIO', getValue: r => r.estagio },
  data: { label: 'DATA', getValue: r => formatDate(r.data) },
  turno: { label: 'TURNO', getValue: r => r.turno },
  contacto: { label: 'CONTACTO', getValue: r => r.contacto },
  agenteNome: { label: 'AGENTE', getValue: r => r.agenteNome },
  whatsapp: { label: 'WA', getValue: r => r.whatsapp ? 'SIM' : 'NÃO' },
  observacoes: { label: 'OBSERVAÇÕES', getValue: r => r.observacoes }
};

// --- MOTORES DE EXPORTAÇÃO ---

export const handleExport = (format: ExportFormat, data: CallRecord[], config: SystemConfig) => {
  switch (format) {
    case 'XLS': return exportToExcel(data, config);
    case 'CSV': return exportToCSV(data, config);
    case 'JSON': return exportToJSON(data, config);
    case 'XML': return exportToXML(data, config);
    case 'PDF': return exportToPDF(data, config);
    default: return exportToExcel(data, config);
  }
};

export const exportAuditPackage = (calls: CallRecord[], users: User[], config: SystemConfig) => {
  const auditData = {
    generatedAt: new Date().toISOString(),
    institution: config.institutionName,
    systemConfig: {
      timezone: config.timezone,
      departments: config.departments,
      backupSettings: config.backupSettings
    },
    operationalTeam: users.map(u => ({ id: u.id, name: u.name, role: u.role, agency: u.agency })),
    historicalData: calls
  };

  const json = JSON.stringify(auditData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, `AUDIT_LOG_${new Date().getTime()}.json`);
};

const exportToExcel = async (data: CallRecord[], config: SystemConfig) => {
  try {
    console.log('🚀 Iniciando exportação via backend...');
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
    const response = await fetch(`${baseUrl}/api/export`);

    if (!response.ok) throw new Error('Falha na exportação');

    // Obter nome do ficheiro do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    console.log('📋 Content-Disposition:', contentDisposition);

    let filename = `RELATÓRIO DE CHAMADA - ${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (contentDisposition) {
      const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (filenameStarMatch && filenameStarMatch[1]) {
        filename = decodeURIComponent(filenameStarMatch[1]);
      } else {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      console.log('✅ Nome processado:', filename);
    }

    console.log('📁 Nome final:', filename);
    const blob = await response.blob();
    console.log('💾 Blob:', blob.size, 'bytes');

    // Usar file-saver para garantir o nome correto
    saveAs(blob, filename);
    console.log('✅ saveAs chamado com:', filename);

  } catch (error) {
    console.error('❌ Erro ao exportar via backend', error);
    alert('Erro ao conectar com servidor de exportação');
  }
};

const exportToCSV = (data: CallRecord[], config: SystemConfig) => {
  const selectedFields = config.exportSettings.selectedFields && config.exportSettings.selectedFields.length > 0
    ? config.exportSettings.selectedFields
    : Object.keys(EXPORT_COLUMNS_MAP);

  const headers = selectedFields.map(fieldId => EXPORT_COLUMNS_MAP[fieldId].label);

  const csvContent = [
    headers.join(';'),
    ...data.map(r => {
      return selectedFields.map(fieldId => {
        const val = EXPORT_COLUMNS_MAP[fieldId].getValue(r);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(';');
    })
  ].join('\n');

  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `RELATÓRIO DE CHAMADA - ${new Date().toISOString().slice(0, 10)}.csv`);
};

const exportToJSON = (data: CallRecord[], config: SystemConfig) => {
  const json = JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      institution: config.institutionName,
      count: data.length
    },
    records: data
  }, null, 2);

  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, `RELATÓRIO DE CHAMADA - ${new Date().toISOString().slice(0, 10)}.json`);
};

const exportToXML = (data: CallRecord[], config: SystemConfig) => {
  const selectedFields = config.exportSettings.selectedFields && config.exportSettings.selectedFields.length > 0
    ? config.exportSettings.selectedFields
    : Object.keys(EXPORT_COLUMNS_MAP);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sroc_report>\n`;
  xml += `  <metadata>\n    <institution>${escapeHTML(config.institutionName)}</institution>\n    <date>${new Date().toISOString()}</date>\n  </metadata>\n`;
  xml += `  <records>\n`;

  data.forEach(r => {
    xml += `    <record id="${r.id}">\n`;
    selectedFields.forEach(fieldId => {
      const val = EXPORT_COLUMNS_MAP[fieldId].getValue(r);
      const tag = fieldId.toLowerCase();
      xml += `      <${tag}>${escapeHTML(val)}</${tag}>\n`;
    });
    xml += `    </record>\n`;
  });

  xml += `  </records>\n</sroc_report>`;

  const blob = new Blob([xml], { type: 'application/xml' });
  saveAs(blob, `RELATÓRIO DE CHAMADA - ${new Date().toISOString().slice(0, 10)}.xml`);
};

const exportToPDF = (data: CallRecord[], config: SystemConfig) => {
  window.print();
};
