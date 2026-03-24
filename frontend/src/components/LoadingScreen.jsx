
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ onLoadingComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (progress < 100) {
                setProgress(prev => prev + 2);
            }
        }, 30);

        if (progress >= 100) {
            setTimeout(onLoadingComplete, 500);
        }

        return () => clearTimeout(timer);
    }, [progress, onLoadingComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Glossy Background Elements */}
            <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#ccff00]/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#ccff00]/5 blur-[150px] rounded-full" />

            {/* Logo Section */}
            <div className="relative group">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="relative">
                        {/* Glow Behind Text */}
                        <motion.div 
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-[#ccff00] blur-3xl rounded-full opacity-20" 
                        />
                        
                        <h1 className="text-8xl md:text-[120px] font-black tracking-tighter text-white relative">
                            G<span className="text-[#ccff00]">U</span>IDO
                        </h1>
                    </div>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ccff00]/60 mt-4"
                    >
                        AI Career Governance
                    </motion.p>
                </motion.div>
            </div>

            {/* Premium Loading Bar */}
            <div className="absolute bottom-20 w-64 px-4">
                <div className="relative h-[2px] w-full bg-white/10 overflow-hidden rounded-full">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: `${progress - 100}%` }}
                        className="h-full bg-[#ccff00] shadow-[0_0_15px_#ccff00]"
                    />
                </div>
                <div className="flex justify-between mt-3">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Initializing Neural Core</span>
                    <span className="text-[8px] font-bold text-[#ccff00] tracking-widest">{progress}%</span>
                </div>
            </div>

            {/* Decorative Scanline */}
            <motion.div 
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-[#ccff00]/5 to-transparent pointer-events-none"
            />
        </motion.div>
    );
};

export default LoadingScreen;
