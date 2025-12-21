
import React, { useState } from 'react';

interface AliasSettingProps {
  onFinish: (alias: string) => void;
}

const AliasSetting: React.FC<AliasSettingProps> = ({ onFinish }) => {
  const [alias, setAlias] = useState('');

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark p-6 justify-center">
      <div className="mb-10 text-center">
        <div className="size-24 rounded-full bg-primary flex items-center justify-center text-black mx-auto mb-8 shadow-xl shadow-primary/20 group animate-in zoom-in duration-500">
          <span className="material-symbols-outlined text-5xl font-black transition-transform group-hover:scale-110">face</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter leading-tight">¿Cómo quieres que te llamemos?</h1>
        <p className="text-slate-500 mt-2 font-medium">Tu entrenador IA te saludará por este nombre.</p>
      </div>

      <div className="space-y-6 max-w-xs mx-auto w-full">
        <input 
          type="text" 
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Tu apodo o nombre"
          className="w-full bg-white dark:bg-surface-dark border-0 ring-1 ring-black/5 dark:ring-white/10 focus:ring-4 focus:ring-primary/20 rounded-[1.5rem] py-6 px-6 text-2xl font-black text-center placeholder:text-slate-300 shadow-sm transition-all"
          autoFocus
        />
        
        <button 
          onClick={() => onFinish(alias || 'Atleta')}
          className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-lg shadow-2xl active:scale-95 transition-all uppercase tracking-widest"
        >
          ¡Todo listo!
        </button>
      </div>
    </div>
  );
};

export default AliasSetting;
