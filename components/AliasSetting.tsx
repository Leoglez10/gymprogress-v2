
import React, { useState, useMemo } from 'react';

interface AliasSettingProps {
  onFinish: (alias: string) => void;
}

const AliasSetting: React.FC<AliasSettingProps> = ({ onFinish }) => {
  const [alias, setAlias] = useState('');
  const [showError, setShowError] = useState(false);

  const MAX_LENGTH = 15;

  const handleInputChange = (val: string) => {
    // Regex: Solo letras, números y espacios
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]*$/;
    
    if (regex.test(val) && val.length <= MAX_LENGTH) {
      setAlias(val);
      setShowError(false);
    } else if (val.length > MAX_LENGTH) {
      // Ignorar si supera el largo
      return;
    } else {
      // Feedback visual de error si intenta poner caracteres especiales
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  const isInvalid = useMemo(() => alias.trim().length < 2, [alias]);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark p-6 justify-center animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <div className="size-24 rounded-[2rem] bg-primary flex items-center justify-center text-black mx-auto mb-8 shadow-2xl shadow-primary/20 group animate-in zoom-in duration-700">
          <span className="material-symbols-outlined text-5xl font-black transition-transform group-hover:rotate-12">face</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter leading-none">¿Cómo te llamas?</h1>
        <p className="text-slate-500 mt-3 font-medium text-lg leading-tight">Tu entrenador IA te saludará así.</p>
      </div>

      <div className="space-y-6 max-w-xs mx-auto w-full">
        <div className="relative">
          <input 
            type="text" 
            value={alias}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Tu apodo o nombre"
            className={`w-full bg-white dark:bg-surface-dark border-2 ring-offset-4 ring-offset-background-light dark:ring-offset-background-dark focus:ring-4 transition-all rounded-[2rem] py-6 px-6 text-2xl font-black text-center placeholder:text-slate-300 shadow-sm outline-none ${
              showError 
                ? 'border-rose-500 ring-rose-500/20 animate-shake' 
                : 'border-black/5 focus:border-primary focus:ring-primary/10'
            }`}
            autoFocus
          />
          
          <div className="flex justify-between mt-3 px-4">
             <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${showError ? 'text-rose-500' : 'text-slate-400'}`}>
                {showError ? 'Solo letras y números' : 'Sin caracteres especiales'}
             </span>
             <span className={`text-[10px] font-black tabular-nums ${alias.length >= MAX_LENGTH ? 'text-rose-500' : 'text-slate-300'}`}>
                {alias.length}/{MAX_LENGTH}
             </span>
          </div>
        </div>
        
        <button 
          onClick={() => !isInvalid && onFinish(alias.trim())}
          disabled={isInvalid}
          className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-xl shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-20 disabled:grayscale"
        >
          {isInvalid ? 'ESCRIBE TU NOMBRE' : '¡TODO LISTO!'}
        </button>

        {isInvalid && alias.length > 0 && (
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Mínimo 2 caracteres
          </p>
        )}
      </div>
    </div>
  );
};

export default AliasSetting;
