
import React, { useState } from 'react';

const ResumeBuilder = () => {
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
            const response = await fetch('http://localhost:8000/api/resume-builder/generate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to generate resume');

            // Handle PDF download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
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

    return (
        <div className="min-h-screen p-8 flex flex-col items-center animate-fade-in w-full">
            <div className="max-w-4xl w-full glass-card p-8">
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Smart Resume Builder
                    </h1>
                    <div className="text-sm text-gray-400">ATS-Optimized format</div>
                </div>

                {/* Personal Info */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-sm">1</span>
                        Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} className="input-premium" />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} className="input-premium" />
                        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} className="input-premium" />
                        <input type="text" name="linkedin" placeholder="LinkedIn URL" value={formData.linkedin} onChange={handleInputChange} className="input-premium" />
                    </div>
                </section>

                {/* Summary */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">2</span>
                        Professional Summary
                    </h2>
                    <textarea name="summary" placeholder="Briefly describe your career goals and achievements..." rows="4" value={formData.summary} onChange={handleInputChange} className="input-premium w-full resize-none"></textarea>
                </section>

                {/* Experience */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-sm">3</span>
                            Work Experience
                        </h2>
                        <button onClick={() => addItem('experience', { title: '', company: '', duration: '', description: '' })} className="text-sm bg-pink-500/20 text-pink-300 px-3 py-1 rounded hover:bg-pink-500/30 transition border border-pink-500/20">+ Add Role</button>
                    </div>
                    {formData.experience.map((exp, index) => (
                        <div key={index} className="bg-black/20 p-6 rounded-xl mb-4 border border-white/5 relative group hover:border-white/10 transition">
                            <button onClick={() => removeItem(index, 'experience')} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition">Remove ✕</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input type="text" placeholder="Job Title" value={exp.title} onChange={(e) => handleArrayChange(index, 'title', e.target.value, 'experience')} className="input-premium" />
                                <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')} className="input-premium" />
                                <input type="text" placeholder="Duration (e.g. 2020 - Present)" value={exp.duration} onChange={(e) => handleArrayChange(index, 'duration', e.target.value, 'experience')} className="input-premium md:col-span-2" />
                            </div>
                            <textarea placeholder="Job Description / Achievements" rows="3" value={exp.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')} className="input-premium w-full resize-none"></textarea>
                        </div>
                    ))}
                </section>

                {/* Education */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">4</span>
                            Education
                        </h2>
                        <button onClick={() => addItem('education', { degree: '', school: '', year: '' })} className="text-sm bg-green-500/20 text-green-300 px-3 py-1 rounded hover:bg-green-500/30 transition border border-green-500/20">+ Add Education</button>
                    </div>
                    {formData.education.map((edu, index) => (
                        <div key={index} className="bg-black/20 p-6 rounded-xl mb-4 border border-white/5 relative group hover:border-white/10 transition">
                            <button onClick={() => removeItem(index, 'education')} className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition">Remove ✕</button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" placeholder="Degree / Major" value={edu.degree} onChange={(e) => handleArrayChange(index, 'degree', e.target.value, 'education')} className="input-premium" />
                                <input type="text" placeholder="School / University" value={edu.school} onChange={(e) => handleArrayChange(index, 'school', e.target.value, 'education')} className="input-premium" />
                                <input type="text" placeholder="Graduation Year" value={edu.year} onChange={(e) => handleArrayChange(index, 'year', e.target.value, 'education')} className="input-premium" />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Skills */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-sm">5</span>
                        Skills
                    </h2>
                    <textarea name="skills" placeholder="List your key skills, separated by commas (e.g. Python, React, Team Leadership)..." rows="2" value={formData.skills} onChange={handleInputChange} className="input-premium w-full resize-none"></textarea>
                </section>

                <div className="text-center pb-4">
                    <button
                        onClick={generateResume}
                        disabled={isGenerating}
                        className="btn-primary w-full md:w-auto min-w-[300px]"
                    >
                        {isGenerating ? 'Generating PDF...' : 'Download Resume PDF 📄'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResumeBuilder;
