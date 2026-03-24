
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RefreshCw, FileText, User, BarChart, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { ref, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';

const CareerGuide = () => {
    const { user } = useAuth();
    const [latestResume, setLatestResume] = useState(null);
    // State Initialization
    const [conversation, setConversation] = useState(() => {
        try {
            const saved = localStorage.getItem('career_chat_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse history", e);
            return [];
        }
    });

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Refs (Declared before effects)
    const conversationRef = useRef(conversation);
    const recognitionRef = useRef(null);

    // Effects
    useEffect(() => {
        localStorage.setItem('career_chat_history', JSON.stringify(conversation));
        conversationRef.current = conversation;
    }, [conversation]);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('english');
    const [mode, setMode] = useState('general');

    // Fetch latest resume on mount
    useEffect(() => {
        if (!user?.uid) return;

        const filesRef = ref(db, 'userFiles');
        const resumeQuery = dbQuery(filesRef, orderByChild('userId'), equalTo(user.uid));

        const unsubscribe = onValue(resumeQuery, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const resumes = Object.entries(data)
                    .map(([id, val]) => ({ id, ...val }))
                    .filter(f => f.category === 'resumes')
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                if (resumes.length > 0) {
                    setLatestResume(resumes[0]);
                    console.log("[GUIDO] Resume detected for context:", resumes[0].name);
                }
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleDownloadPDF = async () => {
        if (conversation.length === 0) return alert("No conversation to download!");
        try {
            const response = await fetch('http://localhost:8000/api/career-agent/generate-pdf/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ history: conversation }),
            });
            if (response.ok) {
                const blobData = await response.blob();
                const pdfBlob = new Blob([blobData], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'career_guidance_chat.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) { console.error(error); }
    };

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (language === 'malayalam') utterance.lang = 'ml-IN';
        else {
            utterance.lang = 'en-US';
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async (text) => {
        const newUserMsg = { role: 'user', content: text };
        setConversation(prev => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            const langInstruction = language === 'malayalam' ? "(Please reply in MALAYALAM script)" : "(Please reply in ENGLISH)";
            const response = await fetch('http://localhost:8000/api/career-agent/advice/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `${text} ${langInstruction}`,
                    language,
                    mode,
                    history: conversationRef.current,
                    resumeUrl: latestResume?.url
                }),
            });
            const data = await response.json();
            const aiMsg = { role: 'ai', content: data.response };
            setConversation(prev => [...prev, aiMsg]);

            if (data.audio_base64) {
                const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
                audio.play().catch(console.error);
            } else {
                speakText(data.response);
            }
        } catch (error) {
            console.error(error);
            setConversation(prev => [...prev, { role: 'ai', content: "Connection error. Please ensure backend is running." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            const recognition = new SpeechRecognition();
            recognitionUtil(recognition);
        }
    };

    const recognitionUtil = (recognition) => {
        recognition.lang = language === 'malayalam' ? 'ml-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            handleSendMessage(text);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleNewChat = () => {
        setShowResetConfirm(true);
    }

    const confirmReset = () => {
        setConversation([]);
        localStorage.removeItem('career_chat_history');
        setShowResetConfirm(false);
    }

    return (
        <div className="flex flex-col h-[85vh] apple-card p-6 md:p-8 max-w-5xl mx-auto mt-4 overflow-hidden relative">
            {/* Header */}
            <div className="text-center mb-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-4"
                >
                    <User className="w-3 h-3" /> AI Career Coach
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                    Guido <span className="text-gray-500">Assistant</span>
                </h1>
                <p className="text-gray-400">
                    {mode === 'reviews' ? 'Analyzing Company Reviews & Culture' : 'Professional Software Engineering Mentor'}
                </p>
                {latestResume && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ccff00]/5 border border-[#ccff00]/10 text-[#ccff00]/70 text-[10px] font-bold uppercase tracking-tighter mx-auto"
                    >
                        <FileText className="w-3 h-3" /> Resume Context: {latestResume.name}
                    </motion.div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap justify-center gap-4 mb-6 relative z-10">
                {/* Persona Switch */}
                <div className="bg-[#1c1c1e] p-1 rounded-full border border-white/10 flex">
                    <button
                        onClick={() => setMode('general')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'general' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setMode('reviews')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'reviews' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Reviews
                    </button>
                </div>

                {/* Language Switch */}
                <div className="bg-[#1c1c1e] p-1 rounded-full border border-white/10 flex">
                    <button onClick={() => setLanguage('english')} className={`px-4 py-2 rounded-full text-sm transition-all ${language === 'english' ? 'bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/30' : 'text-gray-400'}`}>
                        🇺🇸 English
                    </button>
                    <button onClick={() => setLanguage('malayalam')} className={`px-4 py-2 rounded-full text-sm transition-all ${language === 'malayalam' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400'}`}>
                        🇮🇳 Malayalam
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} className="btn-glass p-3 rounded-full" title="Download PDF">
                        <FileText className="w-5 h-5" />
                    </button>
                    <button onClick={handleNewChat} className="btn-glass p-3 rounded-full hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400" title="New Chat">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showResetConfirm && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-xl">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10 max-w-sm w-full text-center shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">Start New Session?</h3>
                        <p className="text-gray-400 mb-6 text-sm">This will clear your current conversation history. Any unsaved progress will be lost.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReset}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Start New
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4 p-4 rounded-3xl bg-black/20 border border-white/5 relative custom-scrollbar">
                {conversation.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                        <p>Tap the mic to start your session...</p>
                    </div>
                )}

                {conversation.map((msg, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[85%] p-4 rounded-2xl text-lg leading-relaxed
                            ${msg.role === 'user'
                                ? 'bg-[#ccff00] text-black rounded-br-sm font-medium'
                                : 'bg-[#1c1c1e] text-gray-200 border border-white/10 rounded-bl-sm'
                            }
                        `}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-[#1c1c1e] text-gray-400 px-4 py-3 rounded-2xl rounded-bl-sm border border-white/10 flex gap-2 items-center">
                            <span className="w-2 h-2 bg-[#ccff00] rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-[#ccff00] rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-[#ccff00] rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Mic Trigger */}
            <div className="flex justify-center pb-4">
                <button
                    onClick={toggleListening}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                        ${isListening
                            ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] scale-110'
                            : 'bg-[#ccff00] hover:scale-105 shadow-[0_0_30px_rgba(204,255,0,0.3)]'}
                    `}
                >
                    {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-black" />}
                </button>
            </div>
        </div>
    );
};

export default CareerGuide;
