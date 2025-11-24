
import React from 'react';
import { AnalysisResult } from '../types';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Copy, Check, ExternalLink, ArrowLeft, Share2, Sparkles, TrendingUp, AlertCircle, ShieldCheck, TrendingDown, Cpu, Star, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalysisProps {
  data: AnalysisResult;
  onReset: () => void;
}

const Analysis: React.FC<AnalysisProps> = ({ data, onReset }) => {
  const [copied, setCopied] = React.useState(false);
  const [hindiCopied, setHindiCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const copyToClipboard = (text: string, isHindi: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isHindi) {
      setHindiCopied(true);
      setTimeout(() => setHindiCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareText = `I used AI to analyze ${data.productName} for ${data.extractedPrice}.\n\nVerdict: ${data.recommendation}\nNegotiation Script: "${data.negotiationMessage}"\n\nAnalyzed by DealFlow AI.`;
    
    // Check if URL is valid for sharing (must be http/https)
    const urlToShare = window.location.href.startsWith('http') ? window.location.href : undefined;

    const shareData = {
      title: `DealFlow Analysis: ${data.productName}`,
      text: shareText,
      url: urlToShare
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.warn("Native share failed, falling back to clipboard:", err);
        // Fallback to clipboard if native share fails (e.g. invalid URL or user cancelled)
        navigator.clipboard.writeText(shareText);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getBenefitBadge = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('price') || lower.includes('cheap') || lower.includes('cost') || lower.includes('save') || lower.includes('affordable')) {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                <TrendingDown size={12} /> Best Price
            </span>
        );
    }
    if (lower.includes('spec') || lower.includes('faster') || lower.includes('performance') || lower.includes('chip') || lower.includes('ram') || lower.includes('feature')) {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full border border-purple-400/20">
                <Cpu size={12} /> Better Specs
            </span>
        );
    }
    if (lower.includes('rating') || lower.includes('review') || lower.includes('star') || lower.includes('popular')) {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/20">
                <Star size={12} /> Top Rated
            </span>
        );
    }
    if (lower.includes('trust') || lower.includes('seller') || lower.includes('warranty') || lower.includes('official') || lower.includes('brand')) {
         return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">
                <ShieldCheck size={12} /> Trusted
            </span>
        );
    }
    
    // Default
    return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-400/10 px-2 py-1 rounded-full border border-slate-400/20">
            <ThumbsUp size={12} /> Alternative
        </span>
    );
  };

  const chartData = [
    { name: 'Value Score', uv: data.valueScore, fill: getScoreColor(data.valueScore) },
    { name: 'Max', uv: 100, fill: '#1E293B' } // Dark background for chart track
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4">
      <motion.button 
        onClick={onReset}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <div className="p-2 rounded-full bg-slate-800 shadow-sm border border-slate-700 group-hover:border-slate-500 transition-colors">
            <ArrowLeft size={16} />
        </div>
        <span className="font-medium">Analyze another</span>
      </motion.button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* 1. Header Card (Full Width) */}
        <motion.div variants={itemVariants} className="md:col-span-3 glass-panel p-8 rounded-[2rem] shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <div>
             <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-700">
                    Product Analysis
                </span>
                <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                    ★ {data.rating}
                </span>
             </div>
             <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{data.productName}</h1>
             <p className="text-xl text-primary font-semibold">{data.extractedPrice}</p>
          </div>
          
          <div className={`
            px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg border border-white/5 backdrop-blur-md
            ${data.recommendation === 'Buy Now' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' :
              data.recommendation === 'Wait for Sale' ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' :
              'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'}
          `}>
             {data.recommendation === 'Buy Now' && <ShieldCheck size={28} />}
             {data.recommendation === 'Wait for Sale' && <AlertCircle size={28} />}
             {data.recommendation === "Don't Buy" && <AlertCircle size={28} />}
             <div className="flex flex-col">
                <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Verdict</span>
                <span className="text-lg font-bold leading-none">{data.recommendation}</span>
             </div>
          </div>
        </motion.div>

        {/* 2. Value Score (Left Col) */}
        <motion.div variants={itemVariants} className="bg-slate-800/50 rounded-[2rem] p-6 shadow-lg border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
           <h3 className="text-slate-400 font-medium mb-4 z-10">Value Score</h3>
           <div className="h-48 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={20} data={chartData} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="uv" cornerRadius={30} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                <span className="text-5xl font-black text-white tracking-tighter">{data.valueScore}</span>
                <span className="text-sm text-slate-500 font-medium">out of 100</span>
            </div>
           </div>
           <p className="text-center text-sm text-slate-400 px-4 mt-[-20px] z-10">{data.rationale}</p>
           {/* Decorative BG */}
           <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-slate-900/50 to-transparent z-0" />
        </motion.div>

        {/* 3. Key Reasons (Middle Col) */}
        <motion.div variants={itemVariants} className="md:col-span-2 bg-slate-800/50 rounded-[2rem] p-8 shadow-lg border border-slate-700">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} /> Analysis Highlights
           </h3>
           <div className="grid sm:grid-cols-2 gap-4">
              {data.recommendationReason.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
                   <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                   <p className="text-sm text-slate-300 leading-relaxed">{reason}</p>
                </div>
              ))}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
                   <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                   <p className="text-sm text-slate-300 leading-relaxed">Confidence Level: <span className="font-semibold text-white">{data.confidence}</span></p>
                </div>
           </div>
        </motion.div>

        {/* 4. Negotiation Script (Full Width Hero) */}
        <motion.div variants={itemVariants} className="md:col-span-2 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-slate-900 rounded-[2rem] shadow-2xl border border-white/10" />
           <div className="relative p-8 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                       <Sparkles className="text-yellow-400" /> Negotiation Script
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">AI-crafted message to get you the best deal.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10"
                    >
                      {shared ? <Check size={16} /> : <Share2 size={16} />}
                      {shared ? 'Shared' : 'Share'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copyToClipboard(data.negotiationMessage)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </motion.button>
                 </div>
              </div>

              <div className="bg-black/20 rounded-xl p-6 border border-white/10 backdrop-blur-sm relative group/message">
                 <p className="font-serif text-lg leading-relaxed opacity-90 italic">"{data.negotiationMessage}"</p>
              </div>
              
              {data.negotiationMessageHindi && (
                 <div className="mt-4 pt-4 border-t border-white/10 relative group/hindi">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hindi Variant</p>
                        <button 
                            onClick={() => copyToClipboard(data.negotiationMessageHindi!, true)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                        >
                            {hindiCopied ? <Check size={12} /> : <Copy size={12} />}
                            {hindiCopied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-sm text-slate-300 italic">"{data.negotiationMessageHindi}"</p>
                 </div>
              )}
           </div>
        </motion.div>

        {/* 5. Alternatives (Right Col) */}
        <motion.div variants={itemVariants} className="glass-panel rounded-[2rem] p-6 shadow-glass border border-white/10 flex flex-col h-full bg-slate-800/40">
           <h3 className="font-bold text-white mb-4">Alternatives</h3>
           <div className="flex-1 space-y-3">
              {data.alternatives.map((alt, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-primary/50 transition-colors shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                     {getBenefitBadge(alt.difference)}
                     {alt.price && <span className="text-xs font-bold text-slate-300 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700">{alt.price}</span>}
                  </div>
                  <p className="font-bold text-slate-100 text-sm mb-1 group-hover:text-primary transition-colors">{alt.name}</p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{alt.difference}</p>
                </div>
              ))}
              {data.alternatives.length === 0 && (
                 <div className="text-center py-8 text-slate-500 text-sm">No alternatives found.</div>
              )}
           </div>
           {data.searchLinks && data.searchLinks.length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Verified Sources</p>
                <div className="space-y-2">
                   {data.searchLinks.slice(0, 2).map((link, i) => (
                      <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:underline truncate">
                        <ExternalLink size={12} /> {link.title}
                      </a>
                   ))}
                </div>
             </div>
           )}
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Analysis;
