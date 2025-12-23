
import React, { useState } from 'react';
import { InputField } from './Signup';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark font-display relative animate-in fade-in duration-500">
      <div className="flex items-center p-4 pb-2 justify-between">
        <button onClick={onBack} className="flex size-12 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-90">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="text-sm font-black uppercase tracking-widest text-slate-400">Recuperar Acceso</div>
        <div className="size-12"></div>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto pb-8 no-scrollbar">
        {!submitted ? (
          <>
            <div className="pt-4 pb-2">
              <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-[1.1]">¿Problemas para entrar?</h1>
            </div>
            <div className="pb-8">
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed">No te preocupes. Introduce tu email y te enviaremos instrucciones para resetear tu contraseña.</p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <InputField label="Correo Electrónico" placeholder="tu@email.com" icon="mail" type="email" />

              <div className="pt-4">
                <button className="w-full rounded-full bg-black dark:bg-white text-white dark:text-black py-4 px-6 text-base font-black shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest" type="submit">
                  Enviar Instrucciones
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="size-24 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-5xl font-black">mark_email_read</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-4 leading-none text-slate-900 dark:text-white">Email Enviado</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed max-w-[280px] mb-10">
              Revisa tu bandeja de entrada. Te hemos enviado un enlace para crear una nueva contraseña.
            </p>
            <button 
              onClick={onBack}
              className="w-full rounded-full bg-primary text-black py-4 px-6 text-base font-black shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {!submitted && (
          <div className="pt-10 text-center">
            <button onClick={onBack} className="text-sm font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all">Cancelar y volver</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
