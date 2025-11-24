
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import Analysis from './Analysis';
import { analyzeProductImage } from '../services/gemini';
import { saveToHistory } from '../services/history';
import { AnalysisResult } from '../types';
import { Loader2, AlertTriangle, Sparkles, ArrowRight, MessageSquare, Image as ImageIcon, Zap, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [context, setContext] = useState('');
  
  const location = useLocation();

  // Check if we navigated here with history data
  useEffect(() => {
    if (location.state && location.state.analysisData) {
      setResult(location.state.analysisData);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const data = await analyzeProductImage(base64Data, file.type, context);
          
          const finalData: AnalysisResult = {
             ...data,
             id: crypto.randomUUID(),
             timestamp: Date.now()
          };

          await saveToHistory(finalData);
          setResult(finalData);
        } catch (err: any) {
          setError(err.message || "Failed to analyze image.");
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setError("Error reading file.");
      setLoading(false);
    }
  };

  if (result) {
    return <Analysis data={result} onReset={() => { setResult(null); setFile(null); setContext(''); }} />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
         <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{user?.displayName?.split(' ')[0] || 'Explorer'}</span>.
         </h1>
         <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Your personal AI suite for shopping, negotiating, and creating.
         </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Main Feature: Price Negotiator (Takes up 8 columns) */}
        <motion.div variants={itemVariants} className="lg:col-span-8">
            <div className="relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative glass-panel rounded-[2rem] shadow-glass p-8 border border-white/10 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Zap className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Price Negotiator</h2>
                            <p className="text-sm text-slate-400">Scan products, check prices, and get negotiation scripts.</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-6">
                         <FileUpload 
                            selectedFile={file} 
                            onFileSelect={handleFileSelect} 
                            onClear={() => setFile(null)} 
                        />
                        
                        <div className="space-y-4">
                            <AnimatePresence>
                                {file && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <input
                                            type="text"
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            placeholder="Context: e.g. 'Budget is $200' or 'Student discount?'"
                                            className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none text-slate-200 placeholder:text-slate-500 transition-all"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm flex items-center gap-2 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                    <AlertTriangle size={16} /> {error}
                                </motion.div>
                            )}

                            <motion.button
                                onClick={handleAnalyze}
                                disabled={!file || loading}
                                whileHover={!loading && file ? { scale: 1.02 } : {}}
                                whileTap={!loading && file ? { scale: 0.98 } : {}}
                                className={`
                                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                                ${!file || loading 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                                    : 'bg-gradient-to-r from-blue-600 to-primary text-white shadow-lg hover:shadow-blue-500/30'}
                                `}
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin" /> Analyzing...</>
                                ) : (
                                    <><Sparkles size={20} /> Analyze Deal</>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>

        {/* Secondary Features (Right Column) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Capability Heading */}
            <div className="flex items-center gap-2 mb-2 px-2">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discover Capabilities</span>
            </div>

            {/* AI Chat Card */}
            <Link to="/chat" className="group">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all bg-slate-900/40 hover:bg-slate-800/60 shadow-lg group-hover:shadow-purple-500/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare size={24} />
                        </div>
                        <div className="bg-slate-800 px-2 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-slate-700">Gemini Flash</div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">Smart Assistant</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">Chat with context, thinking mode, and multimodal analysis.</p>
                    <div className="flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
                        Start Chat <ArrowRight size={14} className="ml-1" />
                    </div>
                </div>
            </Link>

            {/* Image Tools Card */}
            <Link to="/tools" className="group">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-pink-500/30 transition-all bg-slate-900/40 hover:bg-slate-800/60 shadow-lg group-hover:shadow-pink-500/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-400 group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon size={24} />
                        </div>
                        <div className="bg-slate-800 px-2 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-slate-700">Imagen 4.0</div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-pink-300 transition-colors">Creative Studio</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">Generate assets, UI placeholders, and visualize ideas.</p>
                    <div className="flex items-center text-xs font-semibold text-pink-400 group-hover:translate-x-1 transition-transform">
                        Open Studio <ArrowRight size={14} className="ml-1" />
                    </div>
                </div>
            </Link>
            
            {/* Security Badge */}
            <div className="mt-auto flex items-center justify-center gap-2 text-slate-600 text-xs py-4">
                <Shield size={12} />
                <span>Secure • Private • History Enabled</span>
            </div>

        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
