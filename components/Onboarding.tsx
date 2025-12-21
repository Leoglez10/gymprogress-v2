
import React, { useState, useEffect } from 'react';

interface OnboardingProps {
  onStart: () => void;
}

const ONBOARDING_SLIDES = [
  {
    title: "Vence a tu versión de ayer",
    description: "Visualiza tus récords anteriores mientras entrenas. La clave es la sobrecarga progresiva inteligente.",
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop",
    icon: "trending_up",
    color: "text-primary"
  },
  {
    title: "Control de Fatiga ACWR",
    description: "Analizamos tu carga de trabajo para decirte cuándo apretar y cuándo es mejor descansar.",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    icon: "monitoring",
    color: "text-blue-400"
  },
  {
    title: "Entrena sin Conexión",
    description: "Tus rutinas y progresos siempre contigo, incluso en el sótano del gimnasio más remoto.",
    img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
    icon: "cloud_off",
    color: "text-green-400"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onStart }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background-dark text-white font-display overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        {ONBOARDING_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-40 scale-105' : 'opacity-0 scale-100'}`}
            style={{ backgroundImage: `url("${slide.img}")` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/20 via-background-dark/60 to-background-dark"></div>
      </div>

      <div className="relative z-20 pt-[env(safe-area-inset-top)] px-6 flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-black font-bold text-xl">fitness_center</span>
          </div>
          <span className="font-bold tracking-tighter text-lg uppercase">GYMPROGRESS</span>
        </div>
        <button 
          onClick={onStart}
          className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 backdrop-blur-md active:scale-95 transition-all"
        >
          Saltar
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-10">
        <div className="mb-10">
          <div className="flex gap-1.5 mb-8">
            {ONBOARDING_SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-10 bg-primary' : 'w-2.5 bg-white/20'}`}
              />
            ))}
          </div>
          
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-4xl ${ONBOARDING_SLIDES[currentSlide].color}`}>
                {ONBOARDING_SLIDES[currentSlide].icon}
              </span>
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Rendimiento Real</h2>
            </div>
            
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
              {ONBOARDING_SLIDES[currentSlide].title.split(' ').map((word, i, arr) => (
                <span key={i} className={i === arr.length - 1 ? 'text-primary' : ''}>{word} </span>
              ))}
            </h1>
            
            <p className="text-slate-300 text-xl leading-relaxed max-w-[300px]">
              {ONBOARDING_SLIDES[currentSlide].description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 mt-2">
          <button 
            onClick={onStart}
            className="group relative w-full h-24 bg-gradient-to-r from-primary to-orange-400 text-black font-black text-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,239,10,0.3)] flex items-center justify-center gap-4 overflow-hidden transition-all active:scale-[0.96] active:shadow-none active:translate-y-1"
          >
            <div className="absolute inset-0 bg-white/40 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 skew-x-12"></div>
            <span className="relative z-10 uppercase tracking-tighter">COMENZAR MI CAMBIO</span>
            <span className="material-symbols-outlined relative z-10 font-black text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          
          <p className="text-center text-[11px] text-slate-500 font-bold tracking-wide uppercase opacity-60">
            Únete a la comunidad • Empieza hoy
          </p>
        </div>
      </div>
      
      <div className="absolute top-1/4 -right-20 size-80 bg-primary/10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 size-80 bg-blue-500/10 blur-[140px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default Onboarding;
