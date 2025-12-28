
import React, { useState, useEffect, useRef } from 'react';

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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Fix: Using ReturnType<typeof setInterval> to avoid NodeJS namespace dependency in browser environment
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mínimo de pixeles para considerar un swipe
  const minSwipeDistance = 50;

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    }, 5000);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    stopAutoPlay();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      startAutoPlay();
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev > 0 ? prev - 1 : ONBOARDING_SLIDES.length - 1));
    }

    startAutoPlay();
  };

  return (
    <div 
      className="h-full flex flex-col bg-background-dark text-white font-display overflow-hidden relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Contenedor de Imágenes Responsivas */}
      <div className="absolute inset-0 z-0">
        {ONBOARDING_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              currentSlide === index 
                ? 'opacity-60 scale-100' 
                : 'opacity-0 scale-110'
            }`}
          >
            <img 
              src={slide.img} 
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
        {/* Capas de Degradado para Legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/30 via-background-dark/50 to-background-dark"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>
      </div>

      {/* Header con Safe Area */}
      <div className="relative z-20 pt-[calc(max(2rem,env(safe-area-inset-top))+1.5rem)] px-6 flex justify-between items-center pb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-black font-bold text-xl">fitness_center</span>
          </div>
          <span className="font-black tracking-tighter text-lg uppercase">GYMPROGRESS</span>
        </div>
        <button 
          onClick={onStart}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md active:scale-90 transition-all"
        >
          Saltar
        </button>
      </div>

      {/* Cuerpo del Onboarding */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-10">
        <div className="mb-10">
          {/* Indicadores Sincronizados */}
          <div className="flex gap-2 mb-10">
            {ONBOARDING_SLIDES.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentSlide === i ? 'w-12 bg-primary' : 'w-3 bg-white/20'
                }`}
                aria-label={`Ir al slide ${i + 1}`}
              />
            ))}
          </div>
          
          <div 
            className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700"
            key={currentSlide} // Fuerza re-animación al cambiar
          >
            <div className="flex items-center gap-3">
              <div className={`size-12 rounded-2xl bg-white/5 flex items-center justify-center backdrop-blur-sm border border-white/10 ${ONBOARDING_SLIDES[currentSlide].color}`}>
                <span className="material-symbols-outlined text-3xl">
                  {ONBOARDING_SLIDES[currentSlide].icon}
                </span>
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Rendimiento Real</h2>
            </div>
            
            <h1 className="text-5xl font-black leading-[1.0] tracking-tighter">
              {ONBOARDING_SLIDES[currentSlide].title.split(' ').map((word, i, arr) => (
                <span key={i} className={i === arr.length - 1 ? 'text-primary' : ''}>{word} </span>
              ))}
            </h1>
            
            <p className="text-slate-300 text-lg leading-relaxed font-medium max-w-[320px]">
              {ONBOARDING_SLIDES[currentSlide].description}
            </p>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="flex flex-col gap-6 mt-4">
          <button 
            onClick={onStart}
            className="group relative w-full h-24 bg-primary text-black font-black text-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(255,239,10,0.3)] flex items-center justify-center gap-4 overflow-hidden transition-all active:scale-[0.96] active:shadow-none"
          >
            <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 skew-x-12"></div>
            <span className="relative z-10 uppercase tracking-tighter">COMENZAR MI CAMBIO</span>
            <span className="material-symbols-outlined relative z-10 font-black text-3xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </button>
          
          <div className="flex items-center justify-center gap-3 opacity-50">
             <div className="h-px w-8 bg-white/20"></div>
             <p className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase">
                Desliza para explorar
             </p>
             <div className="h-px w-8 bg-white/20"></div>
          </div>
        </div>
      </div>
      
      {/* Efectos de fondo difuminados */}
      <div className="absolute top-1/4 -right-20 size-96 bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 size-96 bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default Onboarding;
