
import React, { useState, useRef } from 'react';
import { UserProfile, NotificationSettings } from '../types';
import { NumberInput } from './BodyData';
import { getTargetVolumeRecommendation } from '../services/geminiService';

interface ProfileProps {
  onBack: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onLogout: () => void;
  accSettings: {
    highContrast: boolean; setHighContrast: (v: boolean) => void;
    reducedMotion: boolean; setReducedMotion: (v: boolean) => void;
    highlightedButtons: boolean; setHighlightedButtons: (v: boolean) => void;
  };
}

const VALID_LIMITS = {
  age: { min: 12, max: 100 },
  weight: { min: 30, max: 350 },
  height: { min: 100, max: 250 }
};

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574680077505-7250077dad92?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=400&auto=format&fit=crop"
];

const Profile: React.FC<ProfileProps> = ({ onBack, isDarkMode, setIsDarkMode, userProfile, onUpdateProfile, onLogout, accSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({ ...userProfile });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showWeightSuggestion, setShowWeightSuggestion] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [recommendedVolume, setRecommendedVolume] = useState<number | null>(null);

  const isFormValid = 
    editForm.age >= VALID_LIMITS.age.min && editForm.age <= VALID_LIMITS.age.max &&
    editForm.weight >= VALID_LIMITS.weight.min && editForm.weight <= VALID_LIMITS.weight.max &&
    editForm.height >= VALID_LIMITS.height.min && editForm.height <= VALID_LIMITS.height.max &&
    editForm.alias.trim().length > 0;

  const handleSaveAttempt = () => {
    if (!isFormValid) return;
    
    if (editForm.weight !== userProfile.weight) {
      setShowWeightSuggestion(true);
    } else {
      onUpdateProfile(editForm);
      setIsEditing(false);
    }
  };

  const handleFinalSave = (newVolume?: number) => {
    const finalProfile = {
      ...editForm,
      goalSettings: {
        ...editForm.goalSettings,
        targetVolumePerWeek: newVolume !== undefined ? newVolume : editForm.goalSettings.targetVolumePerWeek
      }
    };
    onUpdateProfile(finalProfile);
    setIsEditing(false);
    setShowWeightSuggestion(false);
    setAiResult(null);
    setRecommendedVolume(null);
  };

  const handleAskAI = async () => {
    setAiLoading(true);
    try {
      const response = await getTargetVolumeRecommendation(editForm);
      setAiResult(response);
      
      const allNumbers = response.match(/\d+[\d,.]*/g);
      if (allNumbers) {
        const numbers = allNumbers.map(n => parseFloat(n.replace(/[,.]/g, '')));
        const volumeCandidate = numbers.find(n => n > 500) || numbers[numbers.length - 1];
        if (volumeCandidate) setRecommendedVolume(volumeCandidate);
      }
    } catch (e) {
      setAiResult("No pude conectar con el Coach IA. Basado en tu nuevo peso, te sugiero ajustar tu volumen.");
      setRecommendedVolume(editForm.weight * 200);
    }
    setAiLoading(false);
  };

  const handleAvatarSelect = (url: string) => {
    onUpdateProfile({ ...userProfile, avatarUrl: url });
    setEditForm({ ...editForm, avatarUrl: url });
    setShowAvatarPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onUpdateProfile({ ...userProfile, avatarUrl: base64String });
      setEditForm({ ...editForm, avatarUrl: base64String });
      setIsUploading(false);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUnitChange = (newUnit: 'kg' | 'lb') => {
    if (newUnit === userProfile.weightUnit) {
      setShowUnitModal(false);
      return;
    }
    const factor = newUnit === 'lb' ? 2.20462 : 0.453592;
    const updatedProfile: UserProfile = {
      ...userProfile,
      weightUnit: newUnit,
      weight: parseFloat((userProfile.weight * factor).toFixed(1)),
      goalSettings: {
        ...userProfile.goalSettings,
        targetVolumePerWeek: Math.round(userProfile.goalSettings.targetVolumePerWeek * factor)
      }
    };
    onUpdateProfile(updatedProfile);
    setEditForm(updatedProfile);
    setShowUnitModal(false);
  };

  const handleToggleNotification = (key: keyof NotificationSettings) => {
    const nextSettings = {
      ...userProfile.notificationSettings,
      [key]: !userProfile.notificationSettings[key]
    };
    onUpdateProfile({
      ...userProfile,
      notificationSettings: nextSettings
    });
  };

  const headerStyle = "sticky top-0 z-[60] bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 pt-[calc(max(1rem,env(safe-area-inset-top))+0.75rem)] pb-4 px-6 transition-all";
  const currentAvatar = userProfile.avatarUrl || PRESET_AVATARS[0];

  if (isEditing) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-300">
        <header className={headerStyle}>
          <div className="flex items-center justify-between">
            <button onClick={() => setIsEditing(false)} className="cursor-pointer text-slate-400 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-black/5 active:scale-95 transition-all">Cancelar</button>
            <h2 className="text-xl font-black tracking-tighter">Ajustes</h2>
            <button 
              onClick={handleSaveAttempt} 
              disabled={!isFormValid}
              className="cursor-pointer text-black font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              Guardar
            </button>
          </div>
        </header>
        <main className="p-6 space-y-10 overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Tu Identidad</label>
            <div className="relative">
              <input type="text" value={editForm.alias} onChange={(e) => setEditForm({...editForm, alias: e.target.value})} className="w-full bg-white dark:bg-surface-dark border-2 border-black/5 rounded-[1.5rem] py-5 px-6 text-xl font-black focus:ring-4 focus:ring-primary/20 shadow-sm transition-all outline-none" placeholder="Nombre de atleta" />
              <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">edit</span>
            </div>
          </div>
          <div className="space-y-8 bg-white dark:bg-surface-dark p-8 rounded-[3rem] border border-black/5 shadow-sm">
            <NumberInput label="Edad" value={editForm.age} onChange={(v) => setEditForm({...editForm, age: v})} min={VALID_LIMITS.age.min} max={VALID_LIMITS.age.max} />
            <NumberInput label={`Peso (${editForm.weightUnit})`} value={editForm.weight} onChange={(v) => setEditForm({...editForm, weight: v})} min={VALID_LIMITS.weight.min} max={VALID_LIMITS.weight.max} step={0.5} />
            <NumberInput label="Altura (cm)" value={editForm.height} onChange={(v) => setEditForm({...editForm, height: v})} min={VALID_LIMITS.height.min} max={VALID_LIMITS.height.max} />
          </div>

          {!isFormValid && (
             <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20 text-center animate-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">⚠️ Hay datos fuera de los rangos permitidos</p>
             </div>
          )}

          {showWeightSuggestion && (
            <div className="fixed inset-0 z-[150] flex items-end justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => handleFinalSave()}></div>
              <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-[4rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 opacity-40 shrink-0"></div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-10">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="size-20 rounded-[2.2rem] bg-primary/20 text-primary flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-4xl font-black">scale</span>
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter leading-none">¿Ajustamos tus metas?</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      Tu peso ha cambiado a <span className="text-primary-text dark:text-primary font-black">{editForm.weight} {editForm.weightUnit}</span>. ¿Quieres que la IA recalcule tu volumen ideal?
                    </p>
                  </div>

                  {!aiResult ? (
                    <button 
                      onClick={handleAskAI}
                      disabled={aiLoading}
                      className="cursor-pointer w-full h-24 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl relative overflow-hidden"
                    >
                      {aiLoading && <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>}
                      <span className="material-symbols-outlined text-3xl font-black">psychology</span>
                      <div className="text-left">
                        <p className="font-black text-lg leading-none uppercase tracking-tighter">Recalcular con IA</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-1">Ciencia aplicada a tu nuevo peso</p>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                      <div className="p-8 bg-slate-50 dark:bg-background-dark/50 rounded-[3rem] border-2 border-primary/30 text-center">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Carga Semanal Recomendada</p>
                         {recommendedVolume && (
                           <div className="flex flex-col items-center mb-4">
                             <span className="text-6xl font-black tracking-tighter tabular-nums text-primary-text dark:text-primary">
                               {recommendedVolume.toLocaleString()}
                             </span>
                             <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{editForm.weightUnit}</span>
                           </div>
                         )}
                         <p className="text-xs font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed">
                           {aiResult}
                         </p>
                      </div>
                      <button 
                        onClick={() => handleFinalSave(recommendedVolume || undefined)}
                        className="cursor-pointer w-full h-20 bg-primary text-black rounded-full font-black text-lg uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                      >
                        APLICAR NUEVA META
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => handleFinalSave()}
                    className="cursor-pointer w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all"
                  >
                    Mantener metas actuales
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-500`}>
      <header className={headerStyle}>
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="cursor-pointer flex size-11 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-slate-500 active:scale-90 transition-all border border-black/5 shadow-sm">
            <span className="material-symbols-outlined text-2xl font-black">arrow_back</span>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black tracking-tighter leading-none">Mi Perfil</h2>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em] mt-1">Status de Atleta</p>
          </div>
          <button onClick={() => setIsEditing(true)} className="cursor-pointer flex size-11 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-slate-500 active:scale-90 transition-all border border-black/5 shadow-sm">
            <span className="material-symbols-outlined text-2xl font-black">tune</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center p-10 bg-gradient-to-b from-white dark:from-surface-dark to-transparent border-b border-black/5">
        <div className="relative mb-6">
          <button 
            onClick={() => setShowAvatarPicker(true)}
            className="cursor-pointer size-44 rounded-full animate-profile-ring p-1.5 shadow-[0_25px_60px_rgba(96,165,250,0.25)] bg-background-light dark:bg-background-dark active:scale-95 transition-all overflow-hidden"
          >
            <div className="w-full h-full rounded-full border-[6px] border-white dark:border-surface-dark bg-cover bg-center shadow-inner relative overflow-hidden" style={{ backgroundImage: `url("${currentAvatar}")` }}>
            </div>
          </button>
          <button 
            onClick={() => setShowAvatarPicker(true)}
            className="cursor-pointer absolute bottom-1 right-1 size-12 bg-black dark:bg-white rounded-2xl border-4 border-background-light dark:border-background-dark flex items-center justify-center shadow-xl active:scale-90 transition-all group"
          >
             <span className="material-symbols-outlined text-primary dark:text-black font-black text-2xl group-hover:rotate-12 transition-transform">photo_camera</span>
          </button>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black tracking-tighter leading-none">{userProfile.alias || 'Atleta'}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">ID Atleta: #{Math.floor(Math.random()*90000)+10000}</p>
        </div>
      </div>

      <div className="px-6 space-y-10 mt-6">
        <section>
          <div className="flex items-center justify-between mb-5 px-3">
            <h3 className="text-xl font-black tracking-tight">Biometría</h3>
            <span className="material-symbols-outlined text-slate-300">straighten</span>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-sm border border-black/5 divide-y divide-black/5 dark:divide-white/5">
            <DataRow label="Edad" value={`${userProfile.age} años`} />
            <DataRow label="Peso" value={`${userProfile.weight} ${userProfile.weightUnit}`} />
            <DataRow label="Altura" value={`${userProfile.height} cm`} />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-5 px-3">
            <h3 className="text-xl font-black tracking-tight">Notificaciones</h3>
            <span className="material-symbols-outlined text-slate-300">notifications</span>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-sm border border-black/5">
            <PreferenceItem 
              label="Recordatorios Diarios" 
              icon="notifications_active" 
              toggle 
              value={userProfile.notificationSettings.workoutReminders} 
              onToggle={() => handleToggleNotification('workoutReminders')} 
              subtitle="No olvides tu sesión de hoy"
            />
            <PreferenceItem 
              label="Resúmenes Semanales" 
              icon="analytics" 
              toggle 
              value={userProfile.notificationSettings.weeklySummaries} 
              onToggle={() => handleToggleNotification('weeklySummaries')} 
              subtitle="Progreso consolidado cada domingo"
            />
            <PreferenceItem 
              label="Consejos de la IA" 
              icon="psychology" 
              toggle 
              value={userProfile.notificationSettings.aiTips} 
              onToggle={() => handleToggleNotification('aiTips')} 
              subtitle="Sugerencias basadas en tu carga"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-5 px-3">
            <h3 className="text-xl font-black tracking-tight">Centro de Accesibilidad</h3>
            <span className="material-symbols-outlined text-slate-300">visibility</span>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-primary/30">
            <PreferenceItem 
              label="Contraste Elevado" 
              icon="contrast" 
              toggle 
              value={accSettings.highContrast} 
              onToggle={accSettings.setHighContrast} 
              subtitle="Máxima visibilidad solar" 
            />
            <PreferenceItem 
              label="Resaltar Botones" 
              icon="layers" 
              toggle 
              value={accSettings.highlightedButtons} 
              onToggle={accSettings.setHighlightedButtons} 
              subtitle="Añade bordes de alta visibilidad" 
            />
            <PreferenceItem 
              label="Reducir Movimiento" 
              icon="running_with_errors" 
              toggle 
              value={accSettings.reducedMotion} 
              onToggle={accSettings.setReducedMotion} 
              subtitle="Elimina animaciones de interfaz" 
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-5 px-3">
            <h3 className="text-xl font-black tracking-tight">Sistema</h3>
            <span className="material-symbols-outlined text-slate-300">settings</span>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-sm border border-black/5">
            <PreferenceItem label="Modo Noche" icon="dark_mode" toggle value={isDarkMode} onToggle={setIsDarkMode} />
            <PreferenceItem label="Sistema de Peso" icon="sync_alt" value={userProfile.weightUnit.toUpperCase()} onAction={() => setShowUnitModal(true)} />
          </div>
        </section>

        <button 
          onClick={() => setShowLogoutConfirm(true)} 
          className="cursor-pointer w-full h-24 rounded-[3rem] bg-rose-500/10 text-rose-500 font-black text-xs uppercase tracking-[0.25em] border-2 border-rose-500/10 active:scale-95 transition-all mb-12 shadow-sm flex items-center justify-center gap-4"
          style={{ cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined font-black">logout</span>
          Cerrar Sesión
        </button>
      </div>

      {showFullImage && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div onClick={() => setShowFullImage(false)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl cursor-pointer"></div>
          <button onClick={() => setShowFullImage(false)} className="cursor-pointer absolute top-[calc(env(safe-area-inset-top)+1rem)] right-6 size-12 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all z-[260]">
            <span className="material-symbols-outlined font-black text-2xl">close</span>
          </button>
          <div className="relative z-[255] w-full max-w-sm flex flex-col items-center animate-in zoom-in-50 duration-500">
            <div className="w-full aspect-square rounded-[3.5rem] animate-profile-ring p-1.5 shadow-[0_0_120px_rgba(96,165,250,0.4)] overflow-hidden mb-10">
              <div className="w-full h-full rounded-[3.1rem] bg-cover bg-center border-[12px] border-black/40" style={{ backgroundImage: `url("${currentAvatar}")` }}></div>
            </div>
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-primary font-black text-3xl">verified</span>
                <h4 className="text-white font-black text-4xl tracking-tighter uppercase">{userProfile.alias || 'Atleta'}</h4>
              </div>
              <p className="text-slate-400 font-black text-[12px] uppercase tracking-[0.4em]">Identidad Atleta Confirmada</p>
            </div>
          </div>
        </div>
      )}

      {showAvatarPicker && (
        <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-xl flex items-end justify-center animate-in fade-in duration-300">
          <div onClick={() => setShowAvatarPicker(false)} className="absolute inset-0 z-0 cursor-pointer"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] shadow-2xl animate-in slide-in-from-bottom duration-500 relative z-10 flex flex-col max-h-[92vh]">
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-5 mb-2 opacity-40"></div>
            
            <div className="p-8 pt-4 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
               <div>
                 <h3 className="text-3xl font-black tracking-tighter">Avatar Studio</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personaliza tu perfil</p>
               </div>
               <button onClick={() => setShowAvatarPicker(false)} className="cursor-pointer size-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><span className="material-symbols-outlined font-black">close</span></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-16">
               <div className="space-y-5">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Tu Galería</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="cursor-pointer w-full group relative overflow-hidden bg-primary/5 border-2 border-dashed border-primary/40 rounded-[2.5rem] p-10 transition-all active:scale-[0.98] active:bg-primary/10"
                  >
                    <div className="flex flex-col items-center gap-4">
                       <div className="size-16 rounded-full bg-primary text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-3xl font-black">
                            {isUploading ? 'sync' : 'cloud_upload'}
                          </span>
                       </div>
                       <div className="text-center">
                          <p className="font-black text-lg uppercase tracking-tighter leading-none">Subir desde dispositivo</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Formatos: JPG, PNG • Max 5MB</p>
                       </div>
                    </div>
                  </button>
               </div>

               <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Presets de Atleta</p>
                  <div className="grid grid-cols-3 gap-4">
                     {PRESET_AVATARS.map((url, i) => (
                       <button 
                        key={i} 
                        onClick={() => handleAvatarSelect(url)} 
                        className={`cursor-pointer aspect-square rounded-3xl bg-cover bg-center border-[4px] transition-all active:scale-90 relative overflow-hidden group ${userProfile.avatarUrl === url ? 'border-primary shadow-xl scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                        style={{ backgroundImage: `url("${url}")` }}
                       >
                         {userProfile.avatarUrl === url && (
                           <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                              <div className="size-8 rounded-full bg-primary flex items-center justify-center shadow-lg animate-in zoom-in">
                                 <span className="material-symbols-outlined text-black font-black">check</span>
                              </div>
                           </div>
                         )}
                       </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-8 pt-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md">
              <button onClick={() => setShowAvatarPicker(false)} className="cursor-pointer w-full py-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">CERRAR STUDIO</button>
            </div>
          </div>
        </div>
      )}

      {showUnitModal && (
        <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-2xl flex items-end animate-in fade-in duration-300 p-4 pb-0">
          <div onClick={() => setShowUnitModal(false)} className="absolute inset-0 cursor-pointer"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] p-10 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col items-center text-center">
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-10 opacity-40"></div>
            <h3 className="text-3xl font-black tracking-tighter mb-4">Cambio de Sistema</h3>
            <div className="w-full bg-slate-50 dark:bg-background-dark/50 p-8 rounded-[2.5rem] border border-black/5 mb-10 flex items-center justify-around">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Actual</p>
                  <p className="text-2xl font-black tabular-nums">{userProfile.weight} <span className="text-xs text-slate-400 font-bold">{userProfile.weightUnit}</span></p>
               </div>
               <span className="material-symbols-outlined text-primary font-black">arrow_forward</span>
               <div className="text-center">
                  <p className="text-2xl font-black tabular-nums text-primary-text dark:text-primary">
                    {userProfile.weightUnit === 'kg' ? (userProfile.weight * 2.20462).toFixed(1) : (userProfile.weight * 0.453592).toFixed(1)} 
                    <span className="text-xs font-bold">{userProfile.weightUnit === 'kg' ? 'lb' : 'kg'}</span>
                  </p>
               </div>
            </div>
            <button onClick={() => handleApplyUnitChange(userProfile.weightUnit === 'kg' ? 'lb' : 'kg')} className="cursor-pointer w-full py-7 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.25em] active:scale-95 transition-all shadow-2xl">APLICAR CAMBIOS</button>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0 cursor-pointer z-0"></div>
          
          <div className="relative z-10 w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center text-center gap-8 animate-in zoom-in-95 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500/20"></div>
            
            <div className="size-24 rounded-[2.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
              <span className="material-symbols-outlined text-5xl font-black">logout</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tighter leading-none">¿Cerrar Sesión?</h3>
              <p className="text-slate-400 font-bold text-sm leading-tight">Serás redirigido a la pantalla de acceso.</p>
            </div>
            
            <div className="flex flex-col w-full gap-4">
              <button 
                type="button"
                onClick={() => { 
                  setShowLogoutConfirm(false); 
                  onLogout(); 
                }} 
                className="cursor-pointer w-full py-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-[0_15px_30px_rgba(244,63,94,0.3)]"
                style={{ cursor: 'pointer' }}
              >
                CONFIRMAR SALIDA
              </button>
              
              <button 
                type="button"
                onClick={() => setShowLogoutConfirm(false)} 
                className="cursor-pointer w-full py-5 rounded-full bg-slate-100 dark:bg-background-dark text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                style={{ cursor: 'pointer' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center p-7">
    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    <span className="font-black text-2xl tabular-nums tracking-tighter">{value}</span>
  </div>
);

const PreferenceItem: React.FC<{ label: string; icon: string; toggle?: boolean; value?: any; onToggle?: (v: boolean) => void; onAction?: () => void; subtitle?: string; }> = ({ label, icon, toggle, value, onToggle, onAction, subtitle }) => (
  <div onClick={!toggle ? onAction : undefined} className={`flex items-center justify-between border-b border-slate-50 dark:border-white/5 last:border-0 p-7 ${!toggle ? 'cursor-pointer active:bg-slate-50 dark:active:bg-white/5 transition-all' : ''}`}>
    <div className="flex items-center gap-5">
      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 shadow-inner"><span className="material-symbols-outlined text-2xl">{icon}</span></div>
      <div className="flex flex-col"><span className="text-sm font-black uppercase tracking-[0.1em]">{label}</span>{subtitle && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</span>}</div>
    </div>
    {toggle ? (
      <button onClick={() => onToggle?.(!value)} className={`cursor-pointer rounded-full transition-all duration-500 relative shadow-inner w-16 h-8 ${value ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <div className={`absolute top-1 bg-white rounded-full shadow-md transition-all duration-300 size-6 ${value ? 'left-9' : 'left-1'}`}></div>
      </button>
    ) : (
      <div className="flex items-center gap-2">{value && <span className="text-[10px] font-black text-primary uppercase bg-black dark:bg-white/10 px-4 py-1.5 rounded-full">{value}</span>}<span className="material-symbols-outlined text-slate-300">chevron_right</span></div>
    )}
  </div>
);

export default Profile;
