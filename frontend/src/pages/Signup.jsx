import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Mail } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await signup(username, email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md apple-card p-8 md:p-12 relative overflow-hidden"
            >
                {/* Glow Effect */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2"></div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#ccff00]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#ccff00]">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-gray-400">Join the future of career growth.</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 transition-all placeholder:text-gray-600 focus:bg-[#2c2c2e]"
                            placeholder="Choose a username"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 transition-all placeholder:text-gray-600 focus:bg-[#2c2c2e]"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 transition-all placeholder:text-gray-600 focus:bg-[#2c2c2e]"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-lime flex items-center justify-center gap-2 group"
                    >
                        Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account?
                    <Link to="/login" className="text-[#ccff00] font-bold ml-1 hover:underline">
                        Sign in
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
