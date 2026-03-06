import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { 
    IconX, IconCalendar, IconExport, IconCloud, IconSearch, IconBell, IconCamera
} from './icons';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onMenuClick: (modal: string) => void;
    userProfile: UserProfile;
    isChristmas?: boolean;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onMenuClick, userProfile, isChristmas }) => {
    const menuItems = [
        { id: 'calendar', label: 'Calendário', icon: IconCalendar, color: 'text-blue-500' },
        { id: 'search', label: 'Pesquisar', icon: IconSearch, color: 'text-purple-500' },
        { id: 'export', label: 'Exportar / Backup', icon: IconExport, color: 'text-emerald-500' },
        { id: 'notifications', label: 'Atividades', icon: IconBell, color: 'text-orange-500' },
        { id: 'settings', label: 'Configurações', icon: IconCamera, color: 'text-slate-500' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
                    />
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[80] shadow-2xl flex flex-col"
                    >
                        <div className="p-8 pt-16 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
                            {isChristmas && (
                                <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
                                    <span className="text-6xl">🎄</span>
                                </div>
                            )}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">
                                    {userProfile.profileImage ? (
                                        <img src={userProfile.profileImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-xl">
                                            {userProfile.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{userProfile.name}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{userProfile.email || 'Usuário Pro'}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                                <IconX className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="flex-1 p-6 space-y-2">
                            {menuItems.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => { onMenuClick(item.id); onClose(); }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all group"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all ${item.color}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[2px]">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="p-8 border-t border-slate-100">
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                                <IconCloud className="w-5 h-5 text-blue-600" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Sincronização</span>
                                    <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Ativada via Nuvem</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
