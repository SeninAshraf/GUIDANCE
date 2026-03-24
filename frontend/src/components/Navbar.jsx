import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ChevronDown, Mic, FileText, Video, Code, TrendingUp, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const quickLinks = [
        { path: '/personal-wallet', label: 'Personal Vault', icon: <Shield className="w-3.5 h-3.5" /> },
        { path: '/career-guide', label: 'Career Agent', icon: <Mic className="w-3.5 h-3.5" /> },
        { path: '/resume-builder', label: 'Resume', icon: <FileText className="w-3.5 h-3.5" /> },
        { path: '/interview-coach', label: 'Interview Coach', icon: <Video className="w-3.5 h-3.5" /> },
        { path: '/insights', label: 'Job Insights', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        { path: '/code-helper', label: 'LogicQuest', icon: <Code className="w-3.5 h-3.5" /> },
    ];

    return (
        <header className="fixed top-6 right-6 z-[60]">
            <div className="flex items-center">
                {user ? (
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex items-center gap-3 p-1.5 pl-4 rounded-full bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 hover:border-[#ccff00]/30 transition-all text-gray-400 hover:text-white group shadow-2xl"
                        >
                            <span className="text-xs font-bold tracking-tight">{user.displayName || 'Developer'}</span>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20">
                                    <User className="w-4 h-4 text-[#ccff00]" />
                                </div>
                            )}
                            <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showProfileDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setShowProfileDropdown(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-72 bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        {/* Profile Header */}
                                        <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                                            <div className="flex items-center gap-4 mb-1">
                                                <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center border border-[#ccff00]/20">
                                                    <User className="w-6 h-6 text-[#ccff00]" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white leading-tight">{user.displayName || 'User'}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium truncate w-40">{user.email}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activities / Quick Links */}
                                        <div className="p-2 space-y-1">
                                            <div className="px-4 py-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Career Journey</div>
                                            {quickLinks.map(link => (
                                                <Link
                                                    key={link.path}
                                                    to={link.path}
                                                    onClick={() => setShowProfileDropdown(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all"
                                                >
                                                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-[#ccff00]/10">
                                                        {link.icon}
                                                    </div>
                                                    {link.label}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div className="p-2 mt-2 bg-black/20 border-t border-white/5 text-xs font-bold text-gray-500 flex justify-center py-4">
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setShowProfileDropdown(false);
                                                }}
                                                className="flex items-center gap-2 hover:text-red-400 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="px-6 py-2.5 btn-lime rounded-full text-xs font-black uppercase tracking-wider shadow-[0_4px_20px_rgba(204,255,0,0.2)] hover:scale-105 active:scale-95 transition-all"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Navbar;
