
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
        <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Smart Resume Builder</h1>

                {/* Personal Info */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                        <input type="text" name="linkedin" placeholder="LinkedIn URL" value={formData.linkedin} onChange={handleInputChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                    </div>
                </section>

                {/* Summary */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">Professional Summary</h2>
                    <textarea name="summary" placeholder="Briefly describe your career goals and achievements..." rows="4" value={formData.summary} onChange={handleInputChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"></textarea>
                </section>

                {/* Experience */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-blue-600">Work Experience</h2>
                        <button onClick={() => addItem('experience', { title: '', company: '', duration: '', description: '' })} className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition">+ Add Role</button>
                    </div>
                    {formData.experience.map((exp, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border relative group">
                            <button onClick={() => removeItem(index, 'experience')} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">✕</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input type="text" placeholder="Job Title" value={exp.title} onChange={(e) => handleArrayChange(index, 'title', e.target.value, 'experience')} className="p-2 border rounded outline-none text-gray-900" />
                                <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')} className="p-2 border rounded outline-none text-gray-900" />
                                <input type="text" placeholder="Duration (e.g. 2020 - Present)" value={exp.duration} onChange={(e) => handleArrayChange(index, 'duration', e.target.value, 'experience')} className="p-2 border rounded outline-none text-gray-900" />
                            </div>
                            <textarea placeholder="Job Description / Achievements" rows="2" value={exp.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')} className="w-full p-2 border rounded outline-none text-gray-900"></textarea>
                        </div>
                    ))}
                </section>

                {/* Education */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-blue-600">Education</h2>
                        <button onClick={() => addItem('education', { degree: '', school: '', year: '' })} className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition">+ Add Education</button>
                    </div>
                    {formData.education.map((edu, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border relative group">
                            <button onClick={() => removeItem(index, 'education')} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">✕</button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="text" placeholder="Degree / Major" value={edu.degree} onChange={(e) => handleArrayChange(index, 'degree', e.target.value, 'education')} className="p-2 border rounded outline-none text-gray-900" />
                                <input type="text" placeholder="School / University" value={edu.school} onChange={(e) => handleArrayChange(index, 'school', e.target.value, 'education')} className="p-2 border rounded outline-none text-gray-900" />
                                <input type="text" placeholder="Graduation Year" value={edu.year} onChange={(e) => handleArrayChange(index, 'year', e.target.value, 'education')} className="p-2 border rounded outline-none text-gray-900" />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Skills */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">Skills</h2>
                    <textarea name="skills" placeholder="List your key skills, separated by commas (e.g. Python, React, Team Leadership)..." rows="2" value={formData.skills} onChange={handleInputChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"></textarea>
                </section>

                <div className="text-center mt-8">
                    <button
                        onClick={generateResume}
                        disabled={isGenerating}
                        className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isGenerating ? 'Generating PDF...' : 'Download Resume 📄'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResumeBuilder;
