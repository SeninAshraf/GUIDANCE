import React from 'react';
import { Link } from 'react-router-dom';

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
                    <Link to="/career-guide" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition transform hover:scale-105 shadow-lg shadow-white/10">
                        Talk to AI Advisor 🎙️
                    </Link>
                    <Link to="/resume-builder" className="px-8 py-4 bg-transparent border border-gray-700 text-white font-bold rounded-full hover:bg-white/5 hover:border-white transition transform hover:scale-105">
                        Build Resume 📄
                    </Link>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <Link to="/career-guide" className="group p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 hover:bg-gray-800 transition duration-500">
                        <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">
                            🎙️
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition">Voice Career Agent</h3>
                        <p className="text-gray-400 leading-relaxed">
                            A conversational AI that understands your goals. Speak naturally and get personalized roadmaps, skill gaps, and advice instantly.
                        </p>
                    </Link>

                    {/* Feature 2 */}
                    <Link to="/resume-builder" className="group p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 hover:bg-gray-800 transition duration-500">
                        <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">
                            📄
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition">Smart Resume Builder</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Auto-generate industry-standard PDFs. Dynamic content suggestions and ATS optimization to help you stand out.
                        </p>
                    </Link>

                    {/* Feature 3 */}
                    <Link to="/interview" className="group p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-pink-500/50 hover:bg-gray-800 transition duration-500">
                        <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">
                            🎥
                        </div>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-pink-400 transition">AI Interview Coach</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Practice with a relatable AI interviewer. Real-time feedback on your speech, body language, and answer quality.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
