import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Upload, Code, Users, Brain, ChevronRight, Video, Mic, StopCircle, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const InterviewCoach = () => {
    const { user } = useAuth();
    const token = user?.token;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStatus, setCameraStatus] = useState("Initializing...");

    // Performance Metrics
    const [postureScore, setPostureScore] = useState(100);
    const [goodPostureCount, setGoodPostureCount] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);
    const [sessionStats, setSessionStats] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);

    // Resume & Questions
    const [jobRole, setJobRole] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [loadingModel, setLoadingModel] = useState(false);

    // Speech Recognition
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [qaHistory, setQaHistory] = useState([]);
    const recognitionRef = useRef(null);

    // Refs for Loop
    const requestRef = useRef();
    const faceLandmarkerRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);

    const [modelReady, setModelReady] = useState(false);

    // 1. Initialize FaceLandmarker
    useEffect(() => {
        const loadModel = async () => {
            setLoadingModel(true);
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                console.log("FaceLandmarker loaded!");
                setModelReady(true);
                setCameraStatus("Model Ready. Waiting for Camera...");
            } catch (err) {
                console.error("Failed to load MediaPipe:", err);
            } finally {
                setLoadingModel(false);
            }
        };
        loadModel();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
            stopListening();
        };
    }, []);

    // Speech Logic
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn("Speech Recognition not supported");
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            // Append final to existing, show interim
            if (finalTranscript) {
                setTranscript(prev => prev + " " + finalTranscript);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // Auto-start listening when speaking ends (simplified simulation)
    // For now, we'll manually toggle or start after question speech

    // 2. Camera & Prediction Loop
    // 2. Camera Start (Decoupled from AI)
    useEffect(() => {
        if (!isSessionActive) return;

        let stream = null;

        const startCamera = async () => {
            console.log("Starting Camera Request...");
            setCameraStatus("Starting Camera Hardware...");
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // We DO NOT wait for 'onloadeddata' to set active. We set it immediately.
                    setCameraStatus("Active");
                    videoRef.current.play().catch(e => console.error(e));
                }
            } catch (err) {
                console.error("Camera Error:", err);
                setCameraStatus("Camera Error: " + err.message);
            }
        };

        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isSessionActive]);


    // 3. Prediction Loop (Only if Camera + Model are ready)
    useEffect(() => {
        if (!isSessionActive || !modelReady) return;

        const loop = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
                // Only update status if it was stuck
                setCameraStatus("Active");
                predictWebcam();
            } else {
                requestRef.current = requestAnimationFrame(loop);
            }
        };
        loop();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isSessionActive, modelReady]);


    const predictWebcam = async () => {
        if (!faceLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;

        try {
            // Ensure video is playing
            if (videoRef.current.videoWidth === 0) {
                requestRef.current = requestAnimationFrame(predictWebcam);
                return;
            }

            let startTimeMs = performance.now();
            if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
                lastVideoTimeRef.current = videoRef.current.currentTime;

                const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

                // Draw
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    const landmarks = results.faceLandmarks[0];
                    const noseTip = landmarks[1]; // Nose Tip

                    // Normalized coordinates (0.0 - 1.0)
                    const isCentered = noseTip.x > 0.35 && noseTip.x < 0.65 && noseTip.y > 0.3 && noseTip.y < 0.7;

                    if (isCentered) {
                        setGoodPostureCount(prev => prev + 1);
                        setPostureScore(100);
                        ctx.strokeStyle = '#ccff00'; // Lime
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#ccff00';
                    } else {
                        setPostureScore(prev => Math.max(0, prev - 1));
                        ctx.strokeStyle = '#FF3B30'; // Red
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#FF3B30';
                    }
                    setTotalFrames(prev => prev + 1);

                    // Draw Face Box (Approximation)
                    ctx.lineWidth = 4;
                    ctx.strokeRect(canvas.width * 0.25, canvas.height * 0.15, canvas.width * 0.5, canvas.height * 0.7);

                    // Draw Nose Dot
                    ctx.fillStyle = isCentered ? '#ccff00' : '#FF3B30';
                    ctx.beginPath();
                    ctx.arc(noseTip.x * canvas.width, noseTip.y * canvas.height, 6, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        } catch (e) {
            console.error("Tracking Loop Error:", e);
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    // --- LOGIC: Resume & Flow (Simplified) ---

    const startResumeSession = async (file) => {
        if (!file) return;
        setIsLoading(true);
        setLoadingMessage("Analyzing Resume...");
        const formData = new FormData();
        formData.append('resume', file);
        await fetchQuestions(formData);
    };

    const startRoleSession = async (role) => {
        setIsLoading(true);
        setLoadingMessage(`Preparing ${role} Interview...`);
        setJobRole(role);
        // await fetchQuestions(JSON.stringify({ job_role: role }), 'application/json');

        // Mock fallback to avoid backend dependency breaks during demo
        setTimeout(() => {
            setQuestions([
                `Tell me about your experience as a ${role}.`,
                "Describe a challenging project you worked on.",
                "How do you handle conflict in a team?"
            ]);
            setIsSessionActive(true);
            speakText(`Tell me about your experience as a ${role}.`);
            setIsLoading(false);
        }, 1500);
    };

    // Kept for Resume Flow
    const fetchQuestions = async (body) => {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const res = await fetch('http://127.0.0.1:8000/api/interview-coach/start/', {
                method: 'POST', body: body,
                headers: headers
            });
            if (!res.ok) {
                const errorData = await res.json();
                console.error("Backend Error Data:", errorData);
                throw new Error(errorData.detail || errorData.error || "Backend Error");
            }

            const data = await res.json();
            if (data.questions) {
                setQuestions(data.questions);
                setIsSessionActive(true);
                setCurrentQuestionIndex(0);
                speakText(data.questions[0]);
                // alert("Resume analyzed successfully!"); // Optional: Feedback
            }
        } catch (err) {
            console.error("Resume Analysis Failed:", err);
            // Show the actual error message to the user
            alert(`${err.message}\n\nSwitching to default questions.`);
            // Fallback
            setQuestions(["Tell me about yourself.", "Why this role?", "Describe a challenge you faced."]);
            setIsSessionActive(true);
        } finally {
            setIsLoading(false);
        }
    };

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English')) || voices[0];
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => {
            // Start listening after question is asked
            startListening();
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleNextQuestion = () => {
        stopListening();

        // Save current QA
        const currentQA = {
            question: questions[currentQuestionIndex],
            answer: transcript
        };
        setQaHistory(prev => [...prev, currentQA]);

        // Reset for next
        setTranscript("");

        if (currentQuestionIndex < questions.length - 1) {
            const n = currentQuestionIndex + 1;
            setCurrentQuestionIndex(n);
            speakText(questions[n]);
        } else {
            // Need to pass the FINAL history, including this last one
            handleEndSession([...qaHistory, currentQA]);
        }
    };

    const handleEndSession = async (finalHistory) => {
        setIsSessionActive(false);
        stopListening();

        // Calculate basic stats locally first
        const basicStats = {
            focus_score: Math.min(100, Math.round((goodPostureCount / (totalFrames || 1)) * 100)),
            posture_score: Math.round(postureScore),
        };

        // Transition to loading state for report generation
        setLoadingMessage("Generating Detailed PDF Report...");
        setIsLoading(true);

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch('http://127.0.0.1:8000/api/interview-coach/end-session/', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    history: finalHistory,
                    stats: basicStats
                })
            });

            if (response.ok) {
                // Trigger PDF Download
                const blobData = await response.blob();
                const pdfBlob = new Blob([blobData], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(pdfBlob);
                setPdfUrl(url); // Save for manual download

                const a = document.createElement('a');
                a.href = url;
                a.download = `Interview_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                setSessionStats({
                    ...basicStats,
                    feedback: "Your comprehensive report has been downloaded! Check the PDF for detailed feedback on each answer."
                });
            } else {
                const errData = await response.json();
                throw new Error(errData.detail || errData.error || "Failed to generate report");
            }
        } catch (error) {
            console.error(error);
            setSessionStats({
                ...basicStats,
                feedback: `Session complete, but PDF generation failed: ${error.message}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI COMPONENTS ---

    const renderLandingPage = () => (
        <div className="w-full max-w-5xl space-y-12 relative z-10">
            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-500/30 text-lime-700 dark:text-[#ccff00] dark:bg-[#ccff00]/10 dark:border-[#ccff00]/20 text-xs font-bold uppercase tracking-widest mb-4"
                >
                    <Video className="w-3 h-3" /> AI Interview Studio
                </motion.div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Master Your Presence.</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                    Real-time AI analysis of your posture, eye contact, and verbal responses.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Resume Card */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="apple-card p-10 cursor-pointer flex flex-col items-center text-center group relative overflow-hidden"
                >
                    <div className="bg-lime-400/20 dark:bg-[#ccff00]/10 p-5 rounded-full mb-6 group-hover:bg-lime-400/30 dark:group-hover:bg-[#ccff00]/20 transition-colors">
                        <Upload className="w-8 h-8 text-lime-700 dark:text-[#ccff00]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Resume</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">Generate tailored questions based on your actual CV profile.</p>

                    <button onClick={() => document.getElementById('res-upload').click()} className="btn-glass px-8 py-3 rounded-full text-sm font-bold">
                        Select PDF
                    </button>
                    <input id="res-upload" type="file" accept=".pdf" className="hidden" onChange={(e) => startResumeSession(e.target.files[0])} />
                </motion.div>

                {/* Role Cards */}
                <div className="space-y-4">
                    <motion.div whileHover={{ x: 5 }} onClick={() => startRoleSession("Software Engineer")} className="apple-card p-6 cursor-pointer flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors">
                        <div className="p-4 bg-blue-500/10 rounded-2xl">
                            <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Software Engineer</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-500 font-medium">System Design & Coding</p>
                        </div>
                        <ChevronRight className="ml-auto text-gray-600" />
                    </motion.div>

                    <motion.div whileHover={{ x: 5 }} onClick={() => startRoleSession("Product Manager")} className="apple-card p-6 cursor-pointer flex items-center gap-6 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors">
                        <div className="p-4 bg-orange-500/10 rounded-2xl">
                            <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Product Manager</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-500 font-medium">Strategy & Execution</p>
                        </div>
                        <ChevronRight className="ml-auto text-gray-600" />
                    </motion.div>
                </div>
            </div>

            {loadingModel && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 py-3 px-6 mx-auto w-fit text-[#ccff00] text-xs font-bold uppercase tracking-wider bg-[#ccff00]/5 rounded-full border border-[#ccff00]/10">
                    <div className="w-3 h-3 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin"></div>
                    Initializing Vision Models...
                </motion.div>
            )}
        </div>
    );

    const renderSessionView = () => (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in p-4 relative z-10">
            {/* Camera Feed */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black h-[500px]">
                <video
                    ref={videoRef}
                    className="absolute w-full h-full object-cover z-10 opacity-80"
                    autoPlay
                    playsInline
                    muted
                ></video>

                <canvas ref={canvasRef} className="absolute w-full h-full object-cover z-20 pointer-events-none opacity-80"></canvas>

                <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 flex items-center gap-3 z-30 rounded-full border border-white/5">
                    <div className={`w-3 h-3 rounded-full ${postureScore > 80 ? 'bg-[#ccff00] shadow-[0_0_10px_#ccff00]' : 'bg-red-500 shadow-[0_0_10px_red]'}`}></div>
                    <span className="font-mono font-bold text-white text-xs tracking-wider">CONFIDENCE: {postureScore}</span>
                </div>

                {!modelReady && (
                    <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 z-30 flex items-center gap-2 rounded-full border border-white/5">
                        <div className="w-3 h-3 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-[#ccff00] font-bold">AI INIT</span>
                    </div>
                )}

                {cameraStatus !== "Active" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-[#ccff00] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                            <p className="text-[#ccff00] font-bold text-sm tracking-wider uppercase">{cameraStatus}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Interaction Panel */}
            <div className="flex flex-col h-[500px] gap-6">
                <div className="apple-card p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00] rounded-full blur-[120px] opacity-5 -mr-20 -mt-20 pointer-events-none"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        {questions[currentQuestionIndex]}
                    </h2>
                </div>

                <div className="flex-1 apple-card p-6 overflow-y-auto border border-white/5 bg-black/20">
                    <div className="flex items-center gap-3 mb-4">
                        {isListening ? (
                            <div className="animate-pulse flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full w-fit">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs uppercase font-bold tracking-wider">Listening</span>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full w-fit">
                                <Mic className="w-3 h-3" /> Mic Off
                            </span>
                        )}
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed font-medium">
                        "{transcript || <span className="text-gray-600">Start speaking to see your answer here...</span>}"
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => speakText(questions[currentQuestionIndex])}
                        className="btn-glass flex items-center justify-center gap-2 py-4">
                        <RefreshCw className="w-4 h-4" /> Repeat
                    </button>
                    <button onClick={handleNextQuestion}
                        className="btn-lime flex items-center justify-center gap-2 py-4">
                        Next Question <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <button onClick={() => setIsSessionActive(false)} className="mt-2 text-gray-500 text-xs font-bold uppercase tracking-wider hover:text-red-400 transition-colors flex items-center justify-center gap-2">
                    <X className="w-3 h-3" /> End Session
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 pb-32">

            {/* Background Accent */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ccff00] rounded-full blur-[200px] opacity-[0.03] pointer-events-none z-0"></div>

            {isLoading ? (
                <div className="flex flex-col items-center relative z-10">
                    <div className="w-16 h-16 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin mb-6"></div>
                    <p className="text-[#ccff00] text-sm font-bold uppercase tracking-widest animate-pulse">{loadingMessage}</p>
                </div>
            ) : (
                <>
                    <AnimatePresence mode='wait'>
                        {!isSessionActive && !sessionStats && (
                            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {renderLandingPage()}
                            </motion.div>
                        )}
                        {isSessionActive && (
                            <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                                {renderSessionView()}
                            </motion.div>
                        )}
                        {sessionStats && (
                            <motion.div key="stats" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="apple-card p-10 max-w-2xl text-center border-t border-[#ccff00]/20 relative z-10">
                                <h2 className="text-4xl font-bold mb-8 text-white">Session Complete <span className="text-[#ccff00]">.</span></h2>
                                <div className="flex justify-center gap-12 mb-12">
                                    <div className="text-center">
                                        <div className="text-6xl font-black text-[#ccff00] mb-2">{sessionStats.focus_score}%</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Visual Focus</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-6xl font-black text-white mb-2">{sessionStats.posture_score}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Confidence</div>
                                    </div>
                                </div>
                                <div className="bg-[#1c1c1e] p-8 rounded-3xl mb-10 text-left border border-white/5">
                                    <span className="text-xs font-bold text-[#ccff00] uppercase tracking-widest mb-2 block">AI Feedback</span>
                                    <p className="text-gray-300 leading-relaxed text-lg">"{sessionStats.feedback}"</p>
                                </div>

                                {pdfUrl && (
                                    <a href={pdfUrl} download={`Interview_Report_${new Date().toISOString().slice(0, 10)}.pdf`} className="btn-glass w-full py-4 text-lg mb-4 flex items-center justify-center gap-2">
                                        <Upload className="w-5 h-5 rotate-180" /> Download Report Again
                                    </a>
                                )}

                                <button onClick={() => { setSessionStats(null); setPostureScore(100); setGoodPostureCount(0); setTotalFrames(0); setPdfUrl(null); }}
                                    className="btn-lime w-full py-4 text-lg">
                                    Start New Session
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div >
    );
};

export default InterviewCoach;
