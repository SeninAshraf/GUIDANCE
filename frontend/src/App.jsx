import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CareerGuide from './pages/CareerGuide';
import ResumeBuilder from './pages/ResumeBuilder';
import InterviewCoach from './pages/InterviewCoach';
import JobInsights from './pages/JobInsights';
import Feedback from './pages/Feedback';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/career-guide" element={<CareerGuide />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/interview" element={<InterviewCoach />} />
            <Route path="/insights" element={<JobInsights />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
