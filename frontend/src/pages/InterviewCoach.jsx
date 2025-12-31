import React, { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Upload, Code, Users, Brain, ChevronRight, Video, Mic } from 'lucide-react';

const InterviewCoach = () => {
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
                        ctx.strokeStyle = '#00FF00'; // Green
                    } else {
                        setPostureScore(prev => Math.max(0, prev - 1));
                        ctx.strokeStyle = '#FF0000'; // Red
                    }
                    setTotalFrames(prev => prev + 1);

                    // Draw Face Box (Approximation)
                    ctx.lineWidth = 4;
                    ctx.strokeRect(canvas.width * 0.25, canvas.height * 0.15, canvas.width * 0.5, canvas.height * 0.7);

                    // Draw Nose Dot
                    ctx.fillStyle = isCentered ? '#00FF00' : '#FF0000';
                    ctx.beginPath();
                    ctx.arc(noseTip.x * canvas.width, noseTip.y * canvas.height, 5, 0, 2 * Math.PI);
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
            const res = await fetch('http://127.0.0.1:8000/api/interview-coach/start/', {
                method: 'POST', body: body
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Backend Error");
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
            const response = await fetch('http://127.0.0.1:8000/api/interview-coach/end-session/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: finalHistory,
                    stats: basicStats
                })
            });

            if (response.ok) {
                // Trigger PDF Download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
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
                throw new Error("Failed to generate report");
            }
        } catch (error) {
            console.error(error);
            setSessionStats({
                ...basicStats,
                feedback: "Session complete, but we couldn't generate the PDF report. (Backend offline or error)"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI COMPONENTS ---

    const renderLandingPage = () => (
        <div className="w-full max-w-5xl space-y-8 animate-fade-in-up">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-8">
                AI Interview Coach <span className="text-white text-2xl ml-2">🎥</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume Card */}
                <div onClick={() => document.getElementById('res-upload').click()}
                    className="glass-card-hover p-10 cursor-pointer flex flex-col items-center text-center group">
                    <div className="bg-blue-500/20 p-4 rounded-full mb-6 group-hover:scale-110 transition border border-blue-500/30">
                        <Upload className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Upload Resume</h2>
                    <p className="text-gray-400 mb-6">Generate tailored questions based on your actual CV profile.</p>
                    <div className="btn-ghost text-sm py-2">Select PDF</div>
                    <input id="res-upload" type="file" accept=".pdf" className="hidden" onChange={(e) => startResumeSession(e.target.files[0])} />
                </div>

                {/* Role Cards */}
                <div className="space-y-4">
                    <div onClick={() => startRoleSession("Software Engineer")} className="glass-card-hover p-6 cursor-pointer flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/20">
                            <Code className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Software Engineer</h3>
                            <p className="text-xs text-gray-500">System Design & Coding</p>
                        </div>
                        <ChevronRight className="ml-auto text-gray-600" />
                    </div>
                    <div onClick={() => startRoleSession("Product Manager")} className="glass-card-hover p-6 cursor-pointer flex items-center gap-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/20">
                            <Users className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Product Manager</h3>
                            <p className="text-xs text-gray-500">Strategy & Execution</p>
                        </div>
                        <ChevronRight className="ml-auto text-gray-600" />
                    </div>
                </div>
            </div>

            {loadingModel && (
                <div className="glass-card flex items-center justify-center gap-3 py-3 px-6 mx-auto w-fit text-blue-300 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Initializing Vision Models... please wait.
                </div>
            )}
        </div>
    );

    const renderSessionView = () => (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in p-4">
            {/* Camera Feed */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-black h-[500px]">
                {/* DEBUG: Added controls and removed transform */}
                <video
                    ref={videoRef}
                    className="absolute w-full h-full object-contain z-10"
                    autoPlay
                    playsInline
                    muted
                    controls
                // controlsList="nodownload nofullscreen noremoteplayback"
                ></video>

                {/* Hiding Canvas for Debugging to ensure Video is visible */}
                <canvas ref={canvasRef} className="absolute w-full h-full object-cover z-20 pointer-events-none opacity-50"></canvas>

                <div className="absolute top-4 left-4 glass-card px-4 py-2 flex items-center gap-2 z-30">
                    <div className={`w-3 h-3 rounded-full ${postureScore > 80 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-mono font-bold text-white">Confidence: {postureScore}</span>
                </div>

                {/* Non-blocking AI Loader */}
                {!modelReady && (
                    <div className="absolute top-4 right-4 glass-card px-3 py-1 z-30 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-blue-200">AI Loading...</span>
                    </div>
                )}

                {/* Status Overlay */}
                {cameraStatus !== "Active" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                            <p className="text-blue-300 font-bold">{cameraStatus}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Interaction Panel */}
            <div className="flex flex-col h-[500px] gap-4">
                <div className="glass-card p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        {questions[currentQuestionIndex]}
                    </h2>
                </div>

                <div className="flex-1 glass-card p-4 overflow-y-auto mb-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        {isListening ? (
                            <div className="animate-pulse flex items-center gap-2 text-red-400">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs uppercase font-bold">Listening...</span>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-500 uppercase font-bold">Mic Off</span>
                        )}
                    </div>
                    <p className="text-gray-300 text-lg italic">
                        "{transcript || "Start speaking..."}"
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => speakText(questions[currentQuestionIndex])}
                        className="btn-ghost flex items-center justify-center gap-2">
                        <Mic className="w-5 h-5" /> Repeat
                    </button>
                    <button onClick={handleNextQuestion}
                        className="btn-primary flex items-center justify-center gap-2">
                        Next / Finish <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <button onClick={() => setIsSessionActive(false)} className="mt-2 text-red-400 text-sm hover:underline text-center w-full">
                    End Session
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center p-4">
            {isLoading ? (
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-blue-200 text-lg font-medium">{loadingMessage}</p>
                </div>
            ) : (
                <>
                    {!isSessionActive && !sessionStats && renderLandingPage()}
                    {isSessionActive && renderSessionView()}
                    {sessionStats && (
                        <div className="glass-card p-10 max-w-2xl text-center border-t border-green-500/30">
                            <h2 className="text-4xl font-bold mb-8 text-white">Session Complete! 🎉</h2>
                            <div className="flex justify-center gap-12 mb-10">
                                <div className="text-center">
                                    <div className="text-5xl font-black text-green-400 mb-2">{sessionStats.focus_score}%</div>
                                    <div className="text-sm text-gray-400 uppercase tracking-wider">Visual Focus</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-black text-blue-400 mb-2">{sessionStats.posture_score}</div>
                                    <div className="text-sm text-gray-400 uppercase tracking-wider">Confidence</div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-xl mb-8 text-left">
                                <span className="text-xs font-bold text-gray-500 uppercase">AI Feedback</span>
                                <p className="text-gray-300 italic mt-2 text-lg">"{sessionStats.feedback}"</p>
                            </div>
                            <button onClick={() => { setSessionStats(null); setPostureScore(100); setGoodPostureCount(0); setTotalFrames(0); }}
                                className="btn-primary w-full">
                                Start New Session
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InterviewCoach;
