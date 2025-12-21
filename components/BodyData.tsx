
import React, { useState } from 'react';

interface BodyDataProps {
  onNext: (data: { gender: 'Male' | 'Female'; age: number; weight: number; height: number }) => void;
}

const BodyData: React.FC<BodyDataProps> = ({ onNext }) => {
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark p-6 overflow-y-auto no-scrollbar">
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-bold leading-tight">Tus Datos Corporales</h1>
        <p className="text-slate-500 mt-1">Necesitamos esto para calcular tus cargas de forma segura.</p>
      </div>

      <div className="space-y-10">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] ml-1">Género</label>
          <div className="flex gap-3">
            <button 
              onClick={() => setGender('Male')}
              className={`flex-1 py-5 rounded-[2rem] font-bold transition-all border-2 ${gender === 'Male' ? 'bg-primary text-black border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-white dark:bg-surface-dark border-black/5 text-slate-400'}`}
            >
              Hombre
            </button>
            <button 
              onClick={() => setGender('Female')}
              className={`flex-1 py-5 rounded-[2rem] font-bold transition-all border-2 ${gender === 'Female' ? 'bg-primary text-black border-primary shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-white dark:bg-surface-dark border-black/5 text-slate-400'}`}
            >
              Mujer
            </button>
          </div>
        </div>

        <NumberInput label="Edad (Años)" value={age} onChange={setAge} min={14} max={99} step={1} />
        <NumberInput label="Peso (kg)" value={weight} onChange={setWeight} min={30} max={250} step={0.5} />
        <NumberInput label="Altura (cm)" value={height} onChange={setHeight} min={100} max={230} step={1} />
      </div>

      <button 
        onClick={() => onNext({ gender, age, weight, height })}
        className="w-full mt-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all"
      >
        Continuar
      </button>
    </div>
  );
};

export const NumberInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }> = ({ label, value, onChange, min, max, step = 1 }) => (
  <div className="group">
    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-primary">{label}</label>
    <div className="flex items-center gap-3 bg-white dark:bg-surface-dark p-2 rounded-[2.5rem] border-2 border-black/5 focus-within:border-primary transition-all shadow-sm">
      <button 
        onClick={() => onChange(Math.max(min, value - step))} 
        className="size-16 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center active:scale-90 active:bg-red-50 dark:active:bg-red-950/20 transition-all text-slate-600 dark:text-slate-300"
      >
        <span className="material-symbols-outlined text-3xl font-bold">remove</span>
      </button>
      
      <div className="flex-1 text-center">
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent border-0 p-0 text-center font-black text-3xl focus:ring-0 tabular-nums"
        />
      </div>

      <button 
        onClick={() => onChange(Math.min(max, value + step))} 
        className="size-16 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center active:scale-90 active:bg-green-50 dark:active:bg-green-950/20 transition-all text-slate-600 dark:text-slate-300"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>
    </div>
  </div>
);

export default BodyData;
