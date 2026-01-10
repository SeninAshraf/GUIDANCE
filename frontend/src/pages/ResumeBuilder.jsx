
import React, { useState } from 'react';
import { FileText, User, Briefcase, GraduationCap, Zap, Download, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ResumeBuilder = () => {
    const { user } = useAuth();
    const token = user?.token;

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        summary: '',
        skills: '',
        experience: [{ title: '', company: '', duration: '', description: '' }],
        education: [{ degree: '', school: '', year: '' }],
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // -- Handlers --

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Generic handler for dynamic arrays (experience, education)
    const handleArrayChange = (index, field, value, arrayName) => {
        const updatedArray = [...formData[arrayName]];
        updatedArray[index][field] = value;
        setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
    };

    const addItem = (arrayName, emptyItem) => {
        setFormData((prev) => ({ ...prev, [arrayName]: [...prev[arrayName], emptyItem] }));
    };

    const removeItem = (index, arrayName) => {
        const updatedArray = [...formData[arrayName]];
        updatedArray.splice(index, 1);
        setFormData((prev) => ({ ...prev, [arrayName]: updatedArray }));
    };

    const generateResume = async () => {
        setIsGenerating(true);
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch('http://localhost:8000/api/resume-builder/generate/', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to generate resume');

            // Handle PDF download
            const blobData = await response.blob();
            const pdfBlob = new Blob([blobData], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${formData.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error generating resume:", error);
            alert("Failed to generate resume. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const InputField = ({ label, ...props }) => (
        <div className="w-full">
            {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>}
            <input
                {...props}
                className="w-full bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10 outline-none focus:border-lime-500/50 dark:focus:border-[#ccff00]/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-[#2c2c2e]"
            />
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-10 flex flex-col items-center w-full pb-32">

            {/* Header */}
            <div className="text-center mb-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-xs font-bold uppercase tracking-widest mb-4"
                >
                    <FileText className="w-3 h-3" /> CV Architect
                </motion.div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Build Your Legacy.</h1>
                <p className="text-gray-600 dark:text-gray-400">Create an ATS-optimized resume in minutes.</p>
            </div>

            <div className="max-w-4xl w-full apple-card p-8 md:p-12">

                {/* Personal Info */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-full bg-lime-400/20 dark:bg-[#ccff00]/10 flex items-center justify-center text-lime-700 dark:text-[#ccff00]">
                            <User className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField name="fullName" placeholder="Elon Musk" label="Full Name" value={formData.fullName} onChange={handleInputChange} />
                        <InputField name="email" placeholder="elon@tesla.com" label="Email Address" value={formData.email} onChange={handleInputChange} />
                        <InputField name="phone" placeholder="+1 555 0199" label="Phone Number" value={formData.phone} onChange={handleInputChange} />
                        <InputField name="linkedin" placeholder="linkedin.com/in/elon" label="LinkedIn URL" value={formData.linkedin} onChange={handleInputChange} />
                    </div>
                </section>

                {/* Summary */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Professional Summary</h2>
                    </div>
                    <textarea
                        name="summary"
                        placeholder="Visionary entrepreneur with a passion for Mars colonization..."
                        rows="4"
                        value={formData.summary}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-[#1c1c1e] text-gray-900 dark:text-white rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10 outline-none focus:border-lime-500/50 dark:focus:border-[#ccff00]/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none focus:bg-white dark:focus:bg-[#2c2c2e]"
                    ></textarea>
                </section>

                {/* Experience */}
                <section className="mb-12">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Experience</h2>
                        </div>
                        <button
                            onClick={() => addItem('experience', { title: '', company: '', duration: '', description: '' })}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Role
                        </button>
                    </div>

                    <div className="space-y-6">
                        {formData.experience.map((exp, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={index}
                                className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/5 relative group hover:border-white/10 transition-colors"
                            >
                                <button onClick={() => removeItem(index, 'experience')} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition bg-black/20 p-2 rounded-full opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <InputField placeholder="CEO & Technoking" label="Job Title" value={exp.title} onChange={(e) => handleArrayChange(index, 'title', e.target.value, 'experience')} />
                                    <InputField placeholder="Tesla, Inc." label="Company" value={exp.company} onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')} />
                                    <div className="md:col-span-2">
                                        <InputField placeholder="2008 - Present" label="Duration" value={exp.duration} onChange={(e) => handleArrayChange(index, 'duration', e.target.value, 'experience')} />
                                    </div>
                                </div>

                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Key Achievements</label>
                                <textarea
                                    placeholder="• Led the design of the Model S..."
                                    rows="3"
                                    value={exp.description}
                                    onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')}
                                    className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 transition-all placeholder:text-gray-700 resize-none"
                                ></textarea>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Education */}
                <section className="mb-12">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Education</h2>
                        </div>
                        <button
                            onClick={() => addItem('education', { degree: '', school: '', year: '' })}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add School
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.education.map((edu, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={index}
                                className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/5 relative group hover:border-white/10 transition-colors"
                            >
                                <button onClick={() => removeItem(index, 'education')} className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition bg-black/20 p-2 rounded-full opacity-0 group-hover:opacity-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputField placeholder="B.S. Physics" label="Degree" value={edu.degree} onChange={(e) => handleArrayChange(index, 'degree', e.target.value, 'education')} />
                                    <InputField placeholder="UPenn" label="University" value={edu.school} onChange={(e) => handleArrayChange(index, 'school', e.target.value, 'education')} />
                                    <InputField placeholder="1997" label="Year" value={edu.year} onChange={(e) => handleArrayChange(index, 'year', e.target.value, 'education')} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Skills */}
                <section className="mb-14">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skills & Technologies</h2>
                    </div>
                    <textarea
                        name="skills"
                        placeholder="Rocket Science, Electric Vehicles, Meme Lord, Python, React..."
                        rows="2"
                        value={formData.skills}
                        onChange={handleInputChange}
                        className="w-full bg-[#1c1c1e] text-white rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-[#ccff00]/50 transition-all placeholder:text-gray-600 resize-none focus:bg-[#2c2c2e]"
                    ></textarea>
                </section>

                <div className="text-center">
                    <button
                        onClick={generateResume}
                        disabled={isGenerating}
                        className="btn-lime w-full md:w-auto min-w-[300px] px-8 py-4 rounded-full text-lg font-bold shadow-[0_0_40px_rgba(204,255,0,0.3)] hover:shadow-[0_0_60px_rgba(204,255,0,0.5)] transition-all flex items-center justify-center gap-3"
                    >
                        {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div> : <><Download className="w-5 h-5" /> Generate PDF Resume</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResumeBuilder;
