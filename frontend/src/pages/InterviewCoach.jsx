
import React, { useState, useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Code, Users, Brain, FileText, ChevronRight, Video, Mic } from 'lucide-react';

const InterviewCoach = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Performance Metrics
    const [postureScore, setPostureScore] = useState(100);
    const [goodPostureCount, setGoodPostureCount] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);
    const [sessionStats, setSessionStats] = useState(null); // Result after session

    // Resume & Questions
    const [resumeFile, setResumeFile] = useState(null);
    const [jobRole, setJobRole] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");

    // Camera setup
    useEffect(() => {
        if (!isSessionActive) return;

        const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);

        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current });
                },
                width: 640,
                height: 480
            });
            camera.start();
        }
    }, [isSessionActive]);

    const onResults = (results) => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.save();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            // Simple Logic: Detect if face is centered
            const landmarks = results.multiFaceLandmarks[0];
            const noseTip = landmarks[1]; // Index 1 is nose tip

            // Check if nose is roughly in center X (0.4-0.6) and Y (0.3-0.7)
            const isCentered = noseTip.x > 0.4 && noseTip.x < 0.6 && noseTip.y > 0.3 && noseTip.y < 0.7;

            if (isCentered) {
                setGoodPostureCount(prev => prev + 1);
                setPostureScore(100); // Good
                // Draw green box
                ctx.strokeStyle = '#00FF00';
            } else {
                setPostureScore(prev => Math.max(0, prev - 1)); // Decay score
                // Draw red box
                ctx.strokeStyle = '#FF0000';
            }
            setTotalFrames(prev => prev + 1);

            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.rect(100, 50, 440, 380); // Guideline box
            ctx.stroke();
        }
        ctx.restore();
    };

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

        await fetchQuestions(JSON.stringify({ job_role: role }), 'application/json');
    };

    const fetchQuestions = async (body, contentType = null) => {
        try {
            const options = { method: 'POST', body: body };
            if (contentType) options.headers = { 'Content-Type': contentType };

            const res = await fetch('http://localhost:8000/api/interview-coach/start/', options);
            const data = await res.json();

            if (data.questions && Array.isArray(data.questions)) {
                setQuestions(data.questions);
                setIsSessionActive(true);
                setCurrentQuestionIndex(0);
                speakText(data.questions[0]);
            } else {
                setQuestions(["Tell me about yourself.", "Why are you interested in this role?"]);
                setIsSessionActive(true);
                speakText("Tell me about yourself.");
            }
        } catch (err) {
            console.error(err);
            alert("Connection Error");
        } finally {
            setIsLoading(false);
        }
    };

    // TTS Helper
    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.name.includes('Google US English')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIdx = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIdx);
            speakText(questions[nextIdx]);
        } else {
            handleEndSession();
        }
    };

    const handleEndSession = async () => {
        setIsSessionActive(false);
        // Calculate average score
        const avgScore = Math.round(postureScore); // Simplified currently

        try {
            const res = await fetch('http://localhost:8000/api/interview-coach/analyze/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    averageScore: avgScore,
                    goodPostureCount: goodPostureCount,
                    frames: totalFrames
                })
            });
            const data = await res.json();
            setSessionStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    // --- RENDER COMPONENTS ---

    const LandingPage = () => (
        <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="bg-blue-600 rounded-2xl p-8 flex items-center justify-between shadow-xl">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Master Your Confidence</h1>
                    <p className="text-blue-100">Real-time analysis of your speech, eye contact, and questions.</p>
                </div>
                <Video className="w-16 h-16 text-white/30" />
            </div>

            {/* Resume Upload Card */}
            <div className="bg-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                onClick={() => document.getElementById('resume-upload').click()}
            >
                <div className="flex items-center space-x-6">
                    <div className="bg-white/20 p-4 rounded-full">
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">Upload Resume</h2>
                        <p className="text-indigo-200 text-sm">Generate custom questions from your PDF profile.</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/50 group-hover:translate-x-1 transition-transform" />
                </div>
                <input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => startResumeSession(e.target.files[0])}
                />
            </div>

            {/* Topic Selection */}
            <div>
                <h3 className="text-xl font-bold text-gray-300 mb-4">Select Interview Type</h3>
                <div className="space-y-4">
                    <TopicCard
                        title="Software Engineer"
                        subtitle="Data Structures & System Design"
                        icon={<Code className="w-6 h-6 text-blue-400" />}
                        color="bg-blue-500/10"
                        difficulty="Hard"
                        onClick={() => startRoleSession("Software Engineer")}
                    />
                    <TopicCard
                        title="Product Manager"
                        subtitle="Strategy & Leadership Scenarios"
                        icon={<Users className="w-6 h-6 text-orange-400" />}
                        color="bg-orange-500/10"
                        difficulty="Medium"
                        onClick={() => startRoleSession("Product Manager")}
                    />
                    <TopicCard
                        title="Data Scientist"
                        subtitle="ML Models & Python"
                        icon={<Brain className="w-6 h-6 text-purple-400" />}
                        color="bg-purple-500/10"
                        difficulty="Hard"
                        onClick={() => startRoleSession("Data Scientist")}
                    />
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Mic className="w-5 h-5" />
                    <span className="font-bold">How it works</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                    1. Permissions: Camera & Mic.<br />
                    2. AI asks a question (Voice).<br />
                    3. You answer while looking at the camera.<br />
                    4. Get feedback on content & confidence.
                </p>
            </div>
        </div>
    );

    const TopicCard = ({ title, subtitle, icon, color, difficulty, onClick }) => (
        <div onClick={onClick} className="bg-gray-800 p-5 rounded-xl flex items-center cursor-pointer hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-all">
            <div className={`p-3 rounded-full ${color} mr-4`}>
                {icon}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-white">{title}</h4>
                <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
            <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 mr-4">{difficulty}</span>
            <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
    );

    const SessionView = () => (
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 h-[400px]">
                <video ref={videoRef} className="absolute w-full h-full object-cover" autoPlay muted playsInline></video>
                <canvas ref={canvasRef} className="absolute w-full h-full object-cover" width="640" height="480"></canvas>
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-green-400 font-mono border border-green-500/30">
                    Posture Score: {postureScore}
                </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl flex flex-col justify-between h-[400px] border border-gray-700">
                <div>
                    <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <h2 className="text-2xl font-bold mt-4 mb-8 leading-snug">"{questions[currentQuestionIndex]}"</h2>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => speakText(questions[currentQuestionIndex])}
                        className="flex items-center justify-center w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                    >
                        <Mic className="w-5 h-5 mr-2" /> Repeat Question
                    </button>

                    <button
                        onClick={handleNextQuestion}
                        className="w-full py-4 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 text-white"
                    >
                        {currentQuestionIndex < questions.length - 1 ? "Next Question ➡️" : "Finish Interview 🏁"}
                    </button>

                    <button
                        onClick={() => { setIsSessionActive(false); setSessionStats(null); }}
                        className="w-full py-2 text-red-400 text-sm hover:text-red-300"
                    >
                        Cancel Session
                    </button>
                </div>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
            {/* Simple Top Bar */}
            {!isSessionActive && !sessionStats && (
                <div className="w-full max-w-4xl flex items-center mb-8">
                    <Brain className="w-8 h-8 text-blue-500 mr-3" />
                    <span className="text-xl font-bold">AI Interview Companion</span>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] animate-pulse">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-xl font-medium text-gray-300">{loadingMessage}</p>
                </div>
            ) : (
                <>
                    {!isSessionActive && !sessionStats && <LandingPage />}
                    {isSessionActive && <SessionView />}
                    {sessionStats && (
                        <div className="w-full max-w-4xl bg-gray-800 p-8 rounded-xl animate-fade-in-up border border-gray-700">
                            <h2 className="text-3xl font-bold mb-6 text-center">Performance Summary</h2>
                            {/* Note: Same stats UI as before, omitted for brevity but included in full code below */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="bg-gray-700 p-6 rounded-lg text-center">
                                    <p className="text-gray-400">Visual Focus Score</p>
                                    <p className="text-5xl font-extrabold text-blue-400">{sessionStats.focus_score}%</p>
                                </div>
                                <div className="bg-gray-700 p-6 rounded-lg text-center">
                                    <p className="text-gray-400">Stability Score</p>
                                    <p className="text-5xl font-extrabold text-green-400">{sessionStats.posture_score}</p>
                                </div>
                            </div>
                            <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-500/20 mb-8">
                                <h3 className="text-xl font-bold mb-2 text-blue-300">AI Feedback:</h3>
                                <p className="text-gray-300 italic">"{sessionStats.feedback}"</p>
                            </div>
                            <button
                                onClick={() => { setSessionStats(null); setIsSessionActive(false); }}
                                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
                            >
                                Back to Home 🔄
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default InterviewCoach;
