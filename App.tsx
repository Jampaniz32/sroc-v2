import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, CallRecord, Shift, SystemConfig, Toast, ChatMessage } from './types';
import { getCurrentShift, requestNotificationPermission, sendPushNotification } from './utils';
import { callsAPI, usersAPI, authAPI, messagesAPI } from './services/api';
import { initializeSocket, disconnectSocket, onNewMessage, offNewMessage, sendMessage as sendSocketMessage } from './services/socket';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CallForm from './components/CallForm';
import CallList from './components/CallList';
import Settings from './components/Settings';
import Chat from './components/Chat';
import ProfileModal from './components/ProfileModal';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';

const TAB_NAMES: Record<string, string> = {
  'dashboard': 'Painel de Controlo',
  'new-call': 'Registo de Chamada',
  'calls': 'Histórico Operacional',
  'chat': 'Comunicação',
  'settings': 'Configurações do Sistema'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('sroc_token');
      const savedUser = localStorage.getItem('sroc_session_user');

      if (!token || !savedUser) {
        setIsLoading(false);
        return;
      }

      try {
        await authAPI.verify();
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Sessão inválida ou expirada:', error);
        authAPI.logout();
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('sroc_active_tab') || 'dashboard';
  });

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift>(getCurrentShift());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeChatRoomId, setActiveChatRoomId] = useState<string>('global');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const activeTabRef = useRef(activeTab);
  const activeRoomRef = useRef(activeChatRoomId);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const defaultFields = ['nuit', 'cliente', 'entidade', 'agencia', 'tipoPedido', 'estagio', 'data', 'turno', 'contacto', 'agenteNome', 'whatsapp', 'observacoes'];
    try {
      const saved = localStorage.getItem('sroc_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.exportSettings?.selectedFields) {
          parsed.exportSettings = { ...parsed.exportSettings, selectedFields: defaultFields };
        }
        return parsed;
      }
    } catch (e) { console.error('Erro config', e); }

    return {
      logo: '', institutionName: 'SROC Operacional', timezone: 'Africa/Maputo (GMT+2)',
      dateFormat: 'DD/MM/YYYY HH:mm', departments: ['Atendimento', 'TI', 'Comercial'],
      fieldVisibility: { clientName: true, phoneNumber: true, reason: true, observations: true },
      slaMinutes: 15, notificationsEnabled: true,
      exportSettings: { defaultFormat: 'XLS', allowMultipleFormats: true, reportLogo: '', selectedFields: defaultFields },
      backupSettings: { autoBackupEnabled: false, frequency: 'daily', retentionMonths: 12, autoDeleteExpired: false }
    };
  });

  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc: number, count: number) => acc + count, 0);
  }, [unreadCounts]);

  useEffect(() => {
    localStorage.setItem('sroc_config', JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { activeRoomRef.current = activeChatRoomId; }, [activeChatRoomId]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentShift(getCurrentShift()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { requestNotificationPermission(); }, []);

  useEffect(() => {
    const baseTitle = TAB_NAMES[activeTab] || 'SROC';
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Novo Alerta - ${baseTitle}`;
    } else {
      document.title = `SROC - ${baseTitle}`;
    }
  }, [totalUnread, activeTab]);

  useEffect(() => {
    if (!currentUser) return;

    callsAPI.getAll()
      .then(data => setCalls(data))
      .catch(err => console.error('Erro loading calls:', err));

    if (currentUser.role === UserRole.ADMIN) {
      usersAPI.getAll()
        .then(data => setUsers(data))
        .catch(err => console.error('Erro loading users:', err));
    } else {
      usersAPI.getAgentes()
        .then(data => setUsers(data))
        .catch(err => console.error('Erro loading agents:', err));
    }

    messagesAPI.getAll()
      .then(data => setMessages(data))
      .catch(err => console.error('Erro loading messages:', err));

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      const isViewing = activeTabRef.current === 'chat' && activeRoomRef.current === msg.roomId;
      if (!isViewing) {
        setUnreadCounts(prev => ({ ...prev, [msg.roomId]: (prev[msg.roomId] || 0) + 1 }));
        showToast(`Nova mensagem de ${msg.senderName}`, 'info');
      }
    };

    const socket = initializeSocket(currentUser.id, currentUser.name);

    onNewMessage(handleNewMessage);

    socket?.on('error', (err: any) => {
      showToast(err.message || 'Erro no servidor de chat', 'error');
    });

    return () => {
      offNewMessage(handleNewMessage);
      socket?.off('error');
      disconnectSocket();
    };
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('sroc_session_user', JSON.stringify(user));
    if (!user.requiresPasswordChange) {
      setActiveTab('dashboard');
    }
  };

  const handlePasswordChanged = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('sroc_session_user', JSON.stringify(updatedUser));
    showToast('Senha atualizada com sucesso!');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    authAPI.logout();
    disconnectSocket();
    setCurrentUser(null);
    localStorage.removeItem('sroc_session_user');
  };

  const loadCallsServer = () => {
    callsAPI.getAll()
      .then(data => setCalls(data))
      .catch(err => console.error('Erro recarregando calls:', err));
  };

  const addCall = (data: any) => {
    callsAPI.create({ ...data, turno: getCurrentShift() })
      .then(() => {
        showToast('Registo salvo!');
        loadCallsServer();
      })
      .catch((err) => {
        console.error(err);
        showToast('Erro ao salvar', 'error');
      });
  };

  const updateCall = (data: CallRecord) => {
    callsAPI.update(data.id, data)
      .then(updated => { setCalls(p => p.map(c => c.id === updated.id ? updated : c)); showToast('Atualizado!'); })
      .catch(() => showToast('Erro ao atualizar', 'error'));
  };

  const deleteCall = (id: string) => {
    callsAPI.delete(id)
      .then(() => { setCalls(p => p.filter(c => c.id !== id)); showToast('Removido!'); })
      .catch(() => showToast('Erro ao remover', 'error'));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    usersAPI.create(userData).then(newUser => {
      setUsers(prev => [...prev, newUser]);
      showToast('Utilizador criado!');
    }).catch(err => showToast('Erro ao criar utilziador', 'error'));
  };

  const updateUser = (userData: User) => {
    usersAPI.update(userData.id, userData).then(updated => {
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      showToast('Atualizado!');
    }).catch(err => showToast('Erro ao atualizar', 'error'));
  };

  const deleteUser = (id: string) => {
    usersAPI.delete(id).then(() => {
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('Removido!');
    }).catch(err => showToast('Erro ao remover', 'error'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} config={systemConfig} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="fixed top-6 right-6 z-[9999] flex flex-col space-y-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto px-6 py-4 rounded-xl shadow-lg border bg-white ${t.type === 'error' ? 'text-red-600 border-red-100' : 'text-emerald-600 border-emerald-100'}`}>
            <span className="font-bold text-xs uppercase">{t.message}</span>
          </div>
        ))}
      </div>

      <Sidebar
        user={currentUser}
        activeTab={activeTab as any}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        config={systemConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        totalUnread={totalUnread}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <main className={`flex-1 px-6 pb-6 pt-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <header className="mb-0 py-6 flex justify-between items-center border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-[100] -mx-6 px-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md active:scale-95 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-0.5">Menu</span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">{TAB_NAMES[activeTab] || activeTab}</h1>
            </div>
          </div>

          <div
            className="flex items-center gap-4 bg-white pl-4 pr-1.5 py-1.5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all cursor-pointer group"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="text-right hidden sm:block pr-1">
              <p className="text-xs font-black text-slate-800 tracking-tight leading-none mb-1.5">{currentUser.name}</p>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100/50 uppercase tracking-tighter">
                  {currentShift}
                </span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform duration-300">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="pt-8 space-y-8">
          {activeTab === 'dashboard' && <Dashboard calls={calls} user={currentUser} setActiveTab={setActiveTab} />}
          {activeTab === 'new-call' && <CallForm onAdd={addCall} user={currentUser} />}
          {activeTab === 'chat' &&
            <Chat
              currentUser={currentUser} users={users} messages={messages}
              activeRoomId={activeChatRoomId} setActiveRoomId={setActiveChatRoomId}
              onSendMessage={(content, roomId, senderOverride) => {
                const sId = senderOverride?.id || currentUser.id;
                const sName = senderOverride?.name || currentUser.name;
                const success = sendSocketMessage(sId, sName, content, roomId);
                if (!success) {
                  showToast('Falha ao enviar: Sem conexão com o servidor', 'error');
                }
              }}
              unreadCounts={unreadCounts} onReadRoom={(id) => setUnreadCounts(p => ({ ...p, [id]: 0 }))}
            />
          }
          {activeTab === 'calls' && <CallList calls={calls} user={currentUser} users={users} systemConfig={systemConfig} onDeleteCall={deleteCall} onUpdateCall={updateCall} />}
          {activeTab === 'settings' && currentUser.role === UserRole.ADMIN && (
            <Settings
              config={systemConfig}
              onUpdate={setSystemConfig}
              users={users}
              onAddUser={addUser}
              onUpdateUser={updateUser}
              onDeleteUser={deleteUser}
              calls={calls}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {isProfileModalOpen && <ProfileModal user={currentUser} onClose={() => setIsProfileModalOpen(false)} onUpdate={setCurrentUser} />}

      {!!currentUser.requiresPasswordChange && (
        <ForcePasswordChangeModal
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </div>
  );
};

export default App;
