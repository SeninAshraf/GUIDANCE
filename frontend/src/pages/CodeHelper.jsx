
import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, CheckCircle, ArrowRight, Code, Trophy, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CodeHelper = () => {
    // const { user } = useAuth(); // Decoupled
    // const token = user?.token;

    // Game Phases: 'loading' -> 'logic' -> 'coding' -> 'victory'
    const [phase, setPhase] = useState('loading');

    // Data State
    const [problem, setProblem] = useState(null);
    const [loadingText, setLoadingText] = useState('Initializing Logic Engine...');

    // Settings
    const [difficulty, setDifficulty] = useState('beginner');
    const [category, setCategory] = useState('strings');

    // --- LOGIC PHASE STATE ---
    const [scrambledLogic, setScrambledLogic] = useState([]);
    const [userOrderedLogic, setUserOrderedLogic] = useState([]);
    const [logicError, setLogicError] = useState(null);

    // --- CODING PHASE STATE ---
    const [currentCodeStep, setCurrentCodeStep] = useState(0);
    const [userCode, setUserCode] = useState('');
    const [completedCodeLines, setCompletedCodeLines] = useState([]);
    const [codeError, setCodeError] = useState(null);
    const [codeSuccess, setCodeSuccess] = useState(null);

    // Fetch Problem
    useEffect(() => {
        fetchProblem();
    }, [difficulty, category]);

    // Cycling loading text
    useEffect(() => {
        if (phase !== 'loading') return;
        const messages = [
            `Accessing ${difficulty} ${category} archives...`,
            "Synthesizing Logic Nodes...",
            "Decrypting Algorithms...",
            "Preparing Sandbox..."
        ];
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setLoadingText(messages[i]);
        }, 800);
        return () => clearInterval(interval);
    }, [phase, difficulty, category]);

    const fetchProblem = async () => {
        setPhase('loading');
        setProblem(null);
        resetStates();

        try {
            const res = await fetch(`http://localhost:8000/api/code-helper/problem/?difficulty=${difficulty}&category=${category}`, {
                headers: {
                    // 'Authorization': `Token ${token}` // Removed for open access
                }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setProblem(data);
            const logics = data.steps.map(s => ({
                id: s.step_id,
                text: s.logic_pseudocode || s.goal
            }));
            setScrambledLogic([...logics].sort(() => Math.random() - 0.5));
            setPhase('logic');

        } catch (error) {
            console.error(error);
            setLoadingText("Connection Lost. Retrying...");
            setTimeout(fetchProblem, 2000);
        }
    };

    const resetStates = () => {
        setUserOrderedLogic([]);
        setLogicError(null);
        setCurrentCodeStep(0);
        setUserCode('');
        setCompletedCodeLines([]);
        setCodeError(null);
        setCodeSuccess(null);
    };

    // --- LOGIC PHASE HANDLERS ---
    const handleLogicClick = (logicItem) => {
        setScrambledLogic(prev => prev.filter(l => l.id !== logicItem.id));
        setUserOrderedLogic(prev => [...prev, logicItem]);
        setLogicError(null);
    };

    const handleUndoLogic = (logicItem) => {
        setUserOrderedLogic(prev => prev.filter(l => l.id !== logicItem.id));
        setScrambledLogic(prev => [...prev, logicItem]);
    };

    const checkLogicOrder = () => {
        if (scrambledLogic.length > 0) {
            setLogicError("Place all logic blocks first!");
            return;
        }
        const correctOrder = problem.steps.map(s => s.step_id);
        const userOrder = userOrderedLogic.map(l => l.id);
        const isCorrect = userOrder.every((val, index) => val === correctOrder[index]);

        if (isCorrect) {
            setPhase('coding');
        } else {
            setLogicError("Logic sequence incorrect. Review the order.");
        }
    };

    // --- CODING PHASE HANDLERS ---
    const handleValidateCode = () => {
        const currentStep = problem.steps[currentCodeStep];
        const expected = currentStep.code_line.trim().replace(/\s+/g, '').toLowerCase();
        const actual = userCode.trim().replace(/\s+/g, '').toLowerCase();

        if (actual === expected) {
            setCodeSuccess("System Verified.");
            const newCompleted = [...completedCodeLines, currentStep.code_line];
            setCompletedCodeLines(newCompleted);

            setTimeout(() => {
                setCodeSuccess(null);
                setUserCode('');
                if (currentCodeStep < problem.steps.length - 1) {
                    setCurrentCodeStep(prev => prev + 1);
                } else {
                    setPhase('victory');
                }
            }, 800);
        } else {
            setCodeError("Syntax Error. Check alignment.");
            setTimeout(() => setCodeError(null), 2000);
        }
    };

    const handleRevealCode = () => {
        const currentStep = problem.steps[currentCodeStep];
        setUserCode(currentStep.code_line);
    };

    return (
        <div className="min-h-screen w-full p-4 md:p-8 flex flex-col items-center font-sans text-gray-200 pb-32">

            {/* Header */}
            <div className="mb-8 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-4"
                >
                    <Brain className="w-3 h-3" /> Logic Quest 2.0
                </motion.div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-2">
                    {phase === 'logic' && "Sequence Architecture"}
                    {phase === 'coding' && "Code Synthesis"}
                    {phase === 'victory' && "System Online"}
                    {phase === 'loading' && "System Boot"}
                </h1>
            </div>

            {/* Config & Controls */}
            {phase !== 'loading' && phase !== 'victory' && (
                <div className="flex flex-wrap justify-center gap-4 mb-8 bg-[#1c1c1e] p-1.5 rounded-2xl border border-white/10 z-10 w-fit">
                    <select
                        value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-gray-400 focus:text-white outline-none px-4 py-2 cursor-pointer border-r border-white/10 pr-8"
                    >
                        <option value="beginner">Beginner Mode</option>
                        <option value="medium">Engineer Mode</option>
                        <option value="hard">Architect Mode</option>
                    </select>
                    <select
                        value={category} onChange={(e) => setCategory(e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-wider text-gray-400 focus:text-white outline-none px-4 py-2 cursor-pointer pr-8"
                    >
                        <option value="strings">String Processor</option>
                        <option value="sql">Database Query</option>
                        <option value="logic">Core Logic</option>
                    </select>
                    <button onClick={fetchProblem} className="bg-white/10 hover:bg-white text-white hover:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all">
                        Reset
                    </button>
                </div>
            )}

            {/* GAME AREA */}
            <div className="w-full max-w-6xl apple-card overflow-hidden min-h-[600px] flex flex-col relative">

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ccff00]/5 rounded-full blur-[150px] pointer-events-none"></div>

                <AnimatePresence mode='wait'>

                    {/* LOAD SCREEN */}
                    {phase === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-12 relative z-10"
                        >
                            <div className="w-16 h-16 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin mb-6"></div>
                            <h2 className="text-xl font-mono text-[#ccff00] animate-pulse">{loadingText}</h2>
                        </motion.div>
                    )}

                    {/* PHASE 1: LOGIC PUZZLE */}
                    {phase === 'logic' && problem && (
                        <motion.div
                            key="logic"
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col lg:flex-row p-6 md:p-10 gap-10 relative z-10"
                        >
                            {/* LEFT: Context */}
                            <div className="lg:w-1/3 space-y-6">
                                <div>
                                    <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-2">Objective</div>
                                    <h2 className="text-3xl font-bold text-white leading-tight">{problem.title}</h2>
                                </div>
                                <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10 text-gray-300 leading-relaxed text-sm">
                                    "{problem.story}"
                                </div>
                                <div className="text-sm text-gray-500">
                                    <strong className="text-gray-300">Directive:</strong> Arrange the logic modules on the right into the correct execution sequence.
                                </div>
                                {logicError && (
                                    <div className="text-red-400 text-sm font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                        ⚠️ {logicError}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Puzzle Board */}
                            <div className="lg:w-2/3 flex flex-col gap-6">
                                {/* Drop Zone */}
                                <div className="flex-1 bg-black/40 rounded-3xl border-2 border-dashed border-[#ccff00]/20 p-6 min-h-[250px] transition-all relative">
                                    <h3 className="text-xs uppercase text-[#ccff00] font-bold mb-4 tracking-widest absolute top-6 left-6">Execution Stack</h3>
                                    <div className="space-y-3 pt-8">
                                        {userOrderedLogic.map((item, idx) => (
                                            <motion.div
                                                layoutId={item.id}
                                                key={item.id}
                                                onClick={() => handleUndoLogic(item)}
                                                className="bg-[#ccff00] text-black p-4 rounded-xl font-bold cursor-pointer flex items-center gap-4 shadow-lg hover:bg-white hover:scale-[1.02] transition-all group"
                                            >
                                                <span className="bg-black/10 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black group-hover:bg-black group-hover:text-white transition-colors">{idx + 1}</span>
                                                {item.text}
                                            </motion.div>
                                        ))}
                                        {userOrderedLogic.length === 0 && (
                                            <div className="text-gray-600 text-center py-20 font-mono text-sm">
                                                [ Awaiting Modules... ]
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Source Zone */}
                                <div className="bg-[#1c1c1e] p-6 rounded-3xl border border-white/5">
                                    <h3 className="text-xs uppercase text-gray-500 font-bold mb-4 tracking-widest flex items-center gap-2">
                                        <Shuffle className="w-4 h-4" /> Available Modules
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {scrambledLogic.map((item) => (
                                            <motion.div
                                                layoutId={item.id}
                                                key={item.id}
                                                onClick={() => handleLogicClick(item)}
                                                className="bg-[#2c2c2e] hover:bg-[#3a3a3c] text-gray-300 px-5 py-3 rounded-xl cursor-pointer border border-white/5 transition-all text-sm font-medium active:scale-95"
                                            >
                                                {item.text}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={checkLogicOrder}
                                    disabled={scrambledLogic.length > 0}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg uppercase tracking-wider transition-all
                                        ${scrambledLogic.length === 0 ? 'btn-lime shadow-[0_0_40px_rgba(204,255,0,0.3)]' : 'bg-[#1c1c1e] text-gray-600 cursor-not-allowed'}
                                    `}
                                >
                                    {scrambledLogic.length === 0 ? "Initialize System" : "Assemble All Modules"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* PHASE 2: CODING */}
                    {phase === 'coding' && (
                        <motion.div
                            key="coding"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col lg:flex-row h-full relative z-10"
                        >
                            {/* LEFT: Sidebar plan */}
                            <div className="lg:w-1/3 bg-[#1c1c1e]/50 p-6 lg:p-10 border-r border-white/5 overflow-y-auto">
                                <h3 className="text-[#ccff00] font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Validated Architecture
                                </h3>
                                <div className="space-y-4">
                                    {userOrderedLogic.map((item, idx) => (
                                        <div key={item.id} className={`p-4 rounded-2xl border transition-all ${idx === currentCodeStep ? 'bg-[#ccff00]/10 border-[#ccff00]/30' : 'bg-black/20 border-white/5 opacity-40'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="min-w-6 text-xs text-gray-500 font-mono mt-1">0{idx + 1}</div>
                                                <div>
                                                    <div className={`font-medium text-sm mb-2 ${idx === currentCodeStep ? 'text-white' : 'text-gray-400'}`}>{item.text}</div>
                                                    {idx < currentCodeStep && (
                                                        <div className="text-[#ccff00] font-mono text-xs bg-black/40 px-3 py-1.5 rounded-lg inline-block border border-white/5">
                                                            {problem.steps[idx].code_line}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: Editor */}
                            <div className="lg:w-2/3 p-8 lg:p-12 flex flex-col bg-black">
                                <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
                                    <Code className="w-12 h-12 text-[#ccff00] mb-8 mx-auto opacity-80" />
                                    <h2 className="text-3xl font-bold text-center mb-2 text-white">Synthesize Code</h2>
                                    <p className="text-gray-500 text-center mb-10 text-sm font-mono">
                                        Translating module {currentCodeStep + 1} to {problem.language}
                                    </p>

                                    <div className="space-y-4 relative">
                                        <div className="bg-[#1c1c1e] px-4 py-2 rounded-t-xl border border-white/10 border-b-0 w-fit">
                                            <span className="text-xs font-bold text-gray-400">INPUT DIRECTIVE</span>
                                        </div>
                                        <div className="bg-[#1c1c1e] border border-white/10 rounded-xl rounded-tl-none p-6 text-gray-300 font-medium text-sm mb-6">
                                            {userOrderedLogic[currentCodeStep].text}
                                        </div>

                                        <input
                                            type="text"
                                            autoFocus
                                            value={userCode}
                                            onChange={(e) => setUserCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleValidateCode()}
                                            placeholder="// Input syntax here..."
                                            className="w-full bg-black border-2 border-[#333] focus:border-[#ccff00] rounded-xl px-6 py-5 font-mono text-lg text-[#ccff00] outline-none transition-all placeholder:text-gray-800"
                                        />

                                        {codeError && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-red-500 font-bold text-xs uppercase tracking-widest mt-4">
                                                {codeError}
                                            </motion.div>
                                        )}
                                        {codeSuccess && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-[#ccff00] font-bold text-xs uppercase tracking-widest mt-4">
                                                {codeSuccess}
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 mt-12 justify-center">
                                        <button onClick={handleRevealCode} className="text-gray-600 hover:text-white text-xs font-bold uppercase tracking-wider px-6 py-3 transition-colors">
                                            Reveal Syntax
                                        </button>
                                        <button onClick={handleValidateCode} className="btn-lime px-10 py-3 rounded-xl font-bold text-sm uppercase tracking-wider">
                                            Execute
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PHASE 3: VICTORY */}
                    {phase === 'victory' && (
                        <motion.div
                            key="victory"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full relative z-10"
                        >
                            <Trophy className="w-24 h-24 text-[#ccff00] mb-8 drop-shadow-[0_0_30px_rgba(204,255,0,0.5)]" />
                            <h2 className="text-5xl font-black text-white mb-6">System Optmized.</h2>
                            <p className="max-w-xl text-xl text-gray-400 mb-10 leading-relaxed font-light">{problem.simple_explanation}</p>

                            <button onClick={fetchProblem} className="btn-lime px-12 py-4 rounded-full text-lg font-bold shadow-[0_0_50px_rgba(204,255,0,0.4)] hover:shadow-[0_0_80px_rgba(204,255,0,0.6)] transition-all">
                                Initialize Next Sequence
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CodeHelper;

