import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ChatMessage } from '../types';
import { startTyping, stopTyping, onUserTyping, onUserStoppedTyping } from '../services/socket';

interface ChatProps {
  currentUser: User;
  users: User[];
  messages: ChatMessage[];
  onSendMessage: (content: string, roomId: string, senderOverride?: { id: string, name: string }) => void;
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  unreadCounts: Record<string, number>;
  onReadRoom: (id: string) => void;
  onUpdateMessage: (id: string, content: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  onClearChat: (roomId: string) => Promise<void>;
}

const Chat: React.FC<ChatProps> = ({
  currentUser,
  users = [],
  messages = [],
  onSendMessage,
  activeRoomId = 'global',
  setActiveRoomId,
  unreadCounts = {},
  onReadRoom,
  onUpdateMessage,
  onDeleteMessage,
  onClearChat
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const safeMessages = useMemo(() => Array.isArray(messages) ? messages : [], [messages]);
  const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
    try { if (activeRoomId) onReadRoom(activeRoomId); } catch (e) { console.error(e); }
  }, [activeRoomId]);

  // Limpar notificações ao voltar para a aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeRoomId) {
        onReadRoom(activeRoomId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeRoomId, onReadRoom]);

  useEffect(() => {
    const handleTyping = (data: { userId: string, userName: string, roomId: string }) => {
      setTypingUsers(prev => {
        const roomTyping = prev[data.roomId] || [];
        if (!roomTyping.includes(data.userName)) {
          return { ...prev, [data.roomId]: [...roomTyping, data.userName] };
        }
        return prev;
      });
    };

    const handleStopTyping = (data: { userId: string, roomId: string }) => {
      setTypingUsers(prev => {
        const roomTyping = prev[data.roomId] || [];
        // Precisamos do nome, mas o socket envia apenas o ID no stopTyping para poupar banda.
        // No Chat, como as mensagens têm o nome, podemos filtrar de forma mais simples ou apagar tudo se for apenas 1 vs 1.
        if (data.roomId !== 'global') {
          return { ...prev, [data.roomId]: [] };
        }
        // Para a sala global, limpamos após um tempo ou se tivermos mapeamento ID->Nome. 
        // Por agora, para simplicidade:
        return { ...prev, [data.roomId]: [] };
      });
    };

    onUserTyping(handleTyping);
    onUserStoppedTyping(handleStopTyping);

    return () => {
      // Idealmente offUserTyping, mas as subscrições globais no socket.ts gerem isto.
    };
  }, []);

  useEffect(() => {
    try {
      if (safeMessages.length > 0) {
        const lastMsg = safeMessages[safeMessages.length - 1];
        if (lastMsg && lastMsg.roomId === activeRoomId) {
          scrollToBottom();
          onReadRoom(activeRoomId);
        }
      }
    } catch (e) { console.error('Erro efeito scroll:', e); }
  }, [safeMessages, activeRoomId]);

  const icons = {
    group: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    private: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  };

  const rooms = useMemo(() => {
    const list: { id: string, name: string, type: 'group' | 'ai' | 'private', icon: React.ReactNode }[] = [
      { id: 'global', name: 'Sala Geral (Equipa)', type: 'group', icon: icons.group },
    ];

    try {
      const roomIdsFromMessages = new Set<string>();

      safeMessages.forEach(msg => {
        if (msg.roomId && typeof msg.roomId === 'string' && msg.roomId.includes('_')) {
          const participants = msg.roomId.split('_');
          if (participants.includes(String(currentUser.id))) {
            roomIdsFromMessages.add(msg.roomId);
          }
        }
      });

      if (activeRoomId && activeRoomId.includes('_')) {
        const participants = activeRoomId.split('_');
        if (participants.includes(String(currentUser.id))) {
          roomIdsFromMessages.add(activeRoomId);
        }
      }

      roomIdsFromMessages.forEach(roomId => {
        const ids = roomId.split('_');
        const otherId = ids.find(id => id !== currentUser.id);
        const otherUser = safeUsers.find(u => u.id === otherId);
        if (otherUser) {
          list.push({ id: roomId, name: otherUser.name, type: 'private' as const, icon: icons.private });
        }
      });
    } catch (e) { console.error('Erro processando salas:', e); }

    return list;
  }, [safeUsers, currentUser?.id, safeMessages, activeRoomId]);

  const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId) || rooms[0], [rooms, activeRoomId]);

  const filteredMessages = useMemo(() => {
    return safeMessages.filter(m => m.roomId === activeRoomId);
  }, [safeMessages, activeRoomId]);

  const startPrivateChat = (targetUser: User) => {
    const sortedIds = [currentUser.id, targetUser.id].sort();
    const roomId = `${sortedIds[0]}_${sortedIds[1]}`;
    setActiveRoomId(roomId);
    setShowUserPicker(false);
    onReadRoom(roomId);
  };

  // Typing indicator effect
  useEffect(() => {
    if (inputValue.trim()) {
      startTyping(activeRoomId);
      const timeout = setTimeout(() => stopTyping(activeRoomId), 2000);
      return () => clearTimeout(timeout);
    } else {
      stopTyping(activeRoomId);
    }
  }, [inputValue, activeRoomId]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue, activeRoomId);
    setInputValue('');
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editValue.trim()) return;
    try {
      await onUpdateMessage(editingMessageId, editValue);
      setEditingMessageId(null);
    } catch (e) {
      console.error('Erro ao editar:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta mensagem?')) {
      try {
        await onDeleteMessage(id);
      } catch (e) {
        console.error('Erro ao eliminar:', e);
      }
    }
  };

  const handleClearChat = async () => {
    try {
      await onClearChat(activeRoomId);
      setShowClearConfirm(false);
    } catch (e) {
      console.error('Erro ao limpar chat:', e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">

      <aside className="w-72 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50/30 dark:bg-slate-900/30">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Canais</h3>
          <button onClick={() => setShowUserPicker(true)} className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all relative border-2 ${activeRoomId === room.id
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : (unreadCounts[room.id] || 0) > 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-700 hover:border-slate-100 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
                }`}
            >
              <div className={`${activeRoomId === room.id ? 'text-white' : (unreadCounts[room.id] || 0) > 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {room.icon}
              </div>
              <div className="text-left overflow-hidden flex-1">
                <div className="flex items-center space-x-2">
                  <p className={`font-black text-[11px] truncate ${activeRoomId === room.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{room.name}</p>
                  {(unreadCounts[room.id] || 0) > 0 && activeRoomId !== room.id && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  )}
                </div>
                <p className={`text-[8px] font-bold uppercase tracking-widest ${activeRoomId === room.id ? 'text-indigo-200' : (unreadCounts[room.id] || 0) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{room.type}</p>
              </div>

              {(unreadCounts[room.id] || 0) > 0 && activeRoomId !== room.id && (
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md animate-bounce ring-2 ring-white">
                  {unreadCounts[room.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex-1 flex flex-col relative bg-white dark:bg-slate-800">
        {showUserPicker && (
          <div className="absolute inset-0 z-50 bg-white/98 dark:bg-slate-800/98 backdrop-blur-sm p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-sm">Iniciar Mensagem Direta</h4>
              <button onClick={() => setShowUserPicker(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safeUsers.filter(u => u.id !== currentUser?.id).map(u => (
                <button key={u.id} onClick={() => startPrivateChat(u)} className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-100 dark:border-slate-700 transition-all text-left group">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center font-black transition-all text-sm">{u.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 dark:text-slate-100 text-xs truncate">{u.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest truncate">{u.agency || 'Agente'}</p>
                  </div>
                </button>
              ))}
              {safeUsers.filter(u => u.id !== currentUser?.id).length === 0 && (
                <p className="col-span-2 text-center text-slate-400 text-xs py-10">Nenhum outro usuário disponível.</p>
              )}
            </div>
          </div>
        )}

        <header className="px-8 py-5 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 shadow-sm z-10">
          <div className="flex items-center">
            <div className="text-indigo-600 mr-4">
              {activeRoom?.icon}
            </div>
            <h4 className="font-black text-slate-800 dark:text-slate-100">{activeRoom?.name || 'Selecione uma sala'}</h4>
          </div>

          {(currentUser.role === 'ADMIN' || activeRoomId.includes('_')) && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm border border-rose-100 group"
              title="Limpar histórico"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/10 dark:bg-slate-900/20">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => {
              const isMe = String(msg.senderId) === String(currentUser?.id);
              return (
                <div key={msg.id || Math.random()} className={`relative group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] font-black text-slate-400 mb-1 ml-1 uppercase tracking-widest">{msg.senderName}</span>
                  )}
                  <div className="flex items-center space-x-2 group">
                    {isMe && !editingMessageId && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button onClick={() => handleStartEdit(msg)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(msg.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}

                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col space-y-2 bg-white dark:bg-slate-700 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-md min-w-[200px]">
                        <textarea
                          className="w-full p-2 text-sm border-0 focus:ring-0 resize-none bg-slate-50 dark:bg-slate-800 dark:text-slate-100 rounded-lg"
                          rows={2}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => setEditingMessageId(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancelar</button>
                          <button onClick={handleSaveEdit} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-md px-5 py-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-tl-none'
                        }`}>
                        {msg.content}
                      </div>
                    )}

                    {!isMe && currentUser.role === 'ADMIN' && (
                      <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                    </p>
                    {isMe && (
                      <span className="text-indigo-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
              <div className="w-16 h-16 mb-4">
                {activeRoom?.icon}
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em]">Início da conversa em {activeRoom?.name}</p>
            </div>
          )}
        </div>

        {(typingUsers[activeRoomId] || []).length > 0 && (
          <div className="px-8 pb-4">
            <div className="flex items-center space-x-2 p-2 px-4 bg-slate-50 dark:bg-slate-700 rounded-full w-fit animate-pulse">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">
                {typingUsers[activeRoomId].join(', ')} está a escrever...
              </span>
            </div>
          </div>
        )}

        <footer className="p-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <textarea
              className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-100 dark:focus:border-indigo-700 outline-none font-medium text-sm dark:text-slate-100 placeholder:dark:text-slate-500 resize-none"
              rows={1}
              placeholder="Escreva uma mensagem..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            ></textarea>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </footer>

        {/* Modal de Confirmação de Limpeza */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h5 className="text-xl font-black text-slate-800 dark:text-slate-100 text-center mb-2">Limpar Histórico?</h5>
              <p className="text-slate-500 text-center text-sm leading-relaxed mb-8">
                Esta ação irá eliminar permanentemente todas as mensagens da sala <span className="font-bold text-slate-800 dark:text-slate-100">"{activeRoom?.name}"</span>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearChat}
                  className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Sim, Limpar
                </button>
              </div>
            </div>
          </div>
        )}
      </section >
    </div >
  );
};

export default Chat;
