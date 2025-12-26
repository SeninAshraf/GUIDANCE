
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Code as CodeIcon, Filter, ExternalLink, Linkedin, Sparkles, TrendingUp, DollarSign } from 'lucide-react';

const JobInsights = () => {
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
                headers: { 'Content-Type': 'application/json' },
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

        // 1. Check Local Storage Cache
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });

            if (!res.ok) throw new Error("Failed to fetch analysis");

            const data = await res.json();

            // Allow user to try again if data is empty or bad
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
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white pt-6">

            {/* Sidebar Filters (Jobs) */}
            <div className="w-full md:w-1/4 p-6 border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm h-fit md:h-[calc(100vh-64px)] md:sticky md:top-16 overflow-y-auto">
                <div className="flex items-center space-x-2 mb-6 text-blue-400">
                    <Filter className="w-5 h-5" />
                    <h2 className="text-xl font-bold">Job Filters</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Role Type</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-400 mb-2">Tech Stack</label>
                        <div className="relative">
                            <CodeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={techStack}
                                onChange={(e) => setTechStack(e.target.value)}
                                placeholder="python, react, aws"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Anywhere"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setSortBy('relevance')}
                                className={`flex-1 py-2 text-sm rounded-md transition ${sortBy === 'relevance' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Relevance
                            </button>
                            <button
                                onClick={() => setSortBy('recent')}
                                className={`flex-1 py-2 text-sm rounded-md transition ${sortBy === 'recent' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Recent
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={fetchInsights}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] transition"
                    >
                        Find Jobs 🚀
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 md:p-10 bg-gray-900 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* --- NEW SECTION: MARKET ANALYSIS (Top) --- */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
                        {/* Background Accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-10"></div>

                        <div className="relative z-10">
                            <div className="flex items-center space-x-3 mb-6">
                                <Sparkles className="w-6 h-6 text-yellow-400" />
                                <h1 className="text-2xl font-bold text-white">AI Market Researcher</h1>
                            </div>

                            <p className="text-gray-400 mb-6 max-w-2xl">
                                Get instant, data-driven insights on any role. Discover salary ranges, demand trends, and top skills.
                            </p>

                            <div className="flex space-x-2 mb-8">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={marketQuery}
                                        onChange={(e) => setMarketQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchMarketAnalysis(marketQuery)}
                                        placeholder="Research a role (e.g., 'Flutter Developer', 'Product Manager')"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                </div>
                                <button
                                    onClick={() => fetchMarketAnalysis(marketQuery)}
                                    disabled={loadingAnalysis}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center disabled:opacity-50"
                                >
                                    {loadingAnalysis ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Analyze'}
                                </button>
                            </div>

                            {analysisError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6">
                                    {analysisError}
                                </div>
                            )}

                            {marketAnalysis && (
                                <div className="animate-fade-in-up">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-gray-700">
                                        <h2 className="text-3xl font-bold text-white mb-4 md:mb-0">{marketQuery || "Result"}</h2>
                                        <button
                                            onClick={() => handleLinkedinSearch(marketQuery)}
                                            className="px-4 py-2 bg-[#0077b5] hover:bg-[#006396] text-white rounded-lg font-bold flex items-center transition"
                                        >
                                            <Linkedin className="w-4 h-4 mr-2" />
                                            View on LinkedIn
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                                            <div className="flex items-center text-green-400 mb-2">
                                                <DollarSign className="w-5 h-5 mr-2" />
                                                <span className="font-bold">Avg. Salary</span>
                                            </div>
                                            <p className="text-xl font-bold text-white">{marketAnalysis.avg_salary}</p>
                                        </div>
                                        <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
                                            <div className="flex items-center text-orange-400 mb-2">
                                                <TrendingUp className="w-5 h-5 mr-2" />
                                                <span className="font-bold">Demand Trend</span>
                                            </div>
                                            <p className="text-xl font-bold text-white">{marketAnalysis.hiring_trends}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">AI Role Summary</h3>
                                        <p className="text-gray-300 leading-relaxed">{marketAnalysis.role_summary}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Top Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {marketAnalysis.top_skills.map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm border border-gray-600">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!marketAnalysis && !loadingAnalysis && !analysisError && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Try searching for "Flutter Developer" or "Data Scientist" to see AI insights.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- EXISTING SECTION: JOB LISTINGS --- */}
                    <div>
                        <div className="mb-6 flex items-end justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Active Job Listings</h1>
                                {summary && (
                                    <p className="text-gray-400">
                                        Found <span className="text-green-400 font-bold">{summary.software_jobs_found}</span> jobs matching your filters.
                                    </p>
                                )}
                            </div>
                        </div>

                        {loadingJobs ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-40 bg-gray-800 rounded-xl"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {jobs.map((job, idx) => (
                                    <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg transition group relative overflow-hidden">
                                        {/* Relevance Badge */}
                                        {job.priority_score > 0.8 && (
                                            <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-bl-lg border-l border-b border-green-500/20">
                                                {(job.priority_score * 100).toFixed(0)}% Match
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{job.job_title}</h3>
                                                <p className="text-gray-400 font-medium">{job.company}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-300">
                                            <div className="flex items-center px-3 py-1 bg-gray-700 rounded-full">
                                                <MapPin className="w-3 h-3 mr-2 text-blue-400" />
                                                {job.location}
                                            </div>
                                            <div className="flex items-center px-3 py-1 bg-gray-700 rounded-full">
                                                <Briefcase className="w-3 h-3 mr-2 text-purple-400" />
                                                {job.job_type.replace('_', ' ')}
                                            </div>
                                            <div className="flex items-center px-3 py-1 bg-gray-700 rounded-full">
                                                <span className="text-gray-400 mr-2">📅</span>
                                                {new Date(job.published_on).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">Source: Remotive</span>
                                            <a
                                                href={job.apply_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                                            >
                                                Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                                {jobs.length === 0 && (
                                    <div className="text-center py-20 bg-gray-800 rounded-xl">
                                        <p className="text-gray-400 text-lg">No jobs found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobInsights;
