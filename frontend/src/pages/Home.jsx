import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const RecentChatHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('career_chat_history');
        if (saved) {
            setHistory(JSON.parse(saved).slice(-2)); // Get last 2 messages
        }
    }, []);

    if (history.length === 0) return null;

    return (
        <div className="max-w-3xl mx-auto -mt-8 mb-16 relative z-20 px-4">
            <div className="glass-card p-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Recent Activity
                    </h3>
                    <Link to="/career-guide" className="text-blue-400 text-sm hover:underline">Continue Chat &rarr;</Link>
                </div>
                <div className="space-y-3">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-900/50 text-blue-200' : 'bg-gray-700/50 text-gray-300'
                                }`}>
                                <span className="font-bold block text-xs mb-1 opacity-50">{msg.role === 'user' ? 'You' : 'AI Agent'}</span>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Home = () => {
    return (
        <div className="w-full">
            {/* Navbar Placeholder if needed, already in Layout? Assuming Layout handles it or Home is standalone content */}

            {/* Hero Section */}
            <div className="relative flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-700 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[100px] opacity-10"></div>

                <h1 className="relative text-6xl md:text-8xl font-black mb-6 tracking-tight leading-tight z-10">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                        Shape Your
                    </span> <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
                        Future Career
                    </span>
                </h1>

                <p className="relative max-w-2xl text-lg md:text-xl text-gray-400 mb-10 z-10 leading-relaxed">
                    The all-in-one AI platform to guide your professional journey.
                    Get instant career advice, build ATS-proof resumes, and master interviews with real-time coaching.
                </p>

                <div className="relative flex flex-wrap gap-4 z-10 justify-center">
                    <Link to="/career-guide" className="btn-primary flex items-center gap-2">
                        Talk to AI Advisor <span className="text-xl">🎙️</span>
                    </Link>
                    <Link to="/resume-builder" className="btn-ghost flex items-center gap-2">
                        Build Resume <span className="text-xl">📄</span>
                    </Link>
                </div>
            </div>

            {/* Recent History Section */}
            <RecentChatHistory />

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <Link to="/career-guide" className="glass-card-hover p-8 group">
                        <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition border border-blue-500/20">
                            🎙️
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition">Voice Career Agent</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            A conversational AI that understands your goals. Speak naturally and get personalized roadmaps.
                        </p>
                    </Link>

                    {/* Feature 2 */}
                    <Link to="/resume-builder" className="glass-card-hover p-8 group">
                        <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition border border-purple-500/20">
                            📄
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition">Smart Resume Builder</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Auto-generate industry-standard PDFs. Dynamic content suggestions and ATS optimization.
                        </p>
                    </Link>

                    {/* Feature 3 */}
                    <Link to="/interview" className="glass-card-hover p-8 group">
                        <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition border border-pink-500/20">
                            🎥
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-pink-400 transition">AI Interview Coach</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Practice with a relatable AI interviewer. Real-time feedback on your speech and questions.
                        </p>
                    </Link>

                    {/* Feature 4: CodeHelper */}
                    <Link to="/code-helper" className="glass-card-hover p-8 group">
                        <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition border border-yellow-500/20">
                            🧩
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-yellow-400 transition">Beginner Mentor</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Think-First Coding. Master fundamentals with simplified, story-based micro-problems.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
