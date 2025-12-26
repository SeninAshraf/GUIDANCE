
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Mic, FileText, Video, LogOut, Code, User, Home } from 'lucide-react';

const Navbar = () => {
    const { currentUser, loginWithGoogle, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
        { path: '/career-guide', label: 'Career Agent', icon: <Mic className="w-5 h-5" /> },
        { path: '/resume-builder', label: 'Resume', icon: <FileText className="w-5 h-5" /> },
        { path: '/interview', label: 'Interview Coach', icon: <Video className="w-5 h-5" /> },
    ];

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login Failed:", error);
        }
    };

    return (
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-lg">
                            <Code className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            AI Career Comp.
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 ${isActive(link.path)
                                        ? 'text-blue-400'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-4">
                        {currentUser ? (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-700" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-300 font-medium">{currentUser.displayName?.split(' ')[0]}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-red-400 transition"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-bold hover:bg-gray-200 transition transform hover:scale-105"
                            >
                                Sign In
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-400 hover:text-white focus:outline-none"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-900 border-b border-gray-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-3 ${isActive(link.path)
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </Link>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            {currentUser ? (
                                <div className="flex items-center justify-between px-3">
                                    <div className="flex items-center space-x-3">
                                        {currentUser.photoURL && <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />}
                                        <span className="text-gray-300">{currentUser.displayName}</span>
                                    </div>
                                    <button onClick={logout} className="text-red-400">Sign Out</button>
                                </div>
                            ) : (
                                <button onClick={handleLogin} className="w-full text-center py-2 bg-blue-600 rounded-lg text-white font-bold">Sign In</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
