import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CallRecord, User, UserRole, CallType, SystemConfig, CallStage, ExportFormat } from '../types';
import { formatDate, handleExport, formatName, formatPhone, formatObservations, toTitleCase } from '../utils';
import { ICONS, CALL_STAGES, CALL_TYPES } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import CallForm from './CallForm';
import { callsAPI } from '../services/api';

interface CallListProps {
  calls: CallRecord[]; // Managed globally for Dashboard, but CallList will now fetch its own paginated data
  user: User;
  users: User[];
  systemConfig: SystemConfig;
  onDeleteCall: (id: string) => void;
  onUpdateCall: (record: CallRecord) => void;
}

const CallList: React.FC<CallListProps> = ({ user, users = [], systemConfig, onDeleteCall, onUpdateCall }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Modais
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(systemConfig.exportSettings.defaultFormat);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<CallRecord | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  // Paginação Real
  const [paginatedCalls, setPaginatedCalls] = useState<CallRecord[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPaginatedCalls = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit,
        search: searchTerm,
        stage: filterStage,
        type: filterType,
        startDate,
        endDate
      };

      // Se não for admin, filtrar automaticamente pelo agente logado
      if (user.role !== UserRole.ADMIN) {
        params.agentId = user.id;
      } else if (filterAgent) {
        params.agentId = filterAgent;
      }

      const response = await callsAPI.getAll(params);
      setPaginatedCalls(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Erro ao buscar chamadas paginadas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPaginatedCalls();
    }, 300); // Debounce de 300ms para pesquisa

    return () => clearTimeout(timer);
  }, [page, limit, searchTerm, filterStage, filterType, filterAgent, startDate, endDate]);

  // Calcular posição do dropdown quando abrir
  useEffect(() => {
    if (showExportMenu && exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 2,
        left: rect.right - 192 // 192px = w-48
      });
    }
  }, [showExportMenu]);

  const handleExportClick = (format: ExportFormat) => {
    if (paginatedCalls.length === 0) {
      alert("Não existem dados para exportar.");
      return;
    }
    setSelectedFormat(format);
    setIsExportModalOpen(true);
    setShowExportMenu(false);
  };

  const [exportMode, setExportMode] = useState<'consolidated' | 'segmented' | 'custom_date'>('consolidated');
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState((new Date().getMonth() + 1).toString());
  const [exportDay, setExportDay] = useState('');

  const confirmExport = async () => {
    setIsExporting(true);
    setIsExportModalOpen(false);

    try {
      if (selectedFormat === 'XLS') {
        console.log('🚀 Iniciando download robusto via backend com filtros...');

        // Lógica para datas customizadas
        let finalStartDate = startDate;
        let finalEndDate = endDate;

        if (exportMode === 'custom_date') {
          const year = parseInt(exportYear.toString());
          const month = parseInt(exportMonth);

          if (exportDay) {
            // Exportar dia específico
            const day = parseInt(exportDay);
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            finalStartDate = dateStr;
            finalEndDate = dateStr;
          } else {
            // Exportar mês inteiro
            const lastDay = new Date(year, month, 0).getDate(); // Último dia do mês
            finalStartDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            finalEndDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
          }
        }

        // Construir query string de filtros
        const params = new URLSearchParams({
          search: searchTerm,
          startDate: finalStartDate,
          endDate: finalEndDate,
          stage: filterStage,
          type: filterType,
          agentId: user.role === UserRole.ADMIN ? filterAgent : user.id.toString(),
          fields: (systemConfig.exportSettings.selectedFields || []).join(','),
          format: selectedFormat,
          exportMode: exportMode === 'custom_date' ? 'consolidated' : exportMode // Backend não precisa saber do custom_date, apenas recebe as datas filtradas
        });

        // Fetch o ficheiro do backend com filtros
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
        const response = await fetch(`${baseUrl}/api/export?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        // Extrair nome do ficheiro do header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        console.log('📋 Content-Disposition:', contentDisposition);

        const extension = selectedFormat === 'CSV' ? 'csv' : 'xlsx';
        let filename = `RELATÓRIO DE CHAMADA - ${new Date().toISOString().slice(0, 10)}.${extension}`;

        if (contentDisposition) {
          // Tentar extrair filename* (UTF-8) primeiro, depois filename padrão
          const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
          if (filenameStarMatch && filenameStarMatch[1]) {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } else {
            const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }
          console.log('✅ Nome processado do header:', filename);
        }

        console.log('📁 Nome final do ficheiro:', filename);

        // Converter response para blob
        const blob = await response.blob();
        console.log('💾 Blob recebido:', blob.size, 'bytes');

        // Criar URL temporário para o blob
        const blobUrl = window.URL.createObjectURL(blob);

        // Criar elemento <a> temporário
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = blobUrl;
        link.download = filename; // FORÇA o nome do ficheiro

        // Adicionar ao DOM, clicar e remover
        document.body.appendChild(link);
        link.click();

        // Limpeza após breve delay
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          console.log('✅ Download concluído e recursos libertados');
        }, 100);

      } else {
        // Para outros formatos
        handleExport(selectedFormat, paginatedCalls, systemConfig);
      }
    } catch (error) {
      console.error('❌ Erro na exportação:', error);
      alert('Erro ao exportar ficheiro: ' + error);
    } finally {
      setIsExporting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      await onDeleteCall(recordToDelete);
      fetchPaginatedCalls();
    }
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
  };

  const openEditModal = (record: CallRecord) => {
    setRecordToEdit(record);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: any) => {
    if (recordToEdit) {
      await onUpdateCall({
        ...recordToEdit,
        ...formData
      });
      fetchPaginatedCalls();
    }
    setIsEditModalOpen(false);
    setRecordToEdit(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStage('');
    setFilterType('');
    setFilterAgent('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = searchTerm || filterStage || filterType || filterAgent || startDate || endDate;

  // Cálculo do texto de resumo
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Modal de Exportação */}
      <ConfirmationModal
        isOpen={isExportModalOpen}
        title={`Exportar em ${selectedFormat}`}
        message={
          <div className="space-y-4">
            <p>Deseja processar a exportação de <strong>{total}</strong> registos?</p>

            {['XLS', 'XLSX'].includes(selectedFormat || '') && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modo de Exportação:</p>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${exportMode === 'consolidated' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {exportMode === 'consolidated' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input type="radio" name="exportMode" value="consolidated" checked={exportMode === 'consolidated'} onChange={() => setExportMode('consolidated')} className="hidden" />
                  <div>
                    <span className={`block text-xs font-bold ${exportMode === 'consolidated' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'}`}>Consolidado (Aba Única)</span>
                    <span className="text-[9px] text-slate-400">Gera um ficheiro com todos os registos numa única lista cronológica.</span>
                  </div>
                </label>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${exportMode === 'segmented' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {exportMode === 'segmented' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input type="radio" name="exportMode" value="segmented" checked={exportMode === 'segmented'} onChange={() => setExportMode('segmented')} className="hidden" />
                  <div>
                    <span className={`block text-xs font-bold ${exportMode === 'segmented' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'}`}>Segmentado (Por Dia)</span>
                    <span className="text-[9px] text-slate-400">Gera um ficheiro com múltiplas abas, separando os registos por dia.</span>
                  </div>
                </label>

                <div className="h-px bg-slate-200 dark:bg-slate-700" />

                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${exportMode === 'custom_date' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {exportMode === 'custom_date' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input type="radio" name="exportMode" value="custom_date" checked={exportMode === 'custom_date'} onChange={() => setExportMode('custom_date')} className="hidden" />
                  <div className="w-full">
                    <span className={`block text-xs font-bold ${exportMode === 'custom_date' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-300'}`}>Filtrar por Data (Dia/Mês/Ano)</span>
                    <span className="text-[9px] text-slate-400 block mb-1">Exporta registos de uma data específica ou mês completo.</span>

                    {exportMode === 'custom_date' && (
                      <div className="grid grid-cols-3 gap-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                        <select
                          className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-[10px] font-bold bg-white dark:bg-slate-700 outline-none focus:border-indigo-500"
                          value={exportDay}
                          onChange={e => setExportDay(e.target.value)}
                        >
                          <option value="">Dia (Todos)</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <select
                          className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-[10px] font-bold bg-white dark:bg-slate-700 outline-none focus:border-indigo-500"
                          value={exportMonth}
                          onChange={e => setExportMonth(e.target.value)}
                        >
                          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-[10px] font-bold bg-white dark:bg-slate-700 outline-none focus:border-indigo-500"
                          value={exportYear}
                          onChange={e => setExportYear(parseInt(e.target.value))}
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}

            <p className="text-xs text-slate-400 italic">Esta operação incluirá o logótipo configurado e respeitará os filtros atuais.</p>
          </div>
        }
        confirmLabel="Confirmar Exportação"
        cancelLabel="Voltar"
        onConfirm={confirmExport}
        onCancel={() => setIsExportModalOpen(false)}
        icon={
          < svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1.01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
          </svg >
        }
      />

      {/* Modal de Eliminação */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Registo"
        message="Tem a certeza que deseja eliminar permanentemente este registo de chamada? Esta ação não pode ser revertida."
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />

      {/* Modal de Edição */}
      {
        isEditModalOpen && recordToEdit && (
          <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 animate-in zoom-in-95 duration-200 my-auto">
                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Editar Registo Operacional</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Ref: {recordToEdit.id}</p>
                  </div>
                  <button
                    onClick={() => { setIsEditModalOpen(false); setRecordToEdit(null); }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-all shadow-sm"
                  >✕</button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <CallForm
                    user={user}
                    onAdd={handleUpdate}
                    initialData={recordToEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Pesquisar por cliente, contacto, NUIT ou observações..."
              className="w-full pl-12 pr-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/30 transition-all outline-none font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <input type="date" className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 outline-none font-bold text-slate-700 dark:text-slate-200 text-[10px] uppercase" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
            <input type="date" className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 outline-none font-bold text-slate-700 dark:text-slate-200 text-[10px] uppercase" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />

            <select className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 outline-none font-black text-[10px] uppercase text-slate-600 dark:text-slate-300" value={filterStage} onChange={e => { setFilterStage(e.target.value); setPage(1); }}>
              <option value="">ESTÁGIOS</option>
              {CALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 outline-none font-black text-[10px] uppercase text-slate-600 dark:text-slate-300" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">TIPOLOGIAS</option>
              {CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 outline-none font-black text-[10px] uppercase text-slate-600 dark:text-slate-300" disabled={user.role !== UserRole.ADMIN} value={user.role !== UserRole.ADMIN ? user.id.toString() : filterAgent} onChange={e => { setFilterAgent(e.target.value); setPage(1); }}>
              <option value="">AGENTES</option>
              {users.filter(u => u.role === UserRole.AGENTE || u.role === UserRole.ADMIN).map(u => (
                <option key={u.id} value={u.id.toString()}>{u.name}</option>
              ))}
            </select>

            <div className="relative">
              <button
                ref={exportButtonRef}
                disabled={isExporting}
                onClick={() => systemConfig.exportSettings.allowMultipleFormats ? setShowExportMenu(!showExportMenu) : handleExportClick(systemConfig.exportSettings.defaultFormat)}
                className={`w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-[10px] uppercase tracking-widest ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isExporting ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" /></svg>
                )}
                <span>{isExporting ? 'A Exportar...' : `Exportar ${systemConfig.exportSettings.allowMultipleFormats ? '' : (systemConfig.exportSettings.defaultFormat || 'XLS')}`}</span>
                {systemConfig.exportSettings.allowMultipleFormats && !isExporting && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registos: <span className="text-indigo-600">{total}</span></span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Limpar Filtros</button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Carregando...</p>
          </div>
        ) : paginatedCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data / Turno</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Classificação</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agência</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">WhatsApp</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agente</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {paginatedCalls.map(call => (
                  <tr key={call.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all group">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{call.data ? formatDate(call.data).split(',')[0] : '--'}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-tighter">{(call.turno || '').split(' ')[0]}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-800 dark:text-slate-100 tracking-tight text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{formatName(call.cliente) || 'Sem Cliente'}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[9px] text-indigo-500 font-bold">{call.nuit || 'S/ NUIT'}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{formatPhone(call.contacto) || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-[250px] leading-relaxed italic">{formatObservations(call.observacoes) || ''}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[8px] font-black uppercase tracking-widest w-fit max-w-[150px] truncate">
                          {call.tipoPedido === CallType.OUTRO ? call.outroTipoPedido : call.tipoPedido}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit border ${call.estagio === CallStage.RESOLVIDO ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>{call.estagio}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{call.agencia}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {call.whatsapp ? 'SIM' : 'NÃO'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{call.agenteNome}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(call)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                          title="Editar Registo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(call.id)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                          title="Eliminar Registo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Mostrando {start}–{end} de {total} registros
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    <span>Anterior</span>
                  </div>
                </button>

                <div className="flex items-center gap-1 mx-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Mostrar apenas algumas páginas se houver muitas
                    if (totalPages > 5 && Math.abs(pageNum - page) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                      if (Math.abs(pageNum - page) === 3) return <span key={pageNum} className="text-slate-400">...</span>;
                      return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${page === pageNum
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page === totalPages || total === 0 || isLoading}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>Próximo</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum registo encontrado</p>
          </div>
        )}
      </div>

      {/* Dropdown Menu (Portal-style com position fixed) */}
      {
        showExportMenu && !isExporting && (
          <>
            {/* Backdrop para fechar ao clicar fora */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowExportMenu(false)}
            />
            {/* Menu */}
            <div
              className="fixed w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[9999]"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`
              }}
            >
              {['XLS', 'CSV', 'PDF', 'JSON', 'XML'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExportClick(fmt as ExportFormat)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 first:rounded-t-xl last:rounded-b-xl transition-colors border-b last:border-0 border-slate-50 dark:border-slate-700"
                >
                  Exportar como {fmt}
                </button>
              ))}
            </div>
          </>
        )
      }
    </div >
  );
};

export default CallList;
