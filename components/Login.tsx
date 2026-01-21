
import React, { useState } from 'react';
import { User, SystemConfig } from '../types';
import { authAPI } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
  config: SystemConfig;
}

const Login: React.FC<LoginProps> = ({ onLogin, config }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await authAPI.login(username, password);
      onLogin(response.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>

      {/* Animated Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-gradient-to-r from-indigo-600/30 to-violet-600/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-gradient-to-r from-blue-600/20 to-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-gradient-to-r from-purple-600/20 to-pink-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      ></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="relative bg-white/[0.08] backdrop-blur-2xl rounded-3xl p-10 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          {/* Logo Section */}
          <div className="text-center mb-10 relative">
            {config.logo ? (
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="relative max-w-[180px] max-h-[90px] p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center transition-all duration-500 hover:scale-105 hover:border-white/30">
                    <img
                      src={config.logo}
                      alt="Logótipo"
                      className="w-auto h-auto max-w-full max-h-full object-contain filter drop-shadow-lg"
                    />
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">{config.institutionName}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="relative inline-block group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-4xl text-white shadow-2xl transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                    S
                  </div>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight mt-6 mb-2">SROC</h1>
                <p className="text-indigo-400 font-bold text-[11px] uppercase tracking-[0.25em]">Terminal Operacional</p>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
                <span>Utilizador</span>
              </label>
              <div className={`relative group transition-all duration-300 ${focusedField === 'username' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/50 to-violet-500/50 blur-lg opacity-0 group-hover:opacity-30 transition-opacity ${focusedField === 'username' ? 'opacity-40' : ''}`}></div>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'username' ? 'text-indigo-400' : 'text-white/40'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-semibold text-white placeholder:text-white/30 text-sm"
                    placeholder="Digite seu utilizador"
                    value={username}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    onChange={e => {
                      setUsername(e.target.value);
                      setError('');
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
                <span>Senha</span>
              </label>
              <div className={`relative group transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/50 to-violet-500/50 blur-lg opacity-0 group-hover:opacity-30 transition-opacity ${focusedField === 'password' ? 'opacity-40' : ''}`}></div>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-400' : 'text-white/40'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-14 py-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-semibold text-white placeholder:text-white/30 text-sm"
                    placeholder="Digite sua senha"
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={e => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-3 text-rose-300 text-[13px] font-medium bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 animate-in shake duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full py-4 mt-2 rounded-xl font-bold text-sm uppercase tracking-wider overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Button Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600"></div>

              {/* Button Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

              {/* Button Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>

              {/* Button Content */}
              <div className="relative flex items-center justify-center space-x-3 text-white">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>A validar...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">
              Conexão Segura e Encriptada
            </p>

          </div>
        </div>

        {/* Bottom Branding */}
        <div className="text-center mt-6">
          <p className="text-[10px] text-white/20 font-medium">
            © 2026 {config.institutionName}. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* CSS Animation for float effect */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-20px) translateX(5px); opacity: 0.5; }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;

