
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Briefcase, Code2, FileText, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const FloatingNav = () => {
    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/career-guide', icon: MessageSquare, label: 'Assistant' },
        { path: '/code-helper', icon: Code2, label: 'Quest' },
        { path: '/job-insights', icon: Briefcase, label: 'Jobs' },
        { path: '/personal-wallet', icon: Shield, label: 'Wallet' },
        { path: '/interview-coach', icon: User, label: 'Interview' },
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 p-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl border transition-colors duration-300"
                style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--card-border)' }}
            >
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            relative px-4 md:px-6 py-3 rounded-full transition-all duration-300 flex items-center justify-center
                            ${isActive ? 'text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-[#ccff00] rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                                    {isActive && <span className="hidden md:inline text-sm font-bold">{item.label}</span>}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}

                <div className="w-[1px] h-8 bg-[var(--card-border)] mx-1"></div>

                <ThemeToggle />
            </motion.div>
        </div>
    );
};

export default FloatingNav;
