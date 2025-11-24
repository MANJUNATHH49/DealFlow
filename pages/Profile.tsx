
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../components/UserProfile';
import { getHistory, getChatHistory, getGenerationHistory, clearAllUserData } from '../services/history';
import { AnalysisResult, ChatSession, GenerationHistory } from '../types';
import { Clock, ChevronRight, Loader2, MessageSquare, Image as ImageIcon, ShoppingBag, LayoutGrid, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'analysis' | 'chats' | 'creations';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [creations, setCreations] = useState<GenerationHistory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [analysisData, chatData, creationData] = await Promise.all([
          getHistory(),
          getChatHistory(),
          getGenerationHistory()
      ]);
      setAnalyses(analysisData);
      setChats(chatData);
      setCreations(creationData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAnalysisClick = (item: AnalysisResult) => {
    navigate('/', { state: { analysisData: item } });
  };

  const onClearConfirm = async () => {
    setClearing(true);
    await clearAllUserData();
    setAnalyses([]);
    setChats([]);
    setCreations([]);
    setClearing(false);
    setShowClearConfirm(false);
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-red-400 bg-red-400/10 border-red-400/20';
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-medium ${
            activeTab === id 
            ? 'bg-slate-700 text-white shadow-lg' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
    >
        <Icon size={18} />
        <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in space-y-12 pb-20">
        <div className="text-center">
             <h1 className="text-4xl font-bold text-white tracking-tight">My Profile</h1>
             <p className="text-slate-400 mt-2 text-lg">Manage your account and view past insights</p>
        </div>
        
        <UserProfile />

        <div className="max-w-3xl mx-auto">
           {/* Tabs */}
           <div className="bg-slate-900/50 p-1.5 rounded-2xl flex items-center border border-slate-800 mb-6">
                <TabButton id="analysis" label="Price Checks" icon={ShoppingBag} />
                <TabButton id="chats" label="Chat History" icon={MessageSquare} />
                <TabButton id="creations" label="Creations" icon={ImageIcon} />
           </div>

           {/* Content */}
           <div className="min-h-[300px]">
              {loading ? (
                <div className="flex justify-center py-20">
                   <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'analysis' && (
                        <motion.div 
                            key="analysis"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {analyses.length === 0 ? (
                                <div className="text-center py-10 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30">
                                    <p className="text-slate-500">No analyses found. Start scanning products!</p>
                                </div>
                            ) : (
                                analyses.map((item, index) => (
                                    <div 
                                        key={item.id || index}
                                        onClick={() => handleAnalysisClick(item)}
                                        className="group flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg border ${getScoreColor(item.valueScore)}`}>
                                            {item.valueScore}
                                            </div>
                                            <div>
                                            <h4 className="font-semibold text-white group-hover:text-primary transition-colors">{item.productName}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                <span>{item.extractedPrice}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                <span>{new Date(item.timestamp || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" size={20} />
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'chats' && (
                        <motion.div 
                            key="chats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {chats.length === 0 ? (
                                <div className="text-center py-10 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30">
                                    <p className="text-slate-500">No chat history found.</p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div 
                                        key={chat.id}
                                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-white">{chat.title || 'Conversation'}</h4>
                                            <span className="text-xs text-slate-500">{new Date(chat.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2">"{chat.lastMessage}"</p>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                                            <MessageSquare size={12} />
                                            <span>{chat.messages.length} messages</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'creations' && (
                        <motion.div 
                            key="creations"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-2 gap-4"
                        >
                             {creations.length === 0 ? (
                                <div className="col-span-2 text-center py-10 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30">
                                    <p className="text-slate-500">No creations found.</p>
                                </div>
                            ) : (
                                creations.map((gen) => (
                                    <div key={gen.id} className="group relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                                        <div className="aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                                            {gen.imageData ? (
                                                <img src={gen.imageData} alt="Gen" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            ) : (
                                                <LayoutGrid className="text-slate-600" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <p className="text-xs text-white line-clamp-2">{gen.prompt}</p>
                                            <span className="text-[10px] text-slate-400 mt-1">{new Date(gen.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
              )}
           </div>

           {/* Danger Zone */}
           <div className="mt-12 border-t border-slate-800 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">Danger Zone</h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-red-400 font-semibold">Clear History</h4>
                        <p className="text-red-400/70 text-sm">Permanently delete all price checks, chats, and generated images.</p>
                    </div>
                    <button 
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={18} /> Clear All
                    </button>
                </div>
           </div>
        </div>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
            {showClearConfirm && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Are you sure?</h3>
                                <p className="text-slate-400 text-sm">This action cannot be undone.</p>
                            </div>
                        </div>
                        
                        <p className="text-slate-300 mb-6 leading-relaxed">
                            You are about to delete all your history from DealFlow, including analysis results, chat conversations, and generated images.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                                disabled={clearing}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={onClearConfirm}
                                disabled={clearing}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
                            >
                                {clearing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                {clearing ? 'Deleting...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default Profile;
