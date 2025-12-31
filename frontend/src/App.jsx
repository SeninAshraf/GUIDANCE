import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CareerGuide from './pages/CareerGuide';
import ResumeBuilder from './pages/ResumeBuilder';
import InterviewCoach from './pages/InterviewCoach';
import JobInsights from './pages/JobInsights';
import Feedback from './pages/Feedback';
import CodeHelper from './pages/CodeHelper';
import Navbar from './components/Navbar';
import TestCamera from './pages/TestCamera';
import { AuthProvider } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="premium-bg text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/career-guide"
              element={
                <CareerGuide />
              }
            />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route
              path="/interview"
              element={
                <ProtectedRoute>
                  <InterviewCoach />
                </ProtectedRoute>
              }
            />
            <Route path="/insights" element={<JobInsights />} />
            <Route path="/code-helper" element={<CodeHelper />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/test-cam" element={<TestCamera />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
