
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Code as CodeIcon, Filter, ExternalLink, Linkedin, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const JobInsights = () => {
    // const { user } = useAuth(); // Auth decoupled for demo

    // --- Job Search State ---
    const [jobs, setJobs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loadingJobs, setLoadingJobs] = useState(false);

    // Filters
    const [role, setRole] = useState('backend');
    const [location, setLocation] = useState('');
    const [techStack, setTechStack] = useState('');
    const [sortBy, setSortBy] = useState('relevance');

    // --- Market Analysis State ---
    const [marketQuery, setMarketQuery] = useState('');
    const [marketAnalysis, setMarketAnalysis] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    // --- Job Search Logic ---
    const fetchInsights = async () => {
        setLoadingJobs(true);
        try {
            const techList = techStack.split(',').map(t => t.trim()).filter(t => t);
            const res = await fetch('http://localhost:8000/api/insights/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Authorization': `Token ${token}` // Removed for open access
                },
                body: JSON.stringify({
                    priority: { role, location, tech_stack: techList },
                    sort_by: sortBy
                })
            });
            const data = await res.json();
            setJobs(data.recommended_jobs || []);
            setSummary(data.insights_summary);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoadingJobs(false);
        }
    };

    // --- Market Analysis Logic ---
    const fetchMarketAnalysis = async (query) => {
        if (!query.trim()) return;
        setLoadingAnalysis(true);
        setAnalysisError(null);
        setMarketAnalysis(null);
        const cacheKey = `market_insight_${query.toLowerCase().trim()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setMarketAnalysis(JSON.parse(cached));
            setLoadingAnalysis(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:8000/api/insights/market/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Authorization': `Token ${token}` // Removed for open access
                },
                body: JSON.stringify({ query: query })
            });

            if (!res.ok) throw new Error("Failed to fetch analysis");
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setMarketAnalysis(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error(error);
            setAnalysisError("Could not fetch insights. Please try again.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleLinkedinSearch = (query) => {
        window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}`, '_blank');
    };

    // Initial Job Fetch
    useEffect(() => {
        fetchInsights();
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-screen pt-4">

            {/* Sidebar Filters (Glass Panel) */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-1/4 h-fit apple-card p-6 lg:sticky lg:top-8"
            >
                <div className="flex items-center space-x-2 mb-6 text-lime-700 dark:text-[#ccff00]">
                    <Filter className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-[#1c1c1e] text-white w-full rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 appearance-none"
                        >
                            <option value="backend">Backend Developer</option>
                            <option value="frontend">Frontend Developer</option>
                            <option value="full stack">Full Stack</option>
                            <option value="data">Data Scientist</option>
                            <option value="devops">DevOps</option>
                            <option value="software">General Software</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tech Stack</label>
                        <div className="relative">
                            <CodeIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={techStack}
                                onChange={(e) => setTechStack(e.target.value)}
                                placeholder="python, react, aws"
                                className="bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white pl-10 w-full rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10 outline-none focus:border-lime-500/50 dark:focus:border-[#ccff00]/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Remote"
                                className="bg-[#1c1c1e] text-white pl-10 w-full rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-white/10 mb-4">
                            <button
                                onClick={() => setSortBy('relevance')}
                                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${sortBy === 'relevance' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                Relevance
                            </button>
                            <button
                                onClick={() => setSortBy('recent')}
                                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${sortBy === 'recent' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                Recent
                            </button>
                        </div>

                        <button
                            onClick={fetchInsights}
                            className="btn-lime w-full flex justify-center items-center gap-2"
                        >
                            Update Feed
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Main Feed */}
            <div className="flex-1 space-y-8 pb-10">

                {/* Market Analysis Card (Hero) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="apple-card p-8 md:p-10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                            <Sparkles className="w-5 h-5 text-lime-700 dark:text-[#ccff00]" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Market Intelligence</h1>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={marketQuery}
                                    onChange={(e) => setMarketQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchMarketAnalysis(marketQuery)}
                                    placeholder="Analyze a role (e.g. 'Senior React Dev')"
                                    className="bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white pl-12 w-full rounded-2xl px-4 py-3 border border-gray-200 dark:border-white/10 outline-none focus:border-lime-500/50 dark:focus:border-[#ccff00]/50 ml-0 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
                                />
                            </div>
                            <button
                                onClick={() => fetchMarketAnalysis(marketQuery)}
                                disabled={loadingAnalysis}
                                className="btn-glass px-8 py-3 rounded-2xl font-bold"
                            >
                                {loadingAnalysis ? 'Analyzing...' : 'Insight'}
                            </button>
                        </div>

                        {analysisError && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl mb-4 border border-red-500/20">{analysisError}</div>}

                        {marketAnalysis && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <h2 className="text-3xl font-bold">{marketQuery}</h2>
                                    <button onClick={() => handleLinkedinSearch(marketQuery)} className="text-xs text-blue-400 hover:underline flex items-center">
                                        View on LinkedIn <ExternalLink className="w-3 h-3 ml-1" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-white/5">
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Salary Range</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <DollarSign className="w-5 h-5 mr-1 text-green-600 dark:text-green-400" /> {marketAnalysis.avg_salary}
                                        </div>
                                    </div>
                                    <div className="bg-[#1c1c1e] p-5 rounded-2xl border border-white/5">
                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Demand</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <TrendingUp className="w-5 h-5 mr-1 text-orange-600 dark:text-orange-400" /> {marketAnalysis.hiring_trends}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-lime-50 dark:bg-[#ccff00]/5 p-6 rounded-2xl border border-lime-200 dark:border-[#ccff00]/10">
                                    <h3 className="text-lime-800 dark:text-[#ccff00] text-xs font-bold uppercase tracking-wider mb-2">Summary</h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{marketAnalysis.role_summary}</p>
                                </div>

                                <div>
                                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Top Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {marketAnalysis.top_skills.map((skill, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Job List */}
                <div>
                    <div className="flex justify-between items-end mb-4 px-2">
                        <h2 className="text-2xl font-bold">Latest Opportunities</h2>
                        {summary && <span className="text-sm text-[#ccff00] font-bold">{summary.software_jobs_found} Matches</span>}
                    </div>

                    {loadingJobs ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#1c1c1e] rounded-3xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {jobs.map((job, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group apple-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-[#2c2c2e]"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-[#ccff00] transition-colors">{job.job_title}</h3>
                                        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-2">{job.company}</p>

                                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {job.location}</span>
                                            <span className="w-1 h-1 bg-gray-600 rounded-full self-center" />
                                            <span>{job.job_type.replace('_', ' ')}</span>
                                            <span className="w-1 h-1 bg-gray-600 rounded-full self-center" />
                                            <span>{new Date(job.published_on).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {job.priority_score > 0.8 && (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-md border border-green-500/20">
                                                {(job.priority_score * 100).toFixed(0)}% Match
                                            </span>
                                        )}
                                        <a
                                            href={job.apply_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all font-bold text-sm bg-white/5"
                                        >
                                            Apply
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default JobInsights;

