
import React from 'react';

interface SignupProps {
  onBack: () => void;
  onSignup: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBack, onSignup }) => {
  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark font-display relative">
      <div className="flex items-center p-4 pb-2 justify-between">
        <button onClick={onBack} className="flex size-12 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Registrarse</div>
        <div className="size-12"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto pb-8">
        <div className="pt-4 pb-2">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-[1.1]">Hecho para la constancia.</h1>
        </div>
        <div className="pb-8">
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed">Entrena, analiza tu forma y mantente libre de lesiones. Únete a la comunidad hoy.</p>
        </div>

        <div className="space-y-3">
          <button className="flex w-full items-center justify-center rounded-full h-12 bg-[#181811] dark:bg-white text-white dark:text-[#181811] font-bold gap-2.5">
            <span className="material-symbols-outlined text-[20px]">ios</span>
            <span>Continuar con Apple</span>
          </button>
          <button className="flex w-full items-center justify-center rounded-full h-12 border border-black/10 dark:border-white/10 bg-transparent font-bold gap-2.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
            <span>Continuar con Google</span>
          </button>
        </div>

        <div className="flex items-center py-6">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
          <span className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">O regístrate con email</span>
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSignup(); }}>
          <InputField label="Nombre Completo" placeholder="Tu nombre" icon="person" type="text" />
          <InputField label="Correo Electrónico" placeholder="tu@email.com" icon="mail" type="email" />
          <InputField label="Contraseña" placeholder="Crea una contraseña" icon="visibility" type="password" />

          <div className="pt-4">
            <button className="w-full rounded-full bg-primary py-4 px-6 text-[#181811] text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all" type="submit">
              Crear Cuenta Gratis
            </button>
          </div>
        </form>

        <div className="pt-4 text-center">
          <p className="text-sm text-slate-500">
            ¿Ya eres miembro? <button className="font-bold text-slate-900 dark:text-white">Inicia Sesión</button>
          </p>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{ label: string; placeholder: string; icon: string; type: string }> = ({ label, placeholder, icon, type }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold ml-1">{label}</label>
    <div className="relative">
      <input 
        className="w-full rounded-full border-0 bg-background-light dark:bg-background-dark py-3.5 px-5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5" 
        placeholder={placeholder} 
        type={type} 
      />
      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">{icon}</span>
    </div>
  </div>
);

export default Signup;
