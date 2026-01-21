
import React from 'react';
import { User, UserRole, SystemConfig } from '../types';
import { ICONS } from '../constants';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  user: User;
  activeTab: 'dashboard' | 'new-call' | 'calls' | 'chat' | 'settings';
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  config: SystemConfig;
  isOpen: boolean;
  onClose: () => void;
  totalUnread?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout, onOpenProfile, config, isOpen, onClose, totalUnread = 0 }) => {
  // Ordem solicitada: Painel > Nova Chamada > Comunicação > Histórico > Configurações
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: ICONS.Dashboard, roles: [UserRole.ADMIN, UserRole.AGENTE] },
    { id: 'new-call', label: 'Nova Chamada', icon: ICONS.Call, roles: [UserRole.ADMIN, UserRole.AGENTE] },
    {
      id: 'chat',
      label: 'Comunicação',
      icon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      roles: [UserRole.ADMIN, UserRole.AGENTE]
    },
    { id: 'calls', label: 'Histórico', icon: ICONS.Export, roles: [UserRole.ADMIN, UserRole.AGENTE] },
    { id: 'settings', label: 'Configurações', icon: ICONS.Settings, roles: [UserRole.ADMIN] },
  ];

  return (
    <>
      {/* Camada de sobreposição para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 dark:bg-[#0f172a] text-slate-300 z-50 flex flex-col border-r border-slate-800/50 dark:border-slate-800/50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              {config.logo ? (
                <div className="flex justify-start">
                  <div className="max-w-[140px] max-h-[50px] flex items-center justify-start overflow-hidden">
                    <img
                      src={config.logo}
                      alt="Logótipo"
                      className="w-auto h-auto max-w-full max-h-full object-contain filter drop-shadow-md"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg">
                    S
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="font-extrabold text-lg text-white leading-tight tracking-tight truncate">{config.institutionName}</h2>
                    <div className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SROC OPERACIONAL</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão para fechar em dispositivos móveis */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {config.logo && (
              <div className="border-b border-slate-800 pb-2">
                <h2 className="font-bold text-xs text-white leading-tight tracking-tight truncate opacity-70 uppercase">{config.institutionName}</h2>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 mt-2">
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Menu Operacional</p>
          {menuItems
            .filter(item => item.roles.includes(user.role))
            .map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative group ${activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
              >
                <div className={`${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                  <item.icon />
                </div>
                <span className="font-bold text-sm tracking-tight flex-1 text-left">{item.label}</span>

                {/* Badge de notificações agora em Verde (Emerald) */}
                {item.id === 'chat' && totalUnread > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-emerald-500/20 animate-pulse">
                    {totalUnread > 9 ? '+9' : totalUnread}
                  </span>
                )}
              </button>
            ))}
        </nav>

        <div className="p-4 m-3 bg-slate-800/40 dark:bg-slate-800/60 rounded-2xl border border-slate-700/30 dark:border-slate-700/50">
          <div
            onClick={onOpenProfile}
            className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-slate-700/30 p-2 -m-2 rounded-xl transition-colors group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-bold text-white uppercase group-hover:bg-indigo-600 transition-colors">
                {user.name.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0f172a] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs text-white truncate group-hover:text-indigo-300 transition-colors">{user.name}</p>
              <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{user.role === UserRole.ADMIN ? 'Administrador' : 'Agente'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle className="!bg-slate-800 !border-slate-700 !text-slate-400 hover:!bg-indigo-600 hover:!text-white hover:!border-indigo-500 w-[42px] h-[42px] flex items-center justify-center shrink-0" />
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
