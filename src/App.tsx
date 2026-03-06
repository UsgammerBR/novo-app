import React, { useState, useEffect, useReducer, useRef, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

// Components
import { SideMenu } from './components/SideMenu';
import { CameraModal } from './components/CameraModal';
import { Modal } from './components/Modal';
import { EquipmentSection } from './components/EquipmentSection';
import { PhotoGalleryModal } from './components/PhotoGalleryModal';
import { CountBadge } from './components/CountBadge';
import { 
    CustomMenuIcon, LoadingBoxIcon, IconPlus, IconMinus, IconUndo, IconSearch, IconX, IconChevronLeft, IconChevronRight,
    IconExport, IconCalendar, IconBell, IconCameraLens, IconCloud, IconCopy, IconTrash, IconDownload, IconCamera, IconGallery
} from './components/icons';

// Types & Utils
import { EquipmentCategory, AppData, EquipmentItem, UserProfile } from './types';
import { CATEGORIES, HOLIDAYS_SP } from './constants';
import { dataReducer, createEmptyDailyData, generateId } from './reducer';
import { getFormattedDate, isChristmasPeriod, isItemActive, generateMonthlyReport } from './utils';

// Re-importing specific icons for categories to match original design
import { IconBox, IconSpeaker, IconRemote, IconChip, IconStack } from './components/icons';

const getCategoryIconFixed = (category: EquipmentCategory) => {
    switch(category) {
        case EquipmentCategory.BOX: return IconBox;
        case EquipmentCategory.BOX_SOUND: return IconSpeaker;
        case EquipmentCategory.CONTROLE: return IconRemote;
        case EquipmentCategory.CAMERA: return IconCameraLens;
        case EquipmentCategory.CHIP: return IconChip;
        default: return IconStack;
    }
};

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Carregar notificações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('equipment_notifications');
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  // Salvar notificações
  useEffect(() => {
    localStorage.setItem('equipment_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (type: string, details: string) => {
    const newNotif = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type,
        details
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
    setHasNewNotifications(true);
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [appData, dispatch] = useReducer(dataReducer, {} as AppData, (initial: AppData) => {
    try {
      const saved = localStorage.getItem('equipmentData');
      return saved ? JSON.parse(saved) : initial;
    } catch (e) {
      console.error('Erro ao carregar dados do localStorage:', e);
      return initial;
    }
  });
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      const saved = localStorage.getItem('userProfile');
      const defaults = { name: 'Leo Luz', email: 'osgammetbr@gmail.com', cpf: '', profileImage: '' };
      try {
          return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
      } catch (e) {
          return defaults;
      }
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory>(CATEGORIES[0]);
  const [cameraTarget, setCameraTarget] = useState<{ category: EquipmentCategory, item: EquipmentItem | 'profile' } | null>(null);
  const [galleryItem, setGalleryItem] = useState<EquipmentItem | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [history, setHistory] = useState<AppData[]>([]);
  const [showAllTimeTotals, setShowAllTimeTotals] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CATEGORIES.forEach((cat: string) => {
        initial[cat] = true;
    });
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const isChristmas = isChristmasPeriod();
  const formattedDate = getFormattedDate(currentDate);
  
  const currentHoliday = useMemo(() => {
    const dayMonth = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    return HOLIDAYS_SP[dayMonth];
  }, [currentDate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    
    const savedData = localStorage.getItem('equipmentData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed && typeof parsed === 'object') {
                dispatch({ type: 'SET_DATA', payload: parsed });
            }
        } catch (e) {
            console.error("Failed to parse saved data", e);
        }
    }
    
    const fetchServerData = async () => {
        try {
            const email = userProfile.email || 'default';
            const response = await fetch(`/api/data?email=${encodeURIComponent(email)}`);
            if (response.ok) {
                const serverData = await response.json();
                if (serverData && Object.keys(serverData).length > 0) {
                    dispatch({ type: 'SET_DATA', payload: serverData });
                    localStorage.setItem('equipmentData', JSON.stringify(serverData));
                }
            }
        } catch (err) {
            console.error("Failed to fetch from server", err);
        }
    };
    
    fetchServerData();
    return () => clearTimeout(timer);
  }, []);

  const syncWithServer = async () => {
      if (!navigator.onLine) {
          setSyncStatus('error');
          return;
      }
      
      setSyncStatus('syncing');
      try {
          const response = await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: userProfile.email || 'default',
                data: appData 
              })
          });
          
          if (response.ok) {
              setSyncStatus('success');
              setLastSync(new Date());
          } else {
              setSyncStatus('error');
              addNotification('Erro de Sincronização', 'O servidor recusou a sincronização.');
          }
      } catch (err) {
          console.error("Sync error:", err);
          setSyncStatus('error');
          addNotification('Erro de Sincronização', 'Não foi possível salvar os dados na nuvem.');
      }
  };

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('equipmentData', JSON.stringify(appData));
    const debounceTimer = setTimeout(syncWithServer, 2000);
    return () => clearTimeout(debounceTimer);
  }, [appData, isLoading]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  const currentDayData = useMemo(() => {
    const data = appData[formattedDate] || createEmptyDailyData();
    // Garantir que todas as categorias existam (caso o AppData seja antigo)
    CATEGORIES.forEach(cat => {
        if (!data[cat]) data[cat] = [{ id: generateId(), contract: '', serial: '', photos: [], createdAt: Date.now() }];
    });
    return data;
  }, [appData, formattedDate]);

  const handleUndo = () => {
    if (deleteMode) {
        setDeleteMode(false);
        setSelectedForDelete([]);
        return;
    }
    if (history.length > 0) {
        const lastState = history[history.length - 1];
        dispatch({ type: 'SET_DATA', payload: lastState });
        setHistory((prev: AppData[]) => prev.slice(0, -1));
    }
  };

  const addToHistory = (state: AppData) => {
    setHistory((prev: AppData[]) => [...prev.slice(-19), JSON.parse(JSON.stringify(state))]);
  };

  const handleAddItem = () => {
    addToHistory(appData);
    dispatch({ type: 'ADD_ITEM', payload: { date: formattedDate, category: activeCategory } });
    addNotification('Adição', `Novo item em ${activeCategory}`);
  };

  const handleDeleteSelected = () => {
    if (selectedForDelete.length > 0) {
        addToHistory(appData);
        dispatch({ type: 'DELETE_MULTIPLE_ITEMS', payload: { date: formattedDate, category: activeCategory, itemIds: selectedForDelete } });
        addNotification('Exclusão', `${selectedForDelete.length} itens removidos de ${activeCategory}`);
        setSelectedForDelete([]);
        setDeleteMode(false);
    }
  };

  const somaTotalGeral = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    if (!appData || typeof appData !== 'object') return 0;

    return Object.entries(appData).reduce((acc: number, [dateStr, day]) => {
        if (!day || typeof day !== 'object') return acc;
        const d = new Date(dateStr + 'T12:00:00');
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const dayTotal = Object.values(day).flat().filter(isItemActive).length;
            return acc + dayTotal;
        }
        return acc;
    }, 0);
  }, [appData, currentDate]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
        let count = 0;
        if (appData && typeof appData === 'object') {
            Object.values(appData).forEach(day => {
                if (day && day[cat] && Array.isArray(day[cat])) {
                    count += day[cat].filter(isItemActive).length;
                }
            });
        }
        totals[cat] = count;
    });
    return totals;
  }, [appData]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results: { date: string; category: EquipmentCategory; item: EquipmentItem }[] = [];
    Object.entries(appData).forEach(([date, dayData]) => {
      if (!dayData) return;
      Object.entries(dayData).forEach(([category, items]) => {
        (items as EquipmentItem[]).forEach(item => {
          if (
            item.contract.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.serial.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results.push({ date, category: category as EquipmentCategory, item });
          }
        });
      });
    });
    return results.sort((a, b) => (b.item.createdAt || 0) - (a.item.createdAt || 0));
  }, [appData, searchQuery]);

  const handleCameraCapture = (data: string, type: 'qr' | 'photo') => {
    if (!cameraTarget) return;

    if (cameraTarget.item === 'profile') {
        setUserProfile(prev => ({ ...prev, profileImage: data }));
    } else {
        const item = cameraTarget.item as EquipmentItem;
        if (type === 'qr') {
            if ('vibrate' in navigator) navigator.vibrate(100);
            dispatch({ 
                type: 'UPDATE_ITEM', 
                payload: { 
                    date: formattedDate, 
                    category: cameraTarget.category, 
                    item: { ...item, serial: data } 
                } 
            });
        } else {
            dispatch({ 
                type: 'UPDATE_ITEM', 
                payload: { 
                    date: formattedDate, 
                    category: cameraTarget.category, 
                    item: { ...item, photos: [...item.photos, data] } 
                } 
            });
        }
    }
    setCameraTarget(null);
  };

  const handleImportCloud = async () => {
    if (!userProfile.email) {
      alert("Por favor, configure seu e-mail nas configurações para importar da nuvem.");
      setActiveModal('settings');
      return;
    }

    if (!confirm(`Isso irá substituir seus dados locais pelos dados salvos na nuvem para o e-mail: ${userProfile.email}. Continuar?`)) return;
    
    try {
      const email = userProfile.email || 'default';
      const response = await fetch(`/api/data?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const serverData = await response.json();
        if (serverData && Object.keys(serverData).length > 0) {
          dispatch({ type: 'SET_DATA', payload: serverData });
          localStorage.setItem('equipmentData', JSON.stringify(serverData));
          addNotification('Importação', 'Dados recuperados da nuvem');
          alert("Dados importados com sucesso!");
          setActiveModal(null);
        } else {
          alert(`Nenhum dado encontrado na nuvem para o e-mail: ${email}.`);
        }
      } else {
        alert("Erro ao conectar com o servidor.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    }
  };

  if (isLoading) return <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 z-[100]"><LoadingBoxIcon/><p className="mt-4 font-black uppercase tracking-widest text-[10px] text-slate-400 animate-pulse">Iniciando Controle...</p></div>;

  return (
    <div className="flex flex-col min-h-screen relative w-full overflow-x-hidden bg-slate-50">
      <div className="fixed inset-0 pointer-events-none opacity-40">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50"></div>
      </div>

      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onMenuClick={setActiveModal} 
        userProfile={userProfile} 
        isChristmas={isChristmas} 
      />

      {isChristmas && (
          <div className="fixed top-0 left-0 right-0 h-48 pointer-events-none z-[60] overflow-hidden">
                <div className="absolute left-0 top-14 animate-[santaRide_24s_linear_infinite] flex items-center">
                    <div className="relative flex items-end">
                        <span className="text-8xl drop-shadow-[0_10px_20px_rgba(0,0,0,1)]" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🛷</span>
                        <span className="absolute bottom-6 left-10 text-6xl drop-shadow-lg" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🎅</span>
                        <div className="absolute bottom-8 left-18 flex items-baseline gap-0.5">
                            <span className="text-3xl drop-shadow-md">🎁</span>
                            <span className="text-2xl drop-shadow-md">📦</span>
                            <span className="text-2xl drop-shadow-md">🎁</span>
                        </div>
                    </div>
                    <div className="flex -space-x-5 items-center ml-14">
                        <span className="text-5xl drop-shadow-2xl" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🦌</span>
                        <span className="text-5xl drop-shadow-2xl" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🦌</span>
                        <span className="text-5xl drop-shadow-2xl" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🦌</span>
                    </div>
                </div>
          </div>
      )}

      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div onClick={() => setIsMenuOpen(true)} className="active:scale-95 transition-all cursor-pointer">
                    {userProfile.profileImage ? (
                        <div className="w-12 h-12 rounded-full border-2 border-slate-200 overflow-hidden shadow-sm">
                            <img src={userProfile.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                    ) : (
                        <CustomMenuIcon className="w-12 h-12 drop-shadow-md" isChristmas={isChristmas}/>
                    )}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Controle</h1>
                        {syncStatus === 'syncing' && <IconCloud className="w-2.5 h-2.5 text-blue-500 animate-pulse"/>}
                        {syncStatus === 'success' && <IconCloud className="w-2.5 h-2.5 text-green-500"/>}
                        {syncStatus === 'error' && <IconCloud className="w-2.5 h-2.5 text-red-500"/>}
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[3px]">Equipamentos</span>
                </div>
            </div>
            
            <div className="flex gap-1 items-center">
                <button onClick={handleAddItem} className="w-8 h-8 rounded-full flex items-center justify-center bg-linear-to-r from-blue-600 to-blue-500 text-white border border-blue-500 active:scale-95 shadow-sm transition-all">
                    <IconPlus className="w-3.5 h-3.5"/>
                </button>
                <button 
                    onClick={() => {
                        if (deleteMode) {
                            if (selectedForDelete.length > 0) handleDeleteSelected();
                            else { setDeleteMode(false); setSelectedForDelete([]); }
                        } else setDeleteMode(true);
                    }} 
                    className={`w-8 h-8 rounded-full flex items-center justify-center border active:scale-95 shadow-sm transition-all ${deleteMode ? 'bg-red-500 text-white border-red-400' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                    {deleteMode && selectedForDelete.length > 0 ? <IconTrash className="w-3.5 h-3.5"/> : <IconMinus className="w-3.5 h-3.5"/>}
                </button>
                <button 
                    onClick={handleUndo} 
                    disabled={!deleteMode && history.length === 0}
                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200 active:scale-95 shadow-sm transition-all ${(!deleteMode && history.length === 0) ? 'opacity-30' : ''}`}
                >
                    <IconUndo className="w-3.5 h-3.5"/>
                </button>
                <button onClick={() => setActiveModal('search')} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200 active:scale-95 shadow-sm transition-all">
                    <IconSearch className="w-3.5 h-3.5"/>
                </button>
                <button 
                    onClick={() => { setActiveModal('notifications'); setHasNewNotifications(false); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200 active:scale-95 shadow-sm transition-all relative"
                >
                    <IconBell className="w-3.5 h-3.5"/>
                    {hasNewNotifications && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>}
                </button>
            </div>
        </div>

        <div className="flex flex-col items-center mb-6 relative gap-2">
            <div className="flex items-center gap-2">
                <button onClick={() => setActiveModal('calendar')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 active:scale-95 transition-all shadow-sm">
                    <span className="font-black text-[12px] tracking-[2px] text-slate-700">
                        {currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </button>
                {currentHoliday && (
                    <button 
                        onClick={() => { setSelectedHoliday(currentHoliday); setActiveModal('holiday_info'); }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce-slow active:scale-90 transition-all ${currentHoliday.color}`}
                    >
                        <span className="text-lg">{currentHoliday.icon}</span>
                    </button>
                )}
            </div>
            {currentHoliday && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className={`text-[7px] font-black uppercase tracking-[2px] ${currentHoliday.color.replace('bg-', 'text-')}`}>
                        {currentHoliday.name}
                    </span>
                </div>
            )}
        </div>

        <div className="relative">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-3 px-2 -mx-2">
                {CATEGORIES.map(cat => {
                    const Icon = getCategoryIconFixed(cat);
                    return (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex flex-col items-center gap-1.5 min-w-[60px] p-2 rounded-[1.2rem] transition-all active:scale-95 relative ${activeCategory === cat ? 'bg-linear-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 text-slate-400'}`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activeCategory === cat ? 'bg-white/20' : 'bg-white/50'}`}>
                                <Icon className="w-4 h-4"/>
                            </div>
                            <span className="text-[6px] font-black uppercase tracking-[1px] whitespace-nowrap">{cat}</span>
                            <CountBadge count={appData[formattedDate]?.[cat]?.filter(isItemActive).length || 0} />
                        </button>
                    );
                })}
            </div>
        </div>
      </header>

      <main className="flex-1 px-4 space-y-4 mt-6 pb-48 relative z-10">
          <div 
            onClick={() => setCollapsedCategories(prev => ({ ...prev, [activeCategory]: !prev[activeCategory] }))}
            className={`flex items-center justify-center px-6 py-3.5 rounded-[1.5rem] shadow-lg transition-all duration-500 cursor-pointer active:scale-[0.98] mb-4 ${
                collapsedCategories[activeCategory] ? 'bg-white border border-slate-100' : 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
            }`}
          >
              <div className="flex items-center gap-3">
                  <span className={`text-[16px] font-black uppercase tracking-[1px] ${collapsedCategories[activeCategory] ? 'text-slate-800' : 'text-white'}`}>
                      {activeCategory}
                  </span>
              </div>
          </div>

          <EquipmentSection 
            category={activeCategory} 
            items={collapsedCategories[activeCategory] 
                ? (currentDayData[activeCategory] && currentDayData[activeCategory].length > 0 
                    ? [currentDayData[activeCategory][currentDayData[activeCategory].length - 1]] 
                    : [])
                : (currentDayData[activeCategory] || [])
            } 
            onUpdate={(item: any) => {
                addToHistory(appData);
                dispatch({ type: 'UPDATE_ITEM', payload: { date: formattedDate, category: activeCategory, item } });
            }}
            onAddItem={handleAddItem}
            onCollapse={() => setCollapsedCategories(prev => ({ ...prev, [activeCategory]: true }))}
            onDelete={(id: string) => {
                addToHistory(appData);
                dispatch({ type: 'DELETE_SINGLE_ITEM', payload: { date: formattedDate, category: activeCategory, itemId: id } });
            }}
            onGallery={setGalleryItem}
            onCamera={(item: any) => setCameraTarget({ category: activeCategory, item })}
            deleteMode={deleteMode}
            selectedForDelete={selectedForDelete}
            onToggleSelect={(id: string) => setSelectedForDelete(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            isChristmas={isChristmas}
          />

          {collapsedCategories[activeCategory] && currentDayData[activeCategory].filter(isItemActive).length > 0 && (
              <div className="mt-4 p-4 rounded-[2rem] bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 opacity-60">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[2px]">
                      {currentDayData[activeCategory].filter(isItemActive).length} itens concluídos ocultos
                  </span>
                  <button 
                    onClick={() => setCollapsedCategories(prev => ({ ...prev, [activeCategory]: false }))}
                    className="text-[7px] font-black text-blue-500 uppercase tracking-widest underline underline-offset-4"
                  >
                      Expandir para ver todos
                  </button>
              </div>
          )}
          
          <div className="flex flex-col items-center justify-center pt-10 pb-20 opacity-20">
              <span className="text-[6px] font-black text-slate-400 uppercase tracking-[4px]">Controle Box v1.0.4</span>
              <span className="text-[5px] font-black text-slate-300 uppercase tracking-[2px] mt-1">Build 20260302-1735</span>
          </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 border-t border-slate-200 p-4 pb-10 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-3xl max-w-[480px] mx-auto w-full">
          <div className="flex items-center justify-between">
              <div className="flex gap-3 overflow-x-auto no-scrollbar flex-1 pr-4">
                  {CATEGORIES.map(cat => {
                      const Icon = getCategoryIconFixed(cat);
                      const count = showAllTimeTotals ? categoryTotals[cat] : (currentDayData[cat] || []).filter(isItemActive).length;
                      return (
                        <div key={cat} className={`flex flex-col items-center min-w-[32px] transition-all ${activeCategory === cat ? 'scale-110' : 'opacity-30'}`}>
                            <Icon className={`w-4 h-4 mb-1 ${activeCategory === cat ? 'text-blue-600' : 'text-slate-400'}`}/>
                            <span className={`text-[10px] font-black ${activeCategory === cat ? 'text-blue-600' : 'text-slate-500'}`}>{count}</span>
                        </div>
                      );
                  })}
              </div>
              <div className="h-10 w-px bg-slate-200 shrink-0"></div>
              <div className="flex items-center gap-4 pl-4 shrink-0">
                <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest mb-1">Dia</span>
                    <span className="text-xl font-black leading-none text-blue-600">{Object.values(currentDayData).flat().filter(isItemActive).length}</span>
                </div>
                <button onClick={() => setShowAllTimeTotals(!showAllTimeTotals)} className="flex flex-col items-center active:scale-95 transition-transform">
                    <span className={`text-[7px] font-black uppercase tracking-widest mb-1 transition-colors ${showAllTimeTotals ? 'text-purple-600' : 'text-purple-400'}`}>{showAllTimeTotals ? 'Voltar' : 'Mês'}</span>
                    <div className={`rounded-2xl px-5 py-2.5 border transition-all duration-500 ${showAllTimeTotals ? 'bg-purple-600 text-white border-purple-400 shadow-[0_5px_15px_rgba(168,85,247,0.3)]' : 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm backdrop-blur-xl'}`}>
                        <span className="text-xl font-black leading-none">{somaTotalGeral}</span>
                    </div>
                </button>
              </div>
          </div>
      </footer>

      <AnimatePresence>
        {galleryItem && <PhotoGalleryModal item={galleryItem} onClose={() => setGalleryItem(null)} />}
        {cameraTarget && <CameraModal target={cameraTarget.item} onClose={() => setCameraTarget(null)} onCapture={handleCameraCapture} />}

        {activeModal === 'search' && (
            <Modal title="Pesquisar" onClose={() => setActiveModal(null)}>
                <div className="space-y-4">
                    <div className="relative">
                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input type="text" autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Contrato ou Serial..." className="w-full py-4 pl-12 pr-6 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-sm text-slate-800 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="max-h-[350px] overflow-y-auto space-y-2 no-scrollbar">
                        {searchResults.length > 0 ? searchResults.map((res, i) => (
                            <button key={i} onClick={() => { setCurrentDate(new Date(res.date + 'T12:00:00')); setActiveCategory(res.category); setActiveModal(null); }} className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 flex flex-col gap-1 active:scale-[0.98] transition-all hover:bg-slate-50 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{res.category}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(res.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                </div>
                                <p className="text-xs font-black text-slate-800">CTR: {res.item.contract || '---'}</p>
                                <p className="text-[10px] font-black text-slate-400 truncate">SN: {res.item.serial || '---'}</p>
                            </button>
                        )) : searchQuery ? <p className="text-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum resultado</p> : <p className="text-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">Digite para buscar</p>}
                    </div>
                </div>
            </Modal>
        )}

        {activeModal === 'calendar' && (
            <Modal title="Selecionar Data" onClose={() => setActiveModal(null)} hideHeader={true} padding="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }} className="p-2 rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-all"><IconChevronLeft className="w-5 h-5"/></button>
                        <span className="font-black uppercase text-[10px] tracking-[4px] text-slate-800">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }} className="p-2 rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-all"><IconChevronRight className="w-5 h-5"/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="h-8 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
                        {(() => {
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const days = [];
                            for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
                            for (let day = 1; day <= daysInMonth; day++) {
                                const d = new Date(year, month, day);
                                const dateStr = getFormattedDate(d);
                                const isSelected = getFormattedDate(currentDate) === dateStr;
                                const holiday = HOLIDAYS_SP[`${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}`];
                                days.push(
                                    <button key={day} onClick={() => { setCurrentDate(d); if (holiday) { setSelectedHoliday(holiday); setActiveModal('holiday_info'); } else setActiveModal(null); }} className={`h-11 rounded-2xl font-black text-[11px] transition-all relative flex flex-col items-center justify-center ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105 z-20' : holiday ? `${holiday.color} text-white shadow-md` : 'bg-slate-50 text-slate-500 active:bg-slate-100'}`}>
                                        <span className="relative z-10">{day}</span>
                                        {holiday && <span className="absolute top-1 right-1 text-[10px] leading-none">{holiday.icon}</span>}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>
            </Modal>
        )}

        {activeModal === 'settings' && (
            <Modal title="Configurações" onClose={() => setActiveModal(null)}>
                <div className="space-y-6">
                    <div className="flex flex-col items-center mb-4">
                        <div onClick={() => setCameraTarget({ category: activeCategory, item: 'profile' })} className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 overflow-hidden cursor-pointer group">
                            {userProfile.profileImage ? <img src={userProfile.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center"><IconCamera className="w-8 h-8 text-slate-600"/></div>}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><IconCameraLens className="w-6 h-6 text-white"/></div>
                        </div>
                        <p className="mt-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Foto de Perfil</p>
                    </div>
                    <div className="space-y-4">
                        <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-[4px] mb-2 block">Nome de Usuário</label><input type="text" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} className="w-full py-4 px-6 rounded-2xl bg-slate-50 border-none outline-none font-black text-sm text-slate-800 focus:bg-slate-100 transition-all" /></div>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-[4px] mb-2 block">CPF</label><input type="text" value={userProfile.cpf || ''} onChange={e => setUserProfile({...userProfile, cpf: e.target.value})} className="w-full py-4 px-6 rounded-2xl bg-slate-50 border-none outline-none font-black text-sm text-slate-800 focus:bg-slate-100 transition-all" /></div>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-[4px] mb-2 block">E-mail para Backup</label><input type="email" value={userProfile.email || ''} onChange={e => setUserProfile({...userProfile, email: e.target.value})} className="w-full py-4 px-6 rounded-2xl bg-slate-50 border-none outline-none font-black text-sm text-slate-800 focus:bg-slate-100 transition-all" /></div>
                    </div>
                    <div className="pt-4 space-y-3">
                        <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[3px] text-[10px] active:scale-95 transition-all shadow-xl shadow-blue-600/20">Salvar Perfil</button>
                        <button onClick={() => { if (confirm("Limpar todos os dados?")) { localStorage.removeItem('equipmentData'); dispatch({ type: 'SET_DATA', payload: {} }); setActiveModal(null); } }} className="w-full py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase tracking-[3px] text-[10px] active:scale-95 transition-all">Limpar Dados</button>
                    </div>
                </div>
            </Modal>
        )}

        {activeModal === 'export' && (
            <Modal title="Relatórios e Backup" onClose={() => setActiveModal(null)}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { const blob = new Blob([JSON.stringify(appData)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `backup_${formattedDate}.json`; link.click(); }} className="py-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group">
                            <IconDownload className="w-5 h-5 text-cyan-500"/><span className="font-black uppercase text-[8px] tracking-[2px] text-slate-300">Exportar JSON</span>
                        </button>
                        <div className="relative">
                            <button className="w-full h-full py-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group">
                                <IconExport className="w-5 h-5 text-emerald-500"/><span className="font-black uppercase text-[8px] tracking-[2px] text-slate-300">Importar JSON</span>
                            </button>
                            <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { try { const data = JSON.parse(event.target?.result as string); dispatch({ type: 'SET_DATA', payload: data }); addNotification('Importação', 'Backup restaurado com sucesso'); setActiveModal(null); } catch(e) { alert('Arquivo inválido'); } }; reader.readAsText(file); } }} />
                        </div>
                    </div>
                    
                    <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Status da Nuvem</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronização Automática</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${syncStatus === 'success' ? 'bg-green-100 text-green-600' : syncStatus === 'syncing' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                {syncStatus === 'success' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Salvando...' : 'Pendente'}
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Última Sincronização:</span>
                            <span>{lastSync ? lastSync.toLocaleTimeString('pt-BR') : 'Nunca'}</span>
                        </div>
                        <button onClick={syncWithServer} className="w-full py-3 bg-white border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[8px] text-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <IconCloud className="w-3 h-3"/> Sincronizar Agora
                        </button>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-blue-50 border border-blue-100 space-y-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Link de Acesso</span>
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Acesse de qualquer dispositivo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/50 p-3 rounded-xl border border-blue-100 overflow-hidden">
                                <p className="text-[8px] font-black text-blue-600 truncate">{window.location.origin}</p>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(window.location.origin); alert('Link copiado!'); }} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center active:scale-95 transition-all shadow-md"><IconCopy className="w-4 h-4"/></button>
                        </div>
                    </div>

                    <button onClick={handleImportCloud} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[3px] text-[10px] active:scale-95 transition-all shadow-xl">Importar da Nuvem</button>
                    <button onClick={() => { const doc = new jsPDF(); doc.text(generateMonthlyReport(appData, currentDate), 10, 10); doc.save(`relatorio_${currentDate.getMonth()+1}.pdf`); }} className="w-full py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black uppercase tracking-[3px] text-[10px] active:scale-95 transition-all">Gerar PDF Mensal</button>
                </div>
            </Modal>
        )}

        {activeModal === 'holiday_info' && selectedHoliday && (
            <Modal title="Evento Especial" onClose={() => setActiveModal(null)}>
                <div className="text-center py-6">
                    <span className="text-6xl mb-6 block drop-shadow-xl animate-bounce">{selectedHoliday.icon}</span>
                    <h2 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${selectedHoliday.color.replace('bg-', 'text-')}`}>{selectedHoliday.name}</h2>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">{selectedHoliday.type === 'holiday' ? 'Feriado Nacional' : 'Data Comemorativa'}</p>
                    <button onClick={() => setActiveModal(null)} className={`w-full py-4 text-white rounded-2xl font-black uppercase tracking-[3px] text-[10px] active:scale-95 transition-all shadow-xl ${selectedHoliday.color}`}>Continuar</button>
                </div>
            </Modal>
        )}

        {activeModal === 'notifications' && (
            <Modal title="Atividades" onClose={() => setActiveModal(null)}>
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? notifications.map(notif => (
                        <div key={notif.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${notif.type === 'Adição' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{notif.type}</span><span className="text-[8px] font-black text-slate-400">{notif.time}</span></div>
                                <p className="text-[11px] font-black text-slate-500">{notif.details}</p>
                            </div>
                        </div>
                    )) : <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma atividade</p>}
                </div>
            </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const App = () => (
    <AppContent />
);

export default App;
