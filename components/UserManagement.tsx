
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Modais de Senha e Confirmação
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    username: '',
    password: '',
    role: UserRole.AGENTE,
    agency: '',
    requiresPasswordChange: true
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({ name: '', username: '', password: '', role: UserRole.AGENTE, agency: '', requiresPasswordChange: true });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role,
      agency: user.agency || '',
      requiresPasswordChange: user.requiresPasswordChange || false
    });
    setShowModal(true);
  };

  const handleOpenReset = (user: User) => {
    setResetTargetUser(user);
    setNewTempPassword('');
    setShowPasswordReset(true);
  };

  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
    }
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editingUserId) {
      onUpdateUser({ ...formData, id: editingUserId });
    } else {
      onAddUser(formData);
    }
    setShowModal(false);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetTargetUser && newTempPassword) {
      onUpdateUser({
        ...resetTargetUser,
        password: newTempPassword,
        requiresPasswordChange: true // Força a troca no próximo login
      });
      setShowPasswordReset(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Remover Acesso"
        message={`Tem a certeza que deseja eliminar permanentemente a conta de ${userToDelete?.name}? O utilizador perderá o acesso imediato ao sistema.`}
        confirmLabel="Confirmar Remoção"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      />

      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Equipa Operacional</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{users.length} Colaboradores Ativos</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-xs uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          <span>Novo Utilizador</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all group">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center text-xl font-black text-indigo-600 relative overflow-hidden group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 transition-colors shrink-0">
                {u.name.charAt(0)}
                {u.requiresPasswordChange && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white dark:border-slate-800 rounded-full" title="Pendente Troca de Senha"></div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-800 dark:text-slate-100 text-sm truncate uppercase tracking-tight">{u.name}</p>
                <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${u.role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                    }`}>
                    {u.role}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">@{u.username}</span>
                  {u.agency && (
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">{u.agency}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleOpenReset(u)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
                title="Redefinir Senha"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </button>
              <button
                onClick={() => handleOpenEdit(u)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                title="Editar Utilizador"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button
                onClick={() => handleOpenDelete(u)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                title="Eliminar Acesso"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Principal (Adicionar / Editar) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 animate-in zoom-in-95 duration-200 my-auto">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Definição de permissões e credenciais</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-all shadow-sm">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input
                      type="text" required
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-700 dark:text-slate-200 text-sm transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Albino Mondlane"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Papel / Função</label>
                    <select
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/50 outline-none font-black text-slate-700 dark:text-slate-200 text-[10px] uppercase tracking-widest transition-all appearance-none"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      <option value={UserRole.AGENTE}>AGENTE OPERACIONAL</option>
                      <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Login (Username)</label>
                    <input
                      type="text" required
                      disabled={isEditing}
                      className={`w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-slate-700 dark:text-slate-200 text-sm transition-all ${isEditing ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      placeholder="ex: amondlane"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Agência / Localização</label>
                    <input
                      type="text"
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-slate-700 dark:text-slate-200 text-sm transition-all"
                      value={formData.agency}
                      onChange={e => setFormData({ ...formData, agency: e.target.value })}
                      placeholder="Sede, Filial, etc."
                    />
                  </div>

                  {!isEditing && (
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Senha Padrão</label>
                      <input
                        type="password" required
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 outline-none font-bold text-slate-700 dark:text-slate-200 text-sm transition-all"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>
                  )}
                </div>

                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start space-x-4">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-100 uppercase tracking-tight">Regra de Primeiro Acesso</p>
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed mt-1">
                      Por questões de segurança, novos colaboradores ou utilizadores com senha redefinida serão obrigados a criar uma nova senha pessoal no próximo login.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 active:scale-95 transition-all hover:bg-indigo-700"
                >
                  {isEditing ? 'Atualizar Perfil' : 'Criar Conta de Acesso'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {showPasswordReset && resetTargetUser && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 animate-in zoom-in-95 duration-200 my-auto">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Redefinir Senha</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
                  Insira uma nova senha temporária para <span className="text-slate-900 dark:text-slate-100 font-bold">{resetTargetUser.name}</span>. O utilizador terá de a alterar ao entrar.
                </p>

                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <input
                    type="password" required autoFocus
                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none font-bold text-slate-800 dark:text-slate-100 text-center text-lg tracking-widest focus:border-amber-500 transition-all"
                    placeholder="NOVA SENHA"
                    value={newTempPassword}
                    onChange={e => setNewTempPassword(e.target.value)}
                  />
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(false)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-4 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all"
                    >
                      Confirmar Reset
                    </button>
                  </div>
                </form>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 text-center">
                <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">SROC Security Management</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
