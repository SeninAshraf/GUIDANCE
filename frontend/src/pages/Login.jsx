import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, User } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
        }
    };

    const handleGoogleLogin = async () => {
        const result = await loginWithGoogle();
        if (result.success) {
            navigate(from, { replace: true });
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#ccff00]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#ccff00]">
                        <User className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to continue your journey.</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 transition-all placeholder:text-gray-600 focus:bg-[#2c2c2e]"
                            placeholder="username@example.com"
                            required
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
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            className="w-full btn-lime flex items-center justify-center gap-2 group py-3.5"
                        >
                            Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Or continue with</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 border border-white/10 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                            Sign in with Google
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account?
                    <Link to="/signup" className="text-[#ccff00] font-bold ml-1 hover:underline">
                        Create one
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
