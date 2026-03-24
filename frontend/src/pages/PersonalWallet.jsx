
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Upload, Trash2, Download, Briefcase, File, Plus, 
    Clock, Shield, CheckCircle2, AlertCircle, Loader2, Search, Database, Bug, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { 
    ref as dbRef, 
    push, 
    set, 
    onValue, 
    remove,
    query as dbQuery,
    orderByChild,
    equalTo
} from 'firebase/database';
import { 
    ref as storageRef, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject 
} from 'firebase/storage';

const PersonalWallet = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [activeTab, setActiveTab] = useState(localStorage.getItem('walletTab') || 'resumes'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        localStorage.setItem('walletTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (!user?.uid) return;

        setLoading(true);
        // Using Realtime Database reference
        const filesRef = dbRef(db, 'userFiles');
        const userFilesQuery = dbQuery(filesRef, orderByChild('userId'), equalTo(user.uid));

        const unsubscribe = onValue(userFilesQuery, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const fileList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                
                // Sort by date client-side
                const sorted = fileList.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                });
                setFiles(sorted);
            } else {
                setFiles([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Realtime DB Error:", error);
            setLoading(false);
        });

        return () => {
            // Unsubscribe logic for onValue is subtle, but usually not needed explicitly 
            // if component unmounts, but good to have a way to stop it.
            // onValue returns the unsubscribe function.
        };
    }, [user]);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        const category = activeTab; 
        const sRef = storageRef(storage, `user_files/${user.uid}/${category}/${Date.now()}_${file.name}`);
        
        try {
            const uploadTask = uploadBytesResumable(sRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (err) => { throw err; },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    // Push a new record to Realtime Database
                    const newFileRef = push(dbRef(db, 'userFiles'));
                    await set(newFileRef, {
                        userId: user.uid,
                        userEmail: user.email,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: downloadURL,
                        storagePath: sRef.fullPath,
                        category: category.toLowerCase().trim(),
                        createdAt: new Date().toISOString()
                    });
                    
                    setUploading(false);
                    setUploadProgress(0);
                }
            );
        } catch (error) {
            alert("Upload Failed: " + error.message);
            setUploading(false);
        }
    };

    const triggerDelete = (file) => {
        setItemToDelete(file);
        setConfirmDelete(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        const file = itemToDelete;
        console.log("[GUIDO] Deleting file:", file.id);
        
        setConfirmDelete(false);
        setDeletingId(file.id);
        try {
            // Delete from Storage (Catch error if file already gone from storage)
            try {
                await deleteObject(storageRef(storage, file.storagePath));
            } catch (err) {
                console.warn("Storage item already deleted or missing:", err);
            }
            // Delete from Realtime Database
            await remove(dbRef(db, `userFiles/${file.id}`));
        } catch (e) {
            alert("Delete Failed: " + e.message);
        } finally {
            setDeletingId(null);
            setItemToDelete(null);
        }
    };

    const filteredFiles = files.filter(f => {
        const fCat = String(f.category || 'resumes').toLowerCase().trim();
        const tCat = activeTab.toLowerCase().trim();
        return fCat === tCat && f.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="min-h-screen py-10 pb-40 px-4 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#ccff00] text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-full w-fit">
                        <Database className="w-3 h-3" /> Realtime Cloud Sync Active
                    </div>
                    <h1 className="text-5xl font-bold text-white tracking-tight">Personal Vault</h1>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your vault..."
                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white w-full md:w-64 outline-none focus:border-[#ccff00]/30 transition-all"
                        />
                    </div>
                    <label className="btn-lime flex items-center gap-2 cursor-pointer whitespace-nowrap px-6 py-3 shadow-xl shadow-[#ccff00]/10">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Quick Upload</span>
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1c1c1e] p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center shadow-2xl shadow-black/50"
                        >
                            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Delete File?</h3>
                            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                Are you sure you want to delete <span className="text-[#ccff00]">{itemToDelete?.name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Content Browser */}
            <div className="space-y-8">
                <div className="flex gap-2 p-1.5 bg-black/40 backdrop-blur-3xl rounded-2xl w-fit border border-white/5">
                    {[
                        { id: 'resumes', label: 'Resumes', icon: FileText },
                        { id: 'documents', label: 'Important Files', icon: Shield }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                ${activeTab === tab.id ? 'bg-[#ccff00] text-black shadow-xl shadow-[#ccff00]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded text-[9px] ${activeTab === tab.id ? 'bg-black/10' : 'bg-white/5'}`}>
                                {files.filter(f => String(f.category || 'resumes').toLowerCase().trim() === tab.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uploading && (
                        <div className="apple-card p-6 border-[#ccff00]/30 bg-[#ccff00]/5 flex flex-col justify-center gap-4">
                            <div className="flex justify-between text-[10px] font-black text-[#ccff00] uppercase">
                                <span>Syncing to Vault...</span>
                                <span>{Math.round(uploadProgress)}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-[#ccff00]" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
                            </div>
                        </div>
                    )}

                    {filteredFiles.map((file) => (
                        <motion.div 
                            key={file.id} 
                            layout 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ 
                                opacity: deletingId === file.id ? 0.5 : 1, 
                                scale: deletingId === file.id ? 0.98 : 1 
                            }}
                            className={`apple-card p-6 min-h-[220px] flex flex-col justify-between group transition-all relative overflow-hidden ${deletingId === file.id ? 'border-red-500/20' : 'hover:border-[#ccff00]/20'}`}
                        >
                            {deletingId === file.id && (
                                <div className="absolute inset-0 bg-red-900/5 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-red-500/20">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Deleting...
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#ccff00] border border-white/5">
                                    {activeTab === 'resumes' ? <FileText className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => window.open(file.url, '_blank')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                        <Download className="w-4 h-4 text-gray-500 hover:text-white" />
                                    </button>
                                    <button onClick={() => triggerDelete(file)} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all group/del">
                                        <Trash2 className="w-4 h-4 text-gray-500 group-hover/del:text-red-400" />
                                        <span className="text-[10px] font-bold text-gray-500 group-hover/del:text-red-400 uppercase">Delete</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base truncate mb-1" title={file.name}>{file.name}</h3>
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    <span className="flex items-center gap-1 text-[#ccff00]"><Clock className="w-3 h-3" /> {new Date(file.createdAt || 0).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredFiles.length === 0 && !uploading && !loading && (
                        <div className="col-span-full py-20 text-center apple-card border-dashed">
                            <Bug className="w-10 h-10 text-gray-700 mx-auto mb-6 opacity-40" />
                            <h2 className="text-xl font-bold text-white mb-2">This category is empty</h2>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Total files found in other categories: {files.length - filteredFiles.length}</p>
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl inline-block text-[10px] text-gray-400 font-mono">
                                Realtime Sync UID: {user?.uid.slice(0, 16)}...
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="col-span-full py-20 text-center">
                            <Loader2 className="w-10 h-10 text-[#ccff00] animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">Connecting to Realtime Database...</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                <div className="flex gap-6">
                    <span className="text-[#ccff00] flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> Realtime Sync Verified</span>
                    <span>Database: Realtime-Global</span>
                </div>
                <div>User Email: {user?.email}</div>
            </footer>
        </div>
    );
};

export default PersonalWallet;
