
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CallRecord, User, UserRole, CallType, SystemConfig, CallStage, ExportFormat } from '../types';
import { formatDate, handleExport, formatName, formatPhone, formatObservations, toTitleCase } from '../utils';
import { ICONS, CALL_STAGES, CALL_TYPES } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import CallForm from './CallForm';

interface CallListProps {
  calls: CallRecord[];
  user: User;
  users: User[];
  systemConfig: SystemConfig;
  onDeleteCall: (id: string) => void;
  onUpdateCall: (record: CallRecord) => void;
}

const CallList: React.FC<CallListProps> = ({ calls = [], user, users = [], systemConfig, onDeleteCall, onUpdateCall }) => {
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

  // Paginação - limitar a 10 linhas por padrão
  const [showAllRecords, setShowAllRecords] = useState(false);
  const RECORDS_LIMIT = 10;

  // Proteção contra calls undefined
  const safeCalls = useMemo(() => Array.isArray(calls) ? calls : [], [calls]);

  const filteredCalls = useMemo(() => {
    // DEBUG: Mostrando tudo temporariamente para confirmar se os dados existem
    // DEBUG DE IDs
    if (user.role !== UserRole.ADMIN) {
      console.log('DEBUG FILTRO:', {
        meuId: user.id.toString(),
        totalChamadas: safeCalls.length,
        chamadasDesteAgente: safeCalls.filter(c => c.agenteId == user.id || c.agenteId == user.id.toString()).length,
        exemploChamada: safeCalls[0] ? { id: safeCalls[0].agenteId, tipo: typeof safeCalls[0].agenteId } : 'sem chamadas'
      });
    }

    // FILTRO BLINDADO: Verifica por ID (string/num) OU por Nome
    let result = user.role === UserRole.ADMIN
      ? safeCalls
      : safeCalls.filter(c => {
        const matchId = String(c.agenteId) === String(user.id);
        const matchName = c.agenteNome === user.name;
        return matchId || matchName;
      });
    // Filtro de Texto Seguro (Case Insensitive)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase().trim();
      result = result.filter(c => {
        try {
          return (c.cliente?.toLowerCase() || '').includes(lower) ||
            (c.contacto?.toLowerCase() || '').includes(lower) ||
            (c.nuit?.toLowerCase() || '').includes(lower) ||
            (c.observacoes?.toLowerCase() || '').includes(lower) ||
            (c.outroTipoPedido?.toLowerCase() || '').includes(lower) ||
            (c.agenteNome?.toLowerCase() || '').includes(lower);
        } catch (e) {
          console.error("Erro no filtro:", e);
          return false;
        }
      });
    }

    if (filterStage) result = result.filter(c => c.estagio === filterStage);
    if (filterType) result = result.filter(c => c.tipoPedido === filterType);
    if (filterAgent) result = result.filter(c => c.agenteId.toString() === filterAgent);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(c => c.data && new Date(c.data) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(c => c.data && new Date(c.data) <= end);
    }

    return result;
  }, [safeCalls, user, searchTerm, filterStage, filterType, filterAgent, startDate, endDate]);

  // Calcular posição do dropdown quando abrir
  useEffect(() => {
    if (showExportMenu && exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 192 // 192px = w-48
      });
    }
  }, [showExportMenu]);

  const handleExportClick = (format: ExportFormat) => {
    if (filteredCalls.length === 0) {
      alert("Não existem dados para exportar.");
      return;
    }
    setSelectedFormat(format);
    setIsExportModalOpen(true);
    setShowExportMenu(false);
  };

  const [exportMode, setExportMode] = useState<'consolidated' | 'segmented'>('consolidated');

  const confirmExport = async () => {
    setIsExporting(true);
    setIsExportModalOpen(false);

    try {
      if (selectedFormat === 'XLS') {
        console.log('🚀 Iniciando download robusto via backend com filtros...');

        // Construir query string de filtros
        const params = new URLSearchParams({
          searchTerm,
          startDate,
          endDate,
          filterStage,
          filterType,
          filterAgent,
          fields: (systemConfig.exportSettings.selectedFields || []).join(','),
          format: selectedFormat,
          exportMode // Adicionado parâmetro de modo
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
        let filename = `RELATÓRIO DE CHAMADA - Relatorio de chamada - ${new Date().toISOString().slice(0, 10)}.${extension}`;

        if (contentDisposition) {
          // Tentar vários padrões de extração
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
            console.log('✅ Nome extraído do header:', filename);
          }
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
        // Outros formatos usam a função original
        await new Promise(resolve => setTimeout(resolve, 1000));
        handleExport(selectedFormat, filteredCalls, systemConfig);
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

  const confirmDelete = () => {
    if (recordToDelete) {
      onDeleteCall(recordToDelete);
    }
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
  };

  const openEditModal = (record: CallRecord) => {
    setRecordToEdit(record);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (formData: any) => {
    if (recordToEdit) {
      onUpdateCall({
        ...recordToEdit,
        ...formData
      });
    }
    setIsEditModalOpen(false);
    setRecordToEdit(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStage('');
    setFilterType('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = searchTerm || filterStage || filterType || startDate || endDate;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Modal de Exportação */}
      <ConfirmationModal
        isOpen={isExportModalOpen}
        title={`Exportar em ${selectedFormat}`}
        message={
          <div className="space-y-4">
            <p>Deseja processar a exportação de <strong>{filteredCalls.length}</strong> registos?</p>

            {['XLS', 'XLSX'].includes(selectedFormat || '') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modo de Exportação:</p>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${exportMode === 'consolidated' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {exportMode === 'consolidated' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input type="radio" name="exportMode" value="consolidated" checked={exportMode === 'consolidated'} onChange={() => setExportMode('consolidated')} className="hidden" />
                  <div>
                    <span className={`block text-sm font-bold ${exportMode === 'consolidated' ? 'text-indigo-900' : 'text-slate-600'}`}>Consolidado (Aba Única)</span>
                    <span className="text-[10px] text-slate-400">Gera um ficheiro com todos os registos numa única lista cronológica.</span>
                  </div>
                </label>

                <div className="h-px bg-slate-200" />

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${exportMode === 'segmented' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {exportMode === 'segmented' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <input type="radio" name="exportMode" value="segmented" checked={exportMode === 'segmented'} onChange={() => setExportMode('segmented')} className="hidden" />
                  <div>
                    <span className={`block text-sm font-bold ${exportMode === 'segmented' ? 'text-indigo-900' : 'text-slate-600'}`}>Segmentado (Por Dia)</span>
                    <span className="text-[10px] text-slate-400">Gera um ficheiro com múltiplas abas, separando os registos por dia.</span>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
          </svg>
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
      {isEditModalOpen && recordToEdit && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 my-auto">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Editar Registo Operacional</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: {recordToEdit.id}</p>
                </div>
                <button
                  onClick={() => { setIsEditModalOpen(false); setRecordToEdit(null); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-all shadow-sm"
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
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
              className="w-full pl-12 pr-6 py-4 rounded-xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-indigo-500/30 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-400 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <input type="date" className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/50 outline-none font-bold text-slate-700 text-[10px] uppercase" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/50 outline-none font-bold text-slate-700 text-[10px] uppercase" value={endDate} onChange={e => setEndDate(e.target.value)} />

            <select className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/50 outline-none font-black text-[10px] uppercase text-slate-600" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="">ESTÁGIOS</option>
              {CALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/50 outline-none font-black text-[10px] uppercase text-slate-600" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">TIPOLOGIAS</option>
              {CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="w-full px-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/50 outline-none font-black text-[10px] uppercase text-slate-600" value={filterAgent} onChange={e => setFilterAgent(e.target.value)}>
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

        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registos: <span className="text-indigo-600">{filteredCalls.length}</span></span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">Limpar Filtros</button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredCalls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data / Turno</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Classificação</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agente</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">WA</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(showAllRecords ? filteredCalls : filteredCalls.slice(0, RECORDS_LIMIT)).map(call => (
                  <tr key={call.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800 text-xs">{call.data ? formatDate(call.data).split(',')[0] : '--'}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{(call.turno || '').split(' ')[0]}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-800 tracking-tight text-xs group-hover:text-indigo-600 transition-colors">{formatName(call.cliente) || 'Sem Cliente'}</p>
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
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase tracking-widest w-fit max-w-[150px] truncate">
                          {call.tipoPedido === CallType.OUTRO ? call.outroTipoPedido : call.tipoPedido}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit border ${call.estagio === CallStage.RESOLVIDO ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>{call.estagio}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">{call.agenteNome}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{call.agencia}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {call.whatsapp ? (
                        <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center mx-auto shadow shadow-emerald-500/20">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.3.045-.691.076-1.127-.064-.265-.085-.595-.19-.99-.356-1.677-.706-2.771-2.415-2.854-2.527-.084-.112-.681-.905-.681-1.725 0-.82.43-.122.583-.284.153-.162.334-.203.446-.203.112 0 .223 0 .32.005.102.005.24.039.375.365.139.335.474 1.157.516 1.241.041.084.069.182.014.295-.056.112-.084.182-.167.28-.084.098-.176.218-.251.295-.084.084-.173.176-.075.344.098.168.435.719.935 1.165.642.573 1.182.751 1.35.836.168.084.266.07.364-.042.098-.112.42-.489.531-.656.112-.168.223-.14.375-.084.152.056.963.454 1.13.538.168.084.279.126.32.196.042.07.042.405-.102.81z" /></svg>
                        </div>
                      ) : (
                        <span className="text-slate-200 text-[10px] font-black">---</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(call)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Registo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(call.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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

            {/* Botão Ver Todos / Ver Menos */}
            {filteredCalls.length > RECORDS_LIMIT && (
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
                <button
                  onClick={() => setShowAllRecords(!showAllRecords)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  {showAllRecords ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span>Mostrar Menos</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>Ver Todos ({filteredCalls.length} registos)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum registo encontrado</p>
          </div>
        )}
      </div>

      {/* Dropdown Menu (Portal-style com position fixed) */}
      {showExportMenu && !isExporting && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowExportMenu(false)}
          />
          {/* Menu */}
          <div
            className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`
            }}
          >
            {['XLS', 'CSV', 'PDF', 'JSON', 'XML'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExportClick(fmt as ExportFormat)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 font-bold text-xs text-slate-700 first:rounded-t-xl last:rounded-b-xl transition-colors border-b last:border-0 border-slate-50"
              >
                Exportar como {fmt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CallList;
