
import React, { useState } from 'react';
import { SystemConfig, User, CallRecord, ExportFormat } from '../types';
import { TIMEZONES, DATE_FORMATS } from '../constants';
import { exportAuditPackage, requestNotificationPermission, sendPushNotification, playNotificationSound } from '../utils';
import UserManagement from './UserManagement';
import ObservationTemplatesManager from './ObservationTemplatesManager';
import BackupSettings from './BackupSettings';

interface SettingsProps {
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => void;
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  calls: CallRecord[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdate, users, onAddUser, onUpdateUser, onDeleteUser, calls, showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'atendimento' | 'interface' | 'exportacao' | 'equipa' | 'templates' | 'backup' | 'seguranca'>('geral');
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [newDept, setNewDept] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const availableExportFields = [
    { id: 'nuit', label: 'NUIT' },
    { id: 'cliente', label: 'Nome do Cliente' },
    { id: 'entidade', label: 'Entidade' },
    { id: 'agencia', label: 'Agência' },
    { id: 'tipoPedido', label: 'Tipo de Pedido' },
    { id: 'estagio', label: 'Estágio/Estado' },
    { id: 'data', label: 'Data do Registo' },
    { id: 'turno', label: 'Turno Operacional' },
    { id: 'contacto', label: 'Telemóvel/Contacto' },
    { id: 'agenteNome', label: 'Nome do Agente' },
    { id: 'whatsapp', label: 'Canal WhatsApp' },
    { id: 'observacoes', label: 'Observações' }
  ];

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onUpdate(localConfig);
    setIsSaving(false);
  };

  const handleSystemLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({
          ...prev,
          logo: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        // Atualizar estado local
        setLocalConfig(prev => ({
          ...prev,
          exportSettings: {
            ...prev.exportSettings,
            reportLogo: base64
          }
        }));

        // Enviar para o backend para persistência no banco (para uso no ExcelJS)
        try {
          const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
          await fetch(`${baseUrl}/api/config/logo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoBase64: base64 })
          });
          console.log('✅ Logo de exportação salvo no servidor');
        } catch (error) {
          console.error('❌ Erro ao salvar logo no servidor:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleExportField = (fieldId: string) => {
    setLocalConfig(prev => {
      const fields = prev.exportSettings.selectedFields || [];
      const newFields = fields.includes(fieldId)
        ? fields.filter(id => id !== fieldId)
        : [...fields, fieldId];

      return {
        ...prev,
        exportSettings: {
          ...prev.exportSettings,
          selectedFields: newFields
        }
      };
    });
  };

  const addDepartment = () => {
    if (newDept && !localConfig.departments.includes(newDept)) {
      setLocalConfig(prev => ({
        ...prev,
        departments: [...prev.departments, newDept]
      }));
      setNewDept('');
    }
  };

  const removeDepartment = (dept: string) => {
    setLocalConfig(prev => ({
      ...prev,
      departments: prev.departments.filter(d => d !== dept)
    }));
  };

  const toggleField = (field: keyof SystemConfig['fieldVisibility']) => {
    setLocalConfig(prev => ({
      ...prev,
      fieldVisibility: {
        ...prev.fieldVisibility,
        [field]: !prev.fieldVisibility[field]
      }
    }));
  };

  const handleAuditExport = () => {
    exportAuditPackage(calls, users, localConfig);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">

      <aside className="w-full lg:w-64 space-y-2 shrink-0">
        {[
          { id: 'geral', label: 'Geral', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          { id: 'atendimento', label: 'Atendimento', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
          { id: 'interface', label: 'Interface', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
          { id: 'exportacao', label: 'Exportação', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z' },
          { id: 'equipa', label: 'Utilizadores', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { id: 'templates', label: 'Templates', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'backup', label: 'Backup & Retenção', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { id: 'seguranca', label: 'Segurança', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`w-full flex items-center space-x-3 px-5 py-3.5 rounded-xl font-bold transition-all text-sm ${activeSubTab === tab.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}

        <div className="pt-6">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center space-x-3`}
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isSaving ? 'A Gravar...' : 'Gravar Alterações'}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 space-y-6 pb-10">

        {activeSubTab === 'geral' && (
          <section className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Identidade Corporativa</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Marca e configurações regionais</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logótipo do Sistema</label>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 p-8 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 group hover:border-indigo-300 transition-colors">
                    <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-inner shrink-0 p-2">
                      {localConfig.logo ? (
                        <img
                          src={localConfig.logo}
                          className="w-auto h-auto max-w-full max-h-full object-contain"
                          alt="Preview"
                        />
                      ) : (
                        <div className="font-black text-4xl text-slate-100">S</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4 text-center sm:text-left">
                      <div>
                        <p className="text-xs font-black text-slate-600 uppercase tracking-tight">Dimensionamento Automático</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                          O sistema calculará automaticamente o tamanho ideal para a Sidebar (máx. 140x50px) e Ecrã de Login (máx. 200x100px). Utilize imagens com fundo transparente.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <input
                          type="file"
                          accept="image/*"
                          id="system-logo-upload"
                          className="hidden"
                          onChange={handleSystemLogoUpload}
                        />
                        <label
                          htmlFor="system-logo-upload"
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
                        >
                          Carregar Nova Imagem
                        </label>
                        {localConfig.logo && (
                          <button
                            onClick={() => setLocalConfig({ ...localConfig, logo: '' })}
                            className="px-6 py-3 bg-white text-rose-500 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Organização</label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700"
                    value={localConfig.institutionName}
                    onChange={e => setLocalConfig({ ...localConfig, institutionName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fuso Horário Operacional</label>
                  <div className="relative">
                    <select
                      className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold text-slate-700 appearance-none"
                      value={localConfig.timezone}
                      onChange={e => setLocalConfig({ ...localConfig, timezone: e.target.value })}
                    >
                      {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSubTab === 'exportacao' && (
          <section className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Exportação de Dados</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações de relatórios e seleção de colunas</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logótipo dos Relatórios</label>
                <div className="flex items-center space-x-6 p-6 border-2 border-dashed border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-24 h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                    {localConfig.exportSettings.reportLogo ? (
                      <img src={localConfig.exportSettings.reportLogo} className="w-full h-full object-contain" alt="Report Logo" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Este logótipo aparecerá apenas nos cabeçalhos dos ficheiros exportados.</p>
                    <input
                      type="file"
                      accept="image/*"
                      id="export-logo-upload"
                      className="hidden"
                      onChange={handleExportLogoUpload}
                    />
                    <label
                      htmlFor="export-logo-upload"
                      className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-indigo-700"
                    >
                      Carregar Marca de Relatório
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campos para Exportação</label>
                  <button
                    onClick={() => setLocalConfig(prev => ({
                      ...prev,
                      exportSettings: { ...prev.exportSettings, selectedFields: availableExportFields.map(f => f.id) }
                    }))}
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    Selecionar Todos
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableExportFields.map(field => {
                    const isSelected = (localConfig.exportSettings.selectedFields || []).includes(field.id);
                    return (
                      <button
                        key={field.id}
                        onClick={() => toggleExportField(field.id)}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all text-left ${isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-50 bg-slate-50/50 text-slate-400 grayscale'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                          {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-xs font-black uppercase tracking-tight">{field.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">Nota: Apenas os campos selecionados acima serão incluídos como colunas nos ficheiros XLS, CSV e XML.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato Padrão</label>
                  <select
                    className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold text-slate-700"
                    value={localConfig.exportSettings.defaultFormat}
                    onChange={e => setLocalConfig({
                      ...localConfig,
                      exportSettings: { ...localConfig.exportSettings, defaultFormat: e.target.value as ExportFormat }
                    })}
                  >
                    {['XLS', 'CSV', 'PDF', 'JSON', 'XML'].map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSubTab === 'atendimento' && (
          <section className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Fluxo Operacional</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status, tipos e regras de atendimento</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regras de SLA</label>
                <div className="flex items-center space-x-6 bg-rose-50 p-6 rounded-2xl border border-rose-100">
                  <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Tempo de Resposta</h4>
                    <p className="text-xs text-rose-700 font-medium">Alerta visual após tempo máximo excedido.</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    <input
                      type="number"
                      className="w-20 px-4 py-2 rounded-lg border border-rose-200 font-black text-rose-900"
                      value={localConfig.slaMinutes}
                      onChange={e => setLocalConfig({ ...localConfig, slaMinutes: Number(e.target.value) })}
                    />
                    <span className="text-[10px] font-black text-rose-400 uppercase">Minutos</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamentos / Filas</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Novo departamento..."
                    className="flex-1 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white font-bold text-slate-700 text-sm"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                  />
                  <button
                    onClick={addDepartment}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {localConfig.departments.map(dept => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all group">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{dept}</span>
                      <button onClick={() => removeDepartment(dept)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSubTab === 'interface' && (
          <section className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Configuração de Campos</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Personalize os dados obrigatórios do MVP</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'clientName', label: 'Nome do Cliente' },
                  { key: 'phoneNumber', label: 'Número de Telefone' },
                  { key: 'reason', label: 'Motivo da Chamada' },
                  { key: 'observations', label: 'Observações de Texto Livre' }
                ].map(field => (
                  <div
                    key={field.key}
                    onClick={() => toggleField(field.key as any)}
                    className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-200 transition-all group"
                  >
                    <span className="font-bold text-sm text-slate-700 tracking-tight">{field.label}</span>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${localConfig.fieldVisibility[field.key as keyof SystemConfig['fieldVisibility']] ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${localConfig.fieldVisibility[field.key as keyof SystemConfig['fieldVisibility']] ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Central de Notificações</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Configure como o sistema o alerta em produção</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      requestNotificationPermission();
                      showToast('Permissão solicitada ao navegador', 'info');
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-full flex items-center justify-center mb-3 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Ativar Push</span>
                  </button>

                  <button
                    onClick={() => {
                      playNotificationSound();
                      showToast('A reproduzir som de teste...', 'info');
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-full flex items-center justify-center mb-3 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Testar Som</span>
                  </button>

                  <button
                    onClick={() => {
                      sendPushNotification('Teste de Notificação', 'Se está a ler isto, as notificações estão a funcionar corretamente!');
                      showToast('Notificação de teste enviada', 'success');
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 rounded-full flex items-center justify-center mb-3 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Testar Push</span>
                  </button>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                  <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                    <strong>Dica de Produção:</strong> Se o som não tocar, certifique-se de que clicou em pelo menos um botão do sistema após carregar a página. A maioria dos browsers bloqueia áudio automático até haver interação.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSubTab === 'equipa' && (
          <UserManagement users={users} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />
        )}

        {activeSubTab === 'templates' && (
          <section className="animate-in slide-in-from-right-4 duration-300">
            <ObservationTemplatesManager />
          </section>
        )}

        {activeSubTab === 'seguranca' && (
          <section className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Audit Log & Segurança</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Rastreabilidade de ações</p>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-xl text-center py-12 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest">Aguardando novos eventos do sistema</p>
              </div>
            </div>
          </section>
        )}

        {activeSubTab === 'backup' && (
          <section className="animate-in slide-in-from-right-4 duration-300">
            <BackupSettings showToast={showToast} />
          </section>
        )}
      </div>
    </div>
  );
};

export default Settings;
