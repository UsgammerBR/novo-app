import React from 'react';
import { motion } from 'motion/react';
import { IconX } from './icons';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    hideHeader?: boolean;
    padding?: string;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, hideHeader, padding = "p-6" }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-[480px] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                {!hideHeader && (
                    <div className="flex items-center justify-between px-8 pt-8 pb-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-[4px]">{title}</h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
                            <IconX className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className={padding}>
                    {children}
                </div>
                <div className="h-8 sm:hidden"></div>
            </motion.div>
        </motion.div>
    );
};
