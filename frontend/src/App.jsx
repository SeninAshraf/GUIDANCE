import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CareerGuide from './pages/CareerGuide';
import JobInsights from './pages/JobInsights';
import CodeHelper from './pages/CodeHelper';
import ResumeBuilder from './pages/ResumeBuilder';
import InterviewCoach from './pages/InterviewCoach'; // Fixed Import
import PersonalWallet from './pages/PersonalWallet';
import FloatingNav from './components/FloatingNav';
import Navbar from './components/Navbar'; 
import LoadingScreen from './components/LoadingScreen';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  const [loading, setLoading] = React.useState(true);

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AnimatePresence>
            {loading && <LoadingScreen onLoadingComplete={() => setLoading(false)} />}
          </AnimatePresence>

          <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--lime-selection-bg)] selection:text-[var(--lime-selection)] transition-colors duration-300">
            {/* Main Navigation */}
            <Navbar />
            
            {/* Floating Dock Navigation */}
            <FloatingNav />

            {/* Main Content Area - Full Width */}
            <div className="pb-32 px-4 md:px-8 max-w-7xl mx-auto pt-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route path="/career-guide" element={<ProtectedRoute><CareerGuide /></ProtectedRoute>} />
                <Route path="/job-insights" element={<ProtectedRoute><JobInsights /></ProtectedRoute>} />
                <Route path="/code-helper" element={<ProtectedRoute><CodeHelper /></ProtectedRoute>} />
                <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
                <Route path="/interview-coach" element={<ProtectedRoute><InterviewCoach /></ProtectedRoute>} />
                <Route path="/personal-wallet" element={<ProtectedRoute><PersonalWallet /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
