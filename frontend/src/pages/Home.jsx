
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Code2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; // Keep Link for other routes
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleStart = async () => {
        const result = await loginWithGoogle();
        if (result.success) {
            navigate('/career-guide');
        } else {
            alert("Login Failed: " + result.error);
        }
    };
    return (
        <div className="space-y-32 py-20 pb-40">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center space-y-8 min-h-[60vh]">
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ccff00]/20 blur-[120px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="px-4 py-1.5 rounded-full border border-[#ccff00]/30 text-[#ccff00] text-xs font-bold uppercase tracking-widest bg-[#ccff00]/5 backdrop-blur-md">
                        AI-Powered Career Guidance
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                    className="text-6xl md:text-8xl font-bold tracking-tight z-10"
                >
                    Build Your <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ccff00] to-green-400">Future Today.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-400 max-w-2xl leading-relaxed z-10"
                >
                    Experience the next generation of career mentorship. Real-time market insights, neural voice coaching, and gamified logic training.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex gap-4 z-10"
                >
                    <button onClick={handleStart} className="btn-lime flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                        Start Now <ArrowRight className="w-5 h-5" />
                    </button>
                    <Link to="/job-insights" className="btn-glass">
                        Explore Jobs
                    </Link>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: "Voice Coach",
                        desc: "Talk to a realistic AI mentor.",
                        icon: Sparkles,
                        color: "text-purple-400"
                    },
                    {
                        title: "Market Insights",
                        desc: "Live job data from Remotive.",
                        icon: TrendingUp,
                        color: "text-blue-400"
                    },
                    {
                        title: "Logic Quest",
                        desc: "Gamified LeetCode training.",
                        icon: Code2,
                        color: "text-green-400"
                    }
                ].map((feature, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -10 }}
                        className="apple-card p-8 flex flex-col items-start gap-4"
                    >
                        <div className={`p-3 rounded-2xl bg-white/5 ${feature.color}`}>
                            <feature.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold">{feature.title}</h3>
                        <p className="text-gray-400">{feature.desc}</p>
                    </motion.div>
                ))}
            </section>
        </div>
    );
};

export default Home;
