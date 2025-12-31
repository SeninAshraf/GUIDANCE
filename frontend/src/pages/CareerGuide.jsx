
import React, { useState, useEffect, useRef } from 'react';

const CareerGuide = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    // Load initial state from local storage or empty array
    const [conversation, setConversation] = useState(() => {
        const saved = localStorage.getItem('career_chat_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to local storage whenever conversation changes
    useEffect(() => {
        localStorage.setItem('career_chat_history', JSON.stringify(conversation));
    }, [conversation]);

    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState('english'); // 'english' or 'malayalam'
    const [mode, setMode] = useState('general'); // 'general' or 'reviews'
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            // Set lang based on selection
            recognitionRef.current.lang = language === 'malayalam' ? 'ml-IN' : 'en-US';

            recognitionRef.current.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleSendMessage(text);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            }
        } else {
            alert("Your browser does not support speech recognition. Please use Chrome or Edge.");
        }
    }, [language]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleNewChat = () => {
        setConversation([]);
        localStorage.removeItem('career_chat_history');
        window.speechSynthesis.cancel(); // Stop any current speech
    };

    const speakText = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        // Adjust voice/lang for TTS
        if (language === 'malayalam') {
            utterance.lang = 'ml-IN';
        } else {
            utterance.lang = 'en-US';
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => voice.name.includes('Google US English')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async (text) => {
        const newUserMsg = { role: 'user', content: text };
        setConversation(prev => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/career-agent/advice/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    language,
                    mode,
                    history: conversation // Send existing history
                }),
            });
            const data = await response.json();

            const aiMsg = { role: 'ai', content: data.response };
            setConversation(prev => [...prev, aiMsg]);

            // Play Backend Audio (gTTS) if available, else fallback to Browser TTS
            if (data.audio_base64) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
                audio.play().catch(e => console.error("Audio Play Error:", e));
            } else {
                speakText(data.response);
            }
        } catch (error) {
            console.error("Error fetching advice:", error);
            const errorMsg = { role: 'ai', content: "Sorry, connection error." };
            setConversation(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-84px)] glass-card p-6 max-w-4xl mx-auto mt-6 animate-fade-in mx-4">
            <div className="text-center mb-6">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    AI Voice Career Coach
                </h1>
                <p className="text-gray-400 mt-2 text-sm">
                    {mode === 'reviews' ? '🔍 Analyzing Glassdoor Job Reviews' : 'Expert Software Engineering Guidance'}
                </p>

                <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-6">

                    {/* 1. Agent Mode Selection */}
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Persona</span>
                        <div className="bg-black/40 p-1 rounded-xl flex gap-2 border border-white/5">
                            <button
                                onClick={() => setMode('general')}
                                className={`px-4 py-2 rounded-lg transition-all ${mode === 'general' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                🧑‍💼 Career Coach
                            </button>
                            <button
                                onClick={() => setMode('reviews')}
                                className={`px-4 py-2 rounded-lg transition-all ${mode === 'reviews' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                📊 Market Analyst
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-12 bg-gray-700"></div>

                    {/* 2. Language Selection */}
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Voice Language</span>
                        <div className="bg-gray-800 p-1 rounded-lg flex gap-2">
                            <button
                                onClick={() => setLanguage('english')}
                                className={`px-4 py-2 rounded-md transition-colors ${language === 'english' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                English 🇺🇸
                            </button>
                            <button
                                onClick={() => setLanguage('malayalam')}
                                className={`px-4 py-2 rounded-md transition-colors ${language === 'malayalam' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Malayalam 🇮🇳
                            </button>
                        </div>
                    </div>

                    {/* New Chat Button */}
                    <div className="flex flex-col items-center justify-end">
                        <button
                            onClick={handleNewChat}
                            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                            title="Clear Chat History"
                        >
                            🔄 New Chat
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 space-y-4 p-4 bg-gray-800 rounded-lg custom-scrollbar">
                {conversation.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p className="text-lg">Tap the microphone to start talking in {language === 'english' ? 'English' : 'Malayalam'}...</p>
                    </div>
                )}
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-center text-gray-400 animate-pulse">Thinking...</div>}
            </div>

            <div className="flex items-center justify-center p-4">
                <button
                    onClick={toggleListening}
                    className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-lg ${isListening
                        ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CareerGuide;
