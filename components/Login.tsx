
import React from 'react';
import { InputField } from './Signup';

interface LoginProps {
  onBack: () => void;
  onLogin: () => void;
  onSignupClick: () => void;
  onForgotPasswordClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onLogin, onSignupClick, onForgotPasswordClick }) => {
  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark font-display relative animate-in fade-in duration-500">
      <div className="flex items-center p-4 pb-2 justify-between">
        <button onClick={onBack} className="flex size-12 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="text-sm font-black uppercase tracking-widest text-slate-400">Iniciar Sesión</div>
        <div className="size-12"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto pb-8 no-scrollbar">
        <div className="pt-4 pb-2">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-[1.1]">Bienvenido de nuevo.</h1>
        </div>
        <div className="pb-8">
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed">Tu progreso te está esperando. Retoma tus rutinas donde las dejaste.</p>
        </div>

        <div className="space-y-3">
          <button className="flex w-full items-center justify-center rounded-full h-12 bg-black dark:bg-white text-white dark:text-black font-bold gap-2.5 active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined text-[20px]">ios</span>
            <span>Continuar con Apple</span>
          </button>
          <button className="flex w-full items-center justify-center rounded-full h-12 border border-black/10 dark:border-white/10 bg-transparent font-bold gap-2.5 active:scale-[0.98] transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <div className="flex items-center py-6">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
          <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">O inicia con email</span>
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <InputField label="Correo Electrónico" placeholder="tu@email.com" icon="mail" type="email" />
          <InputField label="Contraseña" placeholder="Tu contraseña" icon="visibility" type="password" />

          <div className="flex justify-end pr-1">
            <button 
              type="button" 
              onClick={onForgotPasswordClick}
              className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest active:scale-95 transition-all hover:opacity-70"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="pt-4">
            <button className="w-full rounded-full bg-primary py-4 px-6 text-[#181811] text-base font-black shadow-xl shadow-primary/20 active:scale-[0.98] transition-all uppercase tracking-widest" type="submit">
              Entrar
            </button>
          </div>
        </form>

        <div className="pt-6 text-center">
          <p className="text-sm text-slate-500 font-medium">
            ¿No tienes cuenta? <button onClick={onSignupClick} className="font-black text-slate-900 dark:text-white ml-1 active:scale-95 transition-all">Regístrate gratis</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
