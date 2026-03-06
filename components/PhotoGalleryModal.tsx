import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EquipmentItem } from '../types';
import { IconX, IconTrash, IconChevronLeft, IconChevronRight, IconDownload } from './icons';

interface PhotoGalleryModalProps {
    item: EquipmentItem;
    onClose: () => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({ item, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => setCurrentIndex(prev => (prev + 1) % item.photos.length);
    const prev = () => setCurrentIndex(prev => (prev - 1 + item.photos.length) % item.photos.length);

    const download = () => {
        const link = document.createElement('a');
        link.href = item.photos[currentIndex];
        link.download = `photo_${item.id}_${currentIndex}.jpg`;
        link.click();
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col"
        >
            <div className="flex items-center justify-between p-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Galeria de Fotos</span>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-[2px]">{currentIndex + 1} de {item.photos.length}</span>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
                    <IconX className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    <motion.img 
                        key={currentIndex}
                        src={item.photos[currentIndex]} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
                        referrerPolicy="no-referrer"
                    />
                </AnimatePresence>

                {item.photos.length > 1 && (
                    <>
                        <button onClick={prev} className="absolute left-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
                            <IconChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={next} className="absolute right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
                            <IconChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>

            <div className="p-10 flex justify-center gap-4">
                <button 
                    onClick={download}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-[2px] active:scale-95 transition-all"
                >
                    <IconDownload className="w-4 h-4" /> Baixar Foto
                </button>
            </div>
        </motion.div>
    );
};
