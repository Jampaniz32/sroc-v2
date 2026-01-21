import React, { useMemo, useState } from 'react';
import { CallRecord, User, UserRole, Shift, CallType, CallStage } from '../types';
import { toTitleCase, formatName } from '../utils';

interface DashboardProps {
  calls: CallRecord[];
  user: User;
  users?: User[];
  onlineUserIds?: string[];
  setActiveTab: (tab: any) => void;
}

// Mini Chart Component for trends
const MiniBarChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${color} transition-all duration-300`}
          style={{ height: `${(value / max) * 100}%`, minHeight: '2px' }}
        />
      ))}
    </div>
  );
};

// Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number; color?: string }> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'stroke-indigo-500'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-slate-100"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
      />
    </svg>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ calls = [], user, users = [], onlineUserIds = [], setActiveTab }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const safeCalls = Array.isArray(calls) ? calls : [];

  const isAdmin = user.role === UserRole.ADMIN;

  const filteredCalls = useMemo(() => {
    return isAdmin
      ? safeCalls
      : safeCalls.filter(c => c.agenteId === user.id);
  }, [safeCalls, user, isAdmin]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const statsData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTs = today.getTime();
    const tomorrowTs = todayTs + 86400000;

    // Period calculations
    const weekAgo = new Date(todayTs - 7 * 86400000);
    const monthAgo = new Date(todayTs - 30 * 86400000);

    const periodStart = selectedPeriod === 'today' ? todayTs
      : selectedPeriod === 'week' ? weekAgo.getTime()
        : selectedPeriod === 'month' ? monthAgo.getTime()
          : 0; // Custom handled separately

    const periodCalls = filteredCalls.filter(c => {
      try {
        const d = new Date(c.data).getTime();

        if (selectedPeriod === 'custom') {
          if (!customRange.start || !customRange.end) return false;
          const start = new Date(customRange.start + 'T00:00:00').getTime();
          const end = new Date(customRange.end + 'T23:59:59').getTime();
          return d >= start && d <= end;
        }

        return d >= periodStart && d < tomorrowTs;
      } catch { return false; }
    });

    const todayCalls = filteredCalls.filter(c => {
      try {
        const d = new Date(c.data).getTime();
        return d >= todayTs && d < tomorrowTs;
      } catch { return false; }
    });

    // Stage distribution
    const stageDistribution: Record<string, number> = {};
    periodCalls.forEach(c => {
      stageDistribution[c.estagio] = (stageDistribution[c.estagio] || 0) + 1;
    });

    // Type distribution
    const typeDistribution: Record<string, number> = {};
    periodCalls.forEach(c => {
      const type = c.tipoPedido || 'Outro';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Entity distribution
    const entityDistribution: Record<string, number> = {};
    periodCalls.forEach(c => {
      if (c.entidade) {
        entityDistribution[c.entidade] = (entityDistribution[c.entidade] || 0) + 1;
      }
    });

    // Agent ranking (for admin)
    const agentDistribution: Record<string, { count: number; id: string; resolved: number }> = {};
    periodCalls.forEach(c => {
      if (c.agenteNome) {
        if (!agentDistribution[c.agenteNome]) {
          agentDistribution[c.agenteNome] = { count: 0, id: c.agenteId, resolved: 0 };
        }
        agentDistribution[c.agenteNome].count++;
        if (c.estagio === 'Resolvido') {
          agentDistribution[c.agenteNome].resolved++;
        }
      }
    });

    // Daily trend (last 7 days)
    const dailyTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayTs - (i * 86400000);
      const dayEnd = dayStart + 86400000;
      const count = filteredCalls.filter(c => {
        try {
          const d = new Date(c.data).getTime();
          return d >= dayStart && d < dayEnd;
        } catch { return false; }
      }).length;
      dailyTrend.push(count);
    }

    // Resolution rate
    const resolved = periodCalls.filter(c => c.estagio === 'Resolvido').length;
    const resolutionRate = periodCalls.length > 0 ? Math.round((resolved / periodCalls.length) * 100) : 0;

    // WhatsApp calls
    const whatsappCalls = periodCalls.filter(c => c.whatsapp).length;

    return {
      todayCount: todayCalls.length,
      periodCount: periodCalls.length,
      totalCount: filteredCalls.length,
      resolutionRate,
      resolved,
      pending: periodCalls.length - resolved,
      whatsappCount: whatsappCalls,
      stageDistribution,
      typeDistribution: Object.entries(typeDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5),
      entityDistribution: Object.entries(entityDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5),
      agentRanking: Object.entries(agentDistribution).sort((a: any, b: any) => b[1].count - a[1].count).slice(0, 5),
      dailyTrend,
      recent: filteredCalls.slice(0, 8)
    };
  }, [filteredCalls, selectedPeriod, customRange]);

  const stageColors: Record<string, string> = {
    'Aberto': 'bg-blue-500',
    'Em Tratamento': 'bg-amber-500',
    'Resolvido': 'bg-emerald-500',
    'Pendente': 'bg-orange-500',
    'Encaminhado': 'bg-purple-500'
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HERO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyek0zNiAxNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest block mb-2">
              {isAdmin ? 'Painel Administrativo' : 'Painel Operacional'}
            </span>
            <h2 className="text-4xl font-black">{greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user.name.split(' ')[0]}</span></h2>
            <p className="text-slate-400 mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                {statsData.todayCount} chamadas realizadas hoje
              </span>
              <span>•</span>
              <span>{statsData.totalCount} chamadas no total</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex bg-slate-800/50 rounded-xl p-1">
              {(['today', 'week', 'month', 'custom'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedPeriod === period
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {period === 'today' ? 'Hoje' : period === 'week' ? '7 Dias' : period === 'month' ? '30 Dias' : 'Personalizado'}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {selectedPeriod === 'custom' && (
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/50 p-1.5 rounded-xl animate-in slide-in-from-right-10 duration-500 backdrop-blur-sm shadow-xl">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none z-10">
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">DE</span>
                  </div>
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                    className="pl-9 pr-2 py-2 w-32 rounded-lg text-[11px] font-bold bg-slate-900/50 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:bg-slate-900/80 cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
                <span className="text-slate-500 font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none z-10">
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">ATÉ</span>
                  </div>
                  <input
                    type="date"
                    value={customRange.end}
                    min={customRange.start}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                    className="pl-10 pr-2 py-2 w-32 rounded-lg text-[11px] font-bold bg-slate-900/50 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:bg-slate-900/80 cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
            )}
            {/* Button Moved Inside */}
            <button
              onClick={() => setActiveTab('new-call')}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-black hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              <span className="text-lg">+</span> NOVO REGISTO
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Período</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{statsData.periodCount}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <MiniBarChart data={statsData.dailyTrend} color="bg-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase">Resolvidos</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{statsData.resolved}</p>
            </div>
            <div className="relative flex items-center justify-center">
              <ProgressRing progress={statsData.resolutionRate} size={48} color="stroke-emerald-500" />
              <span className="absolute text-[10px] font-black text-emerald-600">{statsData.resolutionRate}%</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Taxa de resolução</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">Pendentes</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-500 mt-1">{statsData.pending}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Aguardando resolução</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">WhatsApp</p>
              <p className="text-3xl font-black text-green-600 dark:text-green-500 mt-1">{statsData.whatsappCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Via canal digital</p>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Main Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Distribuição por Estado</h3>
            <div className="space-y-3">
              {Object.entries(statsData.stageDistribution).map(([stage, count]) => {
                const percentage = statsData.periodCount > 0 ? Math.round(((count as number) / (statsData.periodCount as number)) * 100) : 0;
                return (
                  <div key={stage} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-32 truncate">{stage}</span>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stageColors[stage] || 'bg-slate-400'} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 w-12 text-right">{count}</span>
                  </div>
                );
              })}
              {Object.keys(statsData.stageDistribution).length === 0 && (
                <p className="text-center text-slate-400 dark:text-slate-500 py-4">Sem dados no período selecionado</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Top 5 Tipos de Pedido</h3>
              <div className="space-y-3">
                {statsData.typeDistribution.map(([type, count], index) => (
                  <div key={type} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 ${index === 0 ? 'bg-indigo-500' : index === 1 ? 'bg-purple-500' : index === 2 ? 'bg-blue-500' : 'bg-slate-400'
                      }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{toTitleCase(type)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{count} chamadas</p>
                    </div>
                  </div>
                ))}
                {statsData.typeDistribution.length === 0 && (
                  <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs font-bold uppercase">Sem dados</p>
                )}
              </div>
            </div>

            {/* Agent Ranking (Admin only) - Now in main grid */}
            {isAdmin && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Ranking de Agentes</h3>
                <div className="space-y-3">
                  {statsData.agentRanking.map(([name, data]: any, index) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 ${index === 0 ? 'bg-yellow-500 shadow-md shadow-yellow-200' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-600' : 'bg-slate-300'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter">{data.resolved}/{data.count} resolvidos</p>
                      </div>
                      <span className="text-lg font-black text-indigo-600">{data.count}</span>
                    </div>
                  ))}
                  {statsData.agentRanking.length === 0 && (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-xs font-bold uppercase">Sem dados</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar Statistics */}
        <div className="space-y-6">
          {/* Recent Activity - Now in sidebar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Atividade Recente</h3>
              <button
                onClick={() => setActiveTab('calls')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Ver Todos →
              </button>
            </div>
            <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar">
              {statsData.recent.map(call => (
                <div key={call.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">{formatName(call.cliente)}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {toTitleCase(call.tipoPedido === 'Outro' ? call.outroTipoPedido : call.tipoPedido)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase shrink-0 ${call.estagio === 'Resolvido' ? 'bg-emerald-100 text-emerald-600'
                      : call.estagio === 'Pendente' ? 'bg-orange-100 text-orange-600'
                        : 'bg-amber-100 text-amber-600'
                      }`}>
                      {call.estagio}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(call.data).toLocaleDateString('pt-PT')} • {new Date(call.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {statsData.recent.length === 0 && (
                <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-xs font-bold uppercase">Sem registos</p>
              )}
            </div>
          </div>

          {/* Online Users (Admin only) */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center waves-effect justify-between mb-4">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Utilizadores Online</h3>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  {onlineUserIds.length} Ativos
                </span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {users.filter(u => onlineUserIds.includes(String(u.id))).map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter">{u.role === UserRole.ADMIN ? 'Administrador' : (u.agency || 'Agente')}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                      title="Enviar Mensagem"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                  </div>
                ))}
                {users.filter(u => onlineUserIds.includes(String(u.id))).length === 0 && (
                  <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ninguém online</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
