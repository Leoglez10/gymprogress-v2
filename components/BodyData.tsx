
import React, { useState } from 'react';

interface BodyDataProps {
  onNext: (data: { gender: 'Male' | 'Female'; age: number; weight: number; height: number }) => void;
}

const VALID_LIMITS = {
  age: { min: 12, max: 100 },
  weight: { min: 30, max: 350 },
  height: { min: 100, max: 250 }
};

const BodyData: React.FC<BodyDataProps> = ({ onNext }) => {
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);

  const isDataValid = 
    age >= VALID_LIMITS.age.min && age <= VALID_LIMITS.age.max &&
    weight >= VALID_LIMITS.weight.min && weight <= VALID_LIMITS.weight.max &&
    height >= VALID_LIMITS.height.min && height <= VALID_LIMITS.height.max;

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark p-6 overflow-y-auto no-scrollbar">
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">Tus Datos Corporales</h1>
        <p className="text-slate-500 mt-1 font-medium leading-tight">Necesitamos esto para calcular tus cargas de forma segura.</p>
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

        <NumberInput label="Edad (Años)" value={age} onChange={setAge} min={VALID_LIMITS.age.min} max={VALID_LIMITS.age.max} step={1} />
        <NumberInput label="Peso (kg)" value={weight} onChange={setWeight} min={VALID_LIMITS.weight.min} max={VALID_LIMITS.weight.max} step={0.5} />
        <NumberInput label="Altura (cm)" value={height} onChange={setHeight} min={VALID_LIMITS.height.min} max={VALID_LIMITS.height.max} step={1} />
      </div>

      <button 
        onClick={() => isDataValid && onNext({ gender, age, weight, height })}
        disabled={!isDataValid}
        className="w-full mt-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
      >
        {isDataValid ? 'Continuar' : 'Datos no válidos'}
      </button>
      
      {!isDataValid && (
        <p className="text-center text-rose-500 font-bold text-[10px] uppercase tracking-widest mt-4 animate-pulse">
          Revisa que tus medidas sean realistas
        </p>
      )}
    </div>
  );
};

export const NumberInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }> = ({ label, value, onChange, min, max, step = 1 }) => {
  const isAtMin = value <= min;
  const isAtMax = value >= max;
  const isInvalid = value < min || value > max;

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-3 px-1">
        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isInvalid ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary'}`}>
          {label}
        </label>
        {isInvalid && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-in fade-in">Fuera de rango</span>}
      </div>
      
      <div className={`flex items-center gap-3 bg-white dark:bg-surface-dark p-2 rounded-[2.5rem] border-2 transition-all shadow-sm ${isInvalid ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-black/5 focus-within:border-primary'}`}>
        <button 
          onClick={() => onChange(Math.max(min, value - step))} 
          disabled={isAtMin}
          className={`size-16 rounded-full flex items-center justify-center transition-all ${isAtMin ? 'opacity-20 grayscale' : 'bg-slate-100 dark:bg-background-dark active:scale-90 active:bg-red-50 dark:active:bg-red-950/20 text-slate-600 dark:text-slate-300'}`}
        >
          <span className="material-symbols-outlined text-3xl font-bold">remove</span>
        </button>
        
        <div className="flex-1 text-center">
          <input 
            type="number" 
            value={value} 
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (val < min) onChange(min);
              if (val > max) onChange(max);
            }}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`w-full bg-transparent border-0 p-0 text-center font-black text-3xl focus:ring-0 tabular-nums ${isInvalid ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}
          />
        </div>

        <button 
          onClick={() => onChange(Math.min(max, value + step))} 
          disabled={isAtMax}
          className={`size-16 rounded-full flex items-center justify-center transition-all ${isAtMax ? 'opacity-20 grayscale' : 'bg-slate-100 dark:bg-background-dark active:scale-90 active:bg-green-50 dark:active:bg-green-950/20 text-slate-600 dark:text-slate-300'}`}
        >
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </button>
      </div>
    </div>
  );
};

export default BodyData;
