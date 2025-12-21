
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { NumberInput } from './BodyData';

interface ProfileProps {
  onBack: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack, isDarkMode, setIsDarkMode, userProfile, onUpdateProfile, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>({ ...userProfile });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const handleSave = () => {
    onUpdateProfile(editForm);
    setIsEditing(false);
  };

  const handleApplyUnitChange = (newUnit: 'kg' | 'lb') => {
    if (newUnit === userProfile.weightUnit) {
      setShowUnitModal(false);
      return;
    }

    const factor = newUnit === 'lb' ? 2.20462 : 0.453592;
    
    // Realizamos una conversión profunda y obligatoria
    const updatedProfile: UserProfile = {
      ...userProfile,
      weightUnit: newUnit,
      // Convertimos peso corporal
      weight: parseFloat((userProfile.weight * factor).toFixed(1)),
      goalSettings: {
        ...userProfile.goalSettings,
        // Convertimos meta de volumen semanal
        targetVolumePerWeek: Math.round(userProfile.goalSettings.targetVolumePerWeek * factor)
      }
    };

    // Actualizamos el estado global y local
    onUpdateProfile(updatedProfile);
    setEditForm(updatedProfile);
    setShowUnitModal(false);
  };

  const goalLabels = {
    'Strength': 'Fuerza Máxima',
    'Hypertrophy': 'Hipertrofia',
    'WeightLoss': 'Quema de Grasa',
    '': 'No seleccionado'
  };

  if (isEditing) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-300">
        <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
          <button onClick={() => setIsEditing(false)} className="text-slate-500 font-bold px-3">Cancelar</button>
          <h2 className="text-lg font-bold">Editar Perfil</h2>
          <button onClick={handleSave} className="text-primary-text font-black px-3">Guardar</button>
        </header>

        <main className="p-6 space-y-10 overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Alias / Nombre</label>
            <input 
              type="text" 
              value={editForm.alias}
              onChange={(e) => setEditForm({...editForm, alias: e.target.value})}
              className="w-full bg-white dark:bg-surface-dark border-2 border-black/5 rounded-[1.5rem] py-5 px-6 text-xl font-bold focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="space-y-8">
            <NumberInput label="Edad" value={editForm.age} onChange={(v) => setEditForm({...editForm, age: v})} min={14} max={99} />
            <NumberInput label={`Peso (${editForm.weightUnit})`} value={editForm.weight} onChange={(v) => setEditForm({...editForm, weight: v})} min={30} max={600} step={0.5} />
            <NumberInput label="Altura (cm)" value={editForm.height} onChange={(v) => setEditForm({...editForm, height: v})} min={100} max={230} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Perfil</h2>
        <div className="size-10"></div>
      </header>

      <div className="flex flex-col items-center p-6">
        <div className="relative mb-4">
          <div 
            className="w-32 h-32 rounded-full border-4 border-primary bg-cover bg-center shadow-lg"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop")' }}
          ></div>
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute bottom-1 right-1 size-10 bg-primary rounded-full border-4 border-white dark:border-background-dark flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm font-black">edit</span>
          </button>
        </div>
        <h1 className="text-2xl font-black tracking-tight">{userProfile.alias || 'Atleta'}</h1>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">{goalLabels[userProfile.goal as keyof typeof goalLabels] || 'Sin objetivo'}</p>
      </div>

      <div className="px-4 flex gap-3 mb-8">
        <ProfileStat icon="local_fire_department" value="12" label="Racha" />
        <ProfileStat icon="verified" value="15" label="Nivel" />
        <ProfileStat icon="military_tech" value="200" label="Siguiente XP" />
      </div>

      <div className="px-4 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-black tracking-tight">Mis Datos</h3>
            <button onClick={() => setIsEditing(true)} className="text-primary-text text-[10px] font-black uppercase tracking-widest">Editar</button>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] overflow-hidden shadow-sm border border-black/5 divide-y divide-black/5">
            <DataRow label="Edad" value={`${userProfile.age} años`} />
            <DataRow label="Peso Actual" value={`${userProfile.weight} ${userProfile.weightUnit}`} />
            <DataRow label="Sistema" value={userProfile.weightUnit === 'kg' ? 'Métrico (KG)' : 'Imperial (LB)'} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black tracking-tight mb-3 px-1">Preferencias</h3>
          <div className="bg-white dark:bg-surface-dark rounded-[1.5rem] overflow-hidden shadow-sm border border-black/5">
            <PreferenceItem label="Modo Oscuro" icon="dark_mode" toggle value={isDarkMode} onToggle={setIsDarkMode} />
            <PreferenceItem 
              label="Sistema de Unidades" 
              icon="straighten" 
              value={userProfile.weightUnit.toUpperCase()} 
              onAction={() => setShowUnitModal(true)} 
            />
          </div>
        </section>

        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-16 rounded-[1.5rem] border-2 border-red-200 text-red-500 font-black text-sm uppercase tracking-widest active:bg-red-50 transition-all mb-4"
        >
          Cerrar Sesión
        </button>
      </div>

      {showUnitModal && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-2xl flex items-end animate-in fade-in duration-300 p-4">
          <div onClick={() => setShowUnitModal(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-[3.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col items-center text-center">
            <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl font-black">sync_alt</span>
            </div>
            <h3 className="text-3xl font-black tracking-tighter mb-2">Cambiar a {userProfile.weightUnit === 'kg' ? 'Libras' : 'Kilogramos'}</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed px-4">
              ¿Confirmas el cambio de sistema? Recalcularemos tus metas y peso corporal automáticamente para que tu progreso sea 100% coherente.
            </p>

            <div className="w-full bg-slate-50 dark:bg-background-dark p-6 rounded-[2rem] border border-black/5 mb-8 flex items-center justify-around">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Actual</p>
                  <p className="text-2xl font-black">{userProfile.weight} <span className="text-xs text-slate-400">{userProfile.weightUnit}</span></p>
               </div>
               <span className="material-symbols-outlined text-primary font-black">arrow_forward</span>
               <div className="text-center">
                  <p className="text-[10px] font-black text-primary uppercase mb-1">Nuevo</p>
                  <p className="text-2xl font-black">
                    {userProfile.weightUnit === 'kg' 
                      ? (userProfile.weight * 2.20462).toFixed(1) 
                      : (userProfile.weight * 0.453592).toFixed(1)} 
                    <span className="text-xs text-primary">{userProfile.weightUnit === 'kg' ? 'lb' : 'kg'}</span>
                  </p>
               </div>
            </div>

            <button 
              onClick={() => handleApplyUnitChange(userProfile.weightUnit === 'kg' ? 'lb' : 'kg')}
              className="w-full py-6 rounded-full bg-primary text-black font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              Confirmar y Convertir Todo
            </button>

            <button onClick={() => setShowUnitModal(false)} className="mt-8 text-xs font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 relative">
            <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
              <span className="material-symbols-outlined text-4xl font-black">logout</span>
            </div>
            <div>
              <h3 className="text-xl font-black mb-2 tracking-tight">¿Cerrar Sesión?</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Se perderán los datos locales no guardados.</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => { setShowLogoutConfirm(false); onLogout(); }} 
                className="w-full py-4 rounded-full bg-red-500 text-white font-black text-sm active:scale-95 transition-all"
              >
                CERRAR SESIÓN
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 rounded-full bg-slate-100 dark:bg-background-dark text-slate-400 font-black text-sm">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center p-5">
    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">{label}</span>
    <span className="font-black text-lg">{value}</span>
  </div>
);

const ProfileStat: React.FC<{ icon: string; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="flex-1 bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] flex flex-col items-center shadow-sm text-center border border-black/5">
    <div className="p-2.5 bg-primary/20 rounded-full mb-2 text-primary">
      <span className="material-symbols-outlined fill-1 text-2xl">{icon}</span>
    </div>
    <p className="text-2xl font-black tabular-nums">{value}</p>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
  </div>
);

const PreferenceItem: React.FC<{ label: string; icon: string; toggle?: boolean; value?: any; onToggle?: (v: boolean) => void; onAction?: () => void }> = ({ label, icon, toggle, value, onToggle, onAction }) => (
  <div onClick={!toggle ? onAction : undefined} className={`flex items-center justify-between p-5 border-b border-slate-50 dark:border-white/5 last:border-0 ${!toggle ? 'cursor-pointer active:bg-slate-50 dark:active:bg-white/5 transition-all' : ''}`}>
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-slate-400">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </div>
    {toggle ? (
      <button 
        onClick={() => onToggle?.(!value)}
        className={`w-14 h-7 rounded-full transition-colors relative ${value ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <div className={`absolute top-1 size-5 bg-white rounded-full shadow-sm transition-all ${value ? 'left-8' : 'left-1'}`}></div>
      </button>
    ) : (
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-bold text-slate-400">{value}</span>}
        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
      </div>
    )}
  </div>
);

export default Profile;
