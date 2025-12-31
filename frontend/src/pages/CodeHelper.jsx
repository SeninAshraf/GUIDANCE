import React, { useState, useEffect } from 'react';

const CodeHelper = () => {
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingText, setLoadingText] = useState('Finding a challenge...');

    // Difficulty & Topic State
    const [difficulty, setDifficulty] = useState('beginner'); // 'beginner', 'medium', 'hard'
    const [category, setCategory] = useState('strings'); // 'strings', 'sql', 'logic'

    // Line-by-Line State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [userCode, setUserCode] = useState(''); // Current line input
    const [completedSteps, setCompletedSteps] = useState([]); // Array of accepted code lines
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false); // New: Show breakdown

    // Fetch Problem on Mount or Filter Change
    useEffect(() => {
        fetchProblem();
    }, [difficulty, category]);

    // Cycling loading messages
    useEffect(() => {
        if (!loading) return;
        const messages = [
            `Scanning ${difficulty} ${category} challenges...`,
            "Consulting AI Mentor...",
            "Breaking down logic...",
            "Preparing step-by-step guide..."
        ];
        let i = 0;
        setLoadingText(messages[0]);
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setLoadingText(messages[i]);
        }, 800);
        return () => clearInterval(interval);
    }, [loading, difficulty, category]);

    const fetchProblem = async () => {
        setLoading(true);
        setProblem(null);
        setCurrentStepIndex(0);
        setUserCode('');
        setCompletedSteps([]);
        setError(null);
        setSuccessMsg(null);
        setShowExplanation(false);

        try {
            const res = await fetch(`http://localhost:8000/api/code-helper/problem/?difficulty=${difficulty}&category=${category}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setProblem(data);
        } catch (error) {
            console.error(error);
            setError("Failed to load problem. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleValidateLine = () => {
        if (!problem) return;
        const currentStep = problem.steps[currentStepIndex];
        const expected = currentStep.code_line.trim();
        const actual = userCode.trim();

        // Simple fuzzy match (ignores spaces around operators, casing for SQL)
        const normalize = (str) => str.replace(/\s+/g, '').toLowerCase();

        if (normalize(actual) === normalize(expected)) {
            // Correct!
            setSuccessMsg("Correct! Moving to next step...");
            const newCompleted = [...completedSteps, currentStep.code_line]; // Use canonical version
            setCompletedSteps(newCompleted);

            setTimeout(() => {
                setSuccessMsg(null);
                setUserCode('');
                if (currentStepIndex < problem.steps.length - 1) {
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    // All steps done!
                    setCurrentStepIndex(prev => prev + 1); // Move to "Finished" state
                    setShowExplanation(true); // Show full explanation at end
                }
            }, 1000);
        } else {
            setError("Not quite. Check your syntax or try the hint!");
            setTimeout(() => setError(null), 2000);
        }
    };

    const handleReveal = () => {
        if (!problem) return;
        const currentStep = problem.steps[currentStepIndex];
        setUserCode(currentStep.code_line);
        setShowExplanation(true); // Show explanation when revealing
    };

    return (
        <div className="min-h-[calc(100vh-64px)] w-full p-6 flex flex-col items-center animate-fade-in relative">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-500 mb-2">
                Code Mentor: Guided Mode 🧩
            </h1>
            <p className="text-gray-400 mb-6 font-medium">Master coding one line at a time.</p>

            {/* Controls Container */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
                {/* Difficulty Selector */}
                <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {['beginner', 'medium', 'hard'].map((level) => (
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`px-4 py-1.5 rounded-lg font-bold capitalize text-sm transition-all ${difficulty === level
                                    ? 'bg-yellow-500 text-black shadow-lg scale-105'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* Topic Selector */}
                <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {['strings', 'sql', 'logic'].map((topic) => (
                        <button
                            key={topic}
                            onClick={() => setCategory(topic)}
                            className={`px-4 py-1.5 rounded-lg font-bold capitalize text-sm transition-all ${category === topic
                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {topic === 'sql' ? 'SQL' : topic}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-6 mt-10">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">🧠</span>
                        </div>
                    </div>
                    <div className="text-xl text-yellow-100 font-mono animate-pulse">
                        {loadingText}
                    </div>
                </div>
            ) : problem ? (
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">

                    {/* LEFT: Context & Accumulated Code */}
                    <div className="glass-card p-6 flex flex-col relative overflow-hidden h-full">
                        <div className="mb-4 flex gap-2">
                            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30 uppercase tracking-wide">
                                {problem.concept}
                            </span>
                            <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-wide">
                                {problem.language}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{problem.title}</h2>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-6 text-gray-300 shadow-inner text-sm">
                            {problem.story}
                        </div>

                        {/* Code Display */}
                        <div className="flex-1 bg-black rounded-xl border border-gray-700 p-4 font-mono text-sm overflow-y-auto w-full">
                            {completedSteps.map((line, idx) => (
                                <div key={idx} className="text-green-400 mb-1 flex">
                                    <span className="text-gray-600 mr-4 select-none w-6 text-right">{idx + 1}</span>
                                    {line}
                                </div>
                            ))}
                            {/* Current Line Placeholder */}
                            {currentStepIndex < problem.steps.length && (
                                <div className="text-yellow-500/50 mb-1 flex animate-pulse">
                                    <span className="text-gray-600 mr-4 select-none w-6 text-right">{currentStepIndex + 1}</span>
                                    <span className="italic">// Your code will appear here...</span>
                                </div>
                            )}
                            {/* Future Lines Placeholder */}
                            {problem.steps.slice(currentStepIndex + 1).map((_, idx) => (
                                <div key={idx} className="text-gray-700/50 mb-1 flex">
                                    <span className="text-gray-800 mr-4 select-none w-6 text-right">{currentStepIndex + 2 + idx}</span>
                                    ................
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Interaction Panel */}
                    <div className="glass-card p-8 flex flex-col justify-center h-full relative">
                        {currentStepIndex < problem.steps.length ? (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-2">
                                        Step {currentStepIndex + 1} of {problem.steps.length}
                                    </h3>
                                    <h2 className="text-3xl font-bold text-white mb-4">
                                        {problem.steps[currentStepIndex].goal}
                                    </h2>
                                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-xl">
                                        <p className="text-blue-100 text-lg">
                                            {problem.steps[currentStepIndex].explanation}
                                        </p>
                                    </div>
                                </div>

                                <div className="relative mb-6">
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border-2 border-white/10 rounded-xl px-6 py-4 text-xl font-mono text-white focus:border-yellow-500 focus:outline-none transition-all placeholder-gray-600"
                                        placeholder={`Type the ${problem.language} code here...`}
                                        value={userCode}
                                        onChange={(e) => setUserCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleValidateLine()}
                                        autoFocus
                                    />
                                    {successMsg && (
                                        <div className="absolute -bottom-10 left-0 text-green-400 font-bold animate-bounce-short">
                                            {successMsg}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="absolute -bottom-10 left-0 text-red-400 font-bold animate-shake">
                                            {error}
                                        </div>
                                    )}
                                </div>

                                {showExplanation && problem.simple_explanation && (
                                    <div className="mb-4 bg-green-900/20 border border-green-500/30 p-4 rounded-xl animate-fade-in">
                                        <h4 className="text-green-400 font-bold text-xs uppercase mb-1">Simple Explanation</h4>
                                        <p className="text-green-100 text-sm">{problem.simple_explanation}</p>
                                    </div>
                                )}

                                <div className="flex gap-4 mt-auto">
                                    <button
                                        onClick={handleReveal}
                                        className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Reveal Answer 👁️
                                    </button>
                                    <button
                                        onClick={handleValidateLine}
                                        className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Check Code ✅
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center animate-fade-in-up">
                                <div className="text-6xl mb-6">🎉</div>
                                <h2 className="text-3xl font-bold text-white mb-4">Program Complete!</h2>
                                <p className="text-gray-400 mb-8">
                                    {problem.simple_explanation || "You've successfully built the solution line-by-line."}
                                </p>
                                <button
                                    onClick={fetchProblem}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                                >
                                    Next Challenge 🚀
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center mt-20">
                    <p className="text-red-400 text-xl font-bold mb-4">{error || "Something went wrong."}</p>
                    <button
                        onClick={fetchProblem}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default CodeHelper;
