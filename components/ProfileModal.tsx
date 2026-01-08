
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [agency, setAgency] = useState(user.agency || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onUpdate({
      ...user,
      name,
      agency
    });
    
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 my-auto relative">
          
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center space-x-5">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-3xl font-black shadow-inner">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{user.name}</h2>
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">{user.role}</p>
              </div>
            </div>
            {/* Círculos decorativos */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Exibição</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID de Utilizador</label>
                <input 
                  type="text"
                  disabled
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-100 bg-slate-100 text-slate-400 font-bold cursor-not-allowed"
                  value={`@${user.username}`}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência / Localização</label>
                <input 
                  type="text"
                  className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                  value={agency}
                  onChange={e => setAgency(e.target.value)}
                  placeholder="Ex: Sede Central"
                />
              </div>
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start space-x-3">
               <div className="mt-0.5 text-indigo-500">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                 </svg>
               </div>
               <div>
                 <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tight">Informação de Segurança</p>
                 <p className="text-[9px] text-indigo-700 font-medium leading-relaxed mt-1">
                   Para alterar a sua senha de acesso, contacte o Administrador do sistema ou utilize a opção de redefinição nas configurações centrais.
                 </p>
               </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Fechar
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex-[2] py-4 px-6 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? 'A guardar alterações...' : 'Atualizar Perfil'}
              </button>
            </div>
          </form>

          <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">SROC Security Module • Account ID: {user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
