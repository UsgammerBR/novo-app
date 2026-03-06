import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'motion/react';
import { IconX, IconCamera, IconQrCode } from './icons';

interface CameraModalProps {
    target: any;
    onClose: () => void;
    onCapture: (data: string, type: 'qr' | 'photo') => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
    const [mode, setMode] = useState<'qr' | 'photo'>('qr');
    const [isCameraReady, setIsCameraReady] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (mode === 'qr') {
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;
            
            scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (text) => {
                    onCapture(text, 'qr');
                    scanner.stop();
                },
                () => {}
            ).then(() => setIsCameraReady(true));

            return () => {
                if (scanner.isScanning) {
                    scanner.stop().catch(console.error);
                }
            };
        } else {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setIsCameraReady(true);
                    }
                })
                .catch(console.error);

            return () => {
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [mode]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const data = canvas.toDataURL('image/jpeg', 0.7);
                onCapture(data, 'photo');
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            <div className="flex items-center justify-between p-6 z-10">
                <div className="flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-2xl">
                    <button 
                        onClick={() => setMode('qr')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'qr' ? 'bg-white text-black shadow-lg' : 'text-white/60'}`}
                    >
                        <IconQrCode className="w-4 h-4 inline-block mr-2" /> QR / Barcode
                    </button>
                    <button 
                        onClick={() => setMode('photo')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'photo' ? 'bg-white text-black shadow-lg' : 'text-white/60'}`}
                    >
                        <IconCamera className="w-4 h-4 inline-block mr-2" /> Foto
                    </button>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all">
                    <IconX className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {!isCameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                        <span className="text-[10px] font-black uppercase tracking-[4px]">Acessando Câmera...</span>
                    </div>
                )}
                
                {mode === 'qr' ? (
                    <div id="reader" className="w-full h-full"></div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                            <div className="w-full h-full border-2 border-white/30 rounded-3xl"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-10 flex justify-center items-center">
                {mode === 'photo' && (
                    <button 
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-white group-active:bg-white/80 transition-colors"></div>
                    </button>
                )}
                {mode === 'qr' && (
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px] text-center">
                        Aponte para o código de barras
                    </p>
                )}
            </div>
        </motion.div>
    );
};
