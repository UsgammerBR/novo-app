import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EquipmentCategory, EquipmentItem } from '../types';
import { 
    IconPlus, IconTrash, IconCamera, IconGallery, IconQrCode, IconX
} from './icons';

interface EquipmentSectionProps {
    category: EquipmentCategory;
    items: EquipmentItem[];
    onUpdate: (item: EquipmentItem) => void;
    onAddItem: () => void;
    onCollapse: () => void;
    onDelete: (id: string) => void;
    onGallery: (item: EquipmentItem) => void;
    onCamera: (item: EquipmentItem) => void;
    deleteMode: boolean;
    selectedForDelete: string[];
    onToggleSelect: (id: string) => void;
    isChristmas?: boolean;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
    category, items, onUpdate, onDelete, onGallery, onCamera, deleteMode, selectedForDelete, onToggleSelect, isChristmas
}) => {
    return (
        <div className="space-y-4">
            <AnimatePresence initial={false}>
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative p-5 rounded-[2rem] border transition-all duration-300 ${
                            deleteMode && selectedForDelete.includes(item.id) 
                                ? 'bg-red-50 border-red-200 shadow-lg shadow-red-100' 
                                : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                        }`}
                        onClick={() => deleteMode && onToggleSelect(item.id)}
                    >
                        {deleteMode && (
                            <div className="absolute -top-2 -left-2 z-20">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    selectedForDelete.includes(item.id) ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-slate-200'
                                }`}>
                                    {selectedForDelete.includes(item.id) && <IconX className="w-3 h-3" />}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Contrato</label>
                                    <input 
                                        type="text" 
                                        value={item.contract}
                                        onChange={e => onUpdate({ ...item, contract: e.target.value })}
                                        placeholder="000000000"
                                        className="w-full py-3.5 px-5 rounded-2xl bg-slate-50 border-none outline-none font-black text-sm text-slate-800 focus:bg-slate-100 transition-all placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[3px]">Serial Number</label>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onCamera(item); }}
                                            className="text-blue-600 active:scale-90 transition-transform"
                                        >
                                            <IconQrCode className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={item.serial}
                                        onChange={e => onUpdate({ ...item, serial: e.target.value })}
                                        placeholder="SN / MAC"
                                        className="w-full py-3.5 px-5 rounded-2xl bg-slate-50 border-none outline-none font-black text-sm text-slate-800 focus:bg-slate-100 transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onCamera(item); }}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-all"
                                    >
                                        <IconCamera className="w-3.5 h-3.5" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Foto</span>
                                    </button>
                                    {item.photos.length > 0 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onGallery(item); }}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all relative"
                                        >
                                            <IconGallery className="w-3.5 h-3.5" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Ver ({item.photos.length})</span>
                                        </button>
                                    )}
                                </div>
                                {!deleteMode && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-400 active:scale-90 transition-all"
                                    >
                                        <IconTrash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
