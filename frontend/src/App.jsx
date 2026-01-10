import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CareerGuide from './pages/CareerGuide';
import JobInsights from './pages/JobInsights';
import CodeHelper from './pages/CodeHelper';
import ResumeBuilder from './pages/ResumeBuilder';
import InterviewCoach from './pages/InterviewCoach'; // Fixed Import
import FloatingNav from './components/FloatingNav'; // Import New Nav

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--lime-selection-bg)] selection:text-[var(--lime-selection)] transition-colors duration-300">
            {/* Floating Dock Navigation */}
            <FloatingNav />

            {/* Main Content Area - Full Width */}
            <div className="pb-32 px-4 md:px-8 max-w-7xl mx-auto pt-8">
              <Routes>
                {/* Public Routes */}

                <Route path="/" element={<Home />} />

                {/* Protected Routes */}
                {/* Protected Routes */}
                <Route path="/career-guide" element={<CareerGuide />} />
                <Route path="/job-insights" element={<JobInsights />} />
                <Route path="/code-helper" element={<CodeHelper />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                <Route path="/interview-coach" element={<InterviewCoach />} />
              </Routes>
            </div>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
