
import React, { useState } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface ForcePasswordChangeModalProps {
    user: User;
    onPasswordChanged: (updatedUser: User) => void;
}

const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({ user, onPasswordChanged }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.changePassword(user.id, currentPassword, newPassword);

            // Atualizar o objeto do usuário localmente
            const updatedUser = { ...user, requiresPasswordChange: false };
            onPasswordChanged(updatedUser);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao alterar senha. Verifique a senha atual.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center bg-slate-50/50 border-b border-slate-100">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-indigo-50">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Primeiro Acesso</h3>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed mt-2">
                        Por motivos de segurança, deve alterar a sua senha temporária para continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual (Temporária)</label>
                        <input
                            type="password" required
                            className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500/50 outline-none font-bold text-slate-700 text-sm transition-all"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha Pessoal</label>
                        <input
                            type="password" required
                            className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500/50 outline-none font-bold text-slate-700 text-sm transition-all"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                        <input
                            type="password" required
                            className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500/50 outline-none font-bold text-slate-700 text-sm transition-all"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 active:scale-95 transition-all hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isLoading ? 'A Processar...' : 'Atualizar e Entrar'}
                    </button>
                </form>

                <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">SROC Security Policy - First Time Login</p>
                </div>
            </div>
        </div>
    );
};

export default ForcePasswordChangeModal;
