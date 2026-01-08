import React, { useState, useEffect } from 'react';
import { backupAPI } from '../services/api';

interface BackupStatus {
    status: string;
    database: {
        calls: number;
        users: number;
        messages: number;
        clients: number;
    };
    dataRange: {
        oldest: string | null;
        newest: string | null;
    };
    backupSettings: {
        autoBackupEnabled: boolean;
        frequency: 'daily' | 'weekly';
        retentionMonths: number;
        autoDeleteExpired: boolean;
        lastBackupDate: string | null;
    };
    timestamp: string;
}

interface RetentionStats {
    retention: {
        last30Days: number;
        last90Days: number;
        last1Year: number;
        olderThan1Year: number;
    };
}

interface BackupSettingsProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Icons = {
    JSON: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.293 2.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
    ),
    SQL: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
            <path d="M17 4c0 1.657-3.134 3-7 3S3 5.657 3 4s3.134-3 7-3 7 1.343 7 3z" />
        </svg>
    ),
    Calls: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
    ),
    Clients: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" />
        </svg>
    ),
    Users: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    ),
    Messages: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
    ),
    Chart: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
    ),
    Settings: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
    )
};

const BackupSettings: React.FC<BackupSettingsProps> = ({ showToast }) => {
    const [status, setStatus] = useState<BackupStatus | null>(null);
    const [retention, setRetention] = useState<RetentionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [settings, setSettings] = useState({
        autoBackupEnabled: false,
        frequency: 'weekly' as 'daily' | 'weekly',
        retentionMonths: 12,
        autoDeleteExpired: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statusData, retentionData] = await Promise.all([
                backupAPI.getStatus(),
                backupAPI.getRetention()
            ]);
            setStatus(statusData);
            setRetention(retentionData);
            if (statusData.backupSettings) {
                setSettings(statusData.backupSettings);
            }
        } catch (error) {
            console.error('Error loading backup data:', error);
            showToast('Erro ao carregar dados de backup', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExportJSON = async () => {
        try {
            setExporting(true);
            const response = await backupAPI.exportJSON();
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sroc_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Backup JSON exportado com sucesso!', 'success');
            loadData(); // Refresh to update last backup date
        } catch (error) {
            console.error('Export error:', error);
            showToast('Erro ao exportar backup', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleExportSQL = async () => {
        try {
            setExporting(true);
            const response = await backupAPI.exportSQL();
            const blob = new Blob([response.data], { type: 'application/sql' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sroc_backup_${new Date().toISOString().split('T')[0]}.sql`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Backup SQL exportado com sucesso!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Erro ao exportar backup SQL', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await backupAPI.updateSettings(settings);
            showToast('Configurações de backup salvas!', 'success');
        } catch (error) {
            console.error('Save settings error:', error);
            showToast('Erro ao salvar configurações', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Export Panel */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2rem] p-8 text-white border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/20">
                                <Icons.SQL />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Cópia de Segurança</h2>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Gestão centralizada de backup e integridade de dados</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportJSON}
                            disabled={exporting}
                            className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95"
                        >
                            <Icons.JSON />
                            <span>{exporting ? 'A Exportar...' : 'Exportar JSON'}</span>
                        </button>
                        <button
                            onClick={handleExportSQL}
                            disabled={exporting}
                            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                        >
                            <Icons.SQL />
                            <span>{exporting ? 'A Exportar...' : 'Exportar SQL'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Entity Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Chamadas', val: status?.database.calls, icon: Icons.Calls, color: 'indigo' },
                    { label: 'Clientes', val: status?.database.clients, icon: Icons.Clients, color: 'blue' },
                    { label: 'Utilizadores', val: status?.database.users, icon: Icons.Users, color: 'purple' },
                    { label: 'Mensagens', val: status?.database.messages, icon: Icons.Messages, color: 'emerald' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${item.color}-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110`}></div>
                        <div className="relative">
                            <div className={`w-10 h-10 bg-${item.color}-50 text-${item.color}-600 rounded-xl flex items-center justify-center mb-4 border border-${item.color}-100`}>
                                <item.icon />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            <p className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{item.val || 0}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Age Distribution */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Icons.Chart />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Distribuição de Dados</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Segmentação por antiguidade</p>
                        </div>
                    </div>

                    {retention && (
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            {[
                                { lab: 'Últimos 30 dias', val: retention.retention.last30Days, bg: 'bg-emerald-50', txt: 'text-emerald-600', valc: 'text-emerald-700' },
                                { lab: '31-90 dias', val: retention.retention.last90Days, bg: 'bg-blue-50', txt: 'text-blue-600', valc: 'text-blue-700' },
                                { lab: '91 dias - 1 ano', val: retention.retention.last1Year, bg: 'bg-amber-50', txt: 'text-amber-600', valc: 'text-amber-700' },
                                { lab: 'Mais de 1 ano', val: retention.retention.olderThan1Year, bg: 'bg-slate-50', txt: 'text-slate-500', valc: 'text-slate-700' }
                            ].map((seg, i) => (
                                <div key={i} className={`${seg.bg} p-5 rounded-2xl border border-white/20 relative overflow-hidden`}>
                                    <p className={`text-[10px] font-black uppercase tracking-wider ${seg.txt} relative z-10`}>{seg.lab}</p>
                                    <p className={`text-2xl font-black ${seg.valc} mt-2 relative z-10`}>{seg.val}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Backup Configuration */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Icons.Settings />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Política de Backup</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Automação e Retenção</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className={`w-1.5 h-10 rounded-full ${settings.autoBackupEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                <div>
                                    <p className="font-black text-sm text-slate-800 tracking-tight">Agendamento Automático</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronização periódica</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoBackupEnabled: !settings.autoBackupEnabled })}
                                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${settings.autoBackupEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${settings.autoBackupEnabled ? 'left-8' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Frequência</label>
                                <div className="flex gap-2">
                                    {(['daily', 'weekly'] as const).map((freq) => (
                                        <button
                                            key={freq}
                                            onClick={() => setSettings({ ...settings, frequency: freq })}
                                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${settings.frequency === freq
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
                                                }`}
                                        >
                                            {freq === 'daily' ? 'Diário' : 'Semanal'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Período de Retenção</label>
                                <select
                                    value={settings.retentionMonths}
                                    onChange={(e) => setSettings({ ...settings, retentionMonths: parseInt(e.target.value) })}
                                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white font-black text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                >
                                    <option value={6}>6 MESES</option>
                                    <option value={12}>1 ANO</option>
                                    <option value={24}>2 ANOS</option>
                                    <option value={36}>3 ANOS</option>
                                    <option value={0}>PERMANENTE</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-rose-50 border border-rose-100 rounded-2xl group hover:border-rose-200 transition-all">
                            <div className="flex items-center space-x-4">
                                <div className={`w-1.5 h-10 rounded-full ${settings.autoDeleteExpired ? 'bg-rose-500' : 'bg-rose-200'}`}></div>
                                <div>
                                    <p className="font-black text-sm text-rose-900 tracking-tight leading-none mb-1">Limpeza de Legado</p>
                                    <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Exclusão permanente de dados</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoDeleteExpired: !settings.autoDeleteExpired })}
                                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${settings.autoDeleteExpired ? 'bg-rose-600' : 'bg-rose-200'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${settings.autoDeleteExpired ? 'left-8' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            className="w-full py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/10 mt-2"
                        >
                            Gravar Diretrizes de Backup
                        </button>
                    </div>
                </div>
            </div>

            {/* Last Backup Info */}
            {status?.backupSettings?.lastBackupDate && (
                <div className="bg-white border-2 border-emerald-100 hover:border-emerald-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all shadow-sm">
                    <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
                            <Icons.Clock />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Status de Disponibilidade</p>
                            <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none">Cópia de Segurança Atualizada</h4>
                            <p className="text-xs font-bold text-slate-400 mt-2">
                                Última integridade verificada em: <span className="text-slate-600">{new Date(status.backupSettings.lastBackupDate).toLocaleString('pt-PT')}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100/50">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Ativo & Seguro</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupSettings;
