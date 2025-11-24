
import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio } from '../types';
import { generateCustomImage, describeImageForGeneration } from '../services/gemini';
import { saveGeneration } from '../services/history';
import { Image as ImageIcon, Download, Loader2, Sparkles, Wand2, Mic, MicOff, Plus, X, LayoutTemplate, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type ToolMode = 'standard' | 'ui-placeholder';

const Tools: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>('standard');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');

  const [referenceImage, setReferenceImage] = useState<{ file: File, preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
            setPrompt((prev) => {
                const prefix = prev.trim() && !prev.trim().endsWith(' ') ? ' ' : '';
                return prev + prefix + finalTranscript.trim();
            });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage({
          file,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let finalPrompt = prompt;

      if (mode === 'ui-placeholder') {
        finalPrompt = `A professional UI placeholder image, ${width}x${height} pixels. Style: Minimalist, Modern. Content: ${prompt || 'Abstract geometric shapes'}`;
      }

      if (referenceImage) {
         const base64 = referenceImage.preview.split(',')[1];
         const description = await describeImageForGeneration(base64, referenceImage.file.type);
         finalPrompt = `${finalPrompt}. Visual Style Reference: ${description}`;
      }

      const imgData = await generateCustomImage(finalPrompt, aspectRatio);
      if (imgData) {
        setGeneratedImage(imgData);
        // Save to Database
        await saveGeneration({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            prompt: finalPrompt,
            aspectRatio: mode === 'standard' ? aspectRatio : undefined,
            mode: mode,
            imageData: imgData,
            refImage: referenceImage?.preview
        });
      } else {
        setError("Failed to generate image.");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && e.message.includes("403")) {
         setError("Permission denied. Ensure your API key has access to image generation models.");
      } else {
         setError("Error generating image. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderAspectRatioIcon = (ratio: AspectRatio) => {
    let w = 'w-6';
    let h = 'h-6';
    
    switch(ratio) {
      case AspectRatio.SQUARE: w='w-6'; h='h-6'; break;
      case AspectRatio.PORTRAIT_3_4: w='w-6'; h='h-8'; break;
      case AspectRatio.LANDSCAPE_4_3: w='w-8'; h='h-6'; break;
      case AspectRatio.PORTRAIT_9_16: w='w-5'; h='h-9'; break;
      case AspectRatio.LANDSCAPE_16_9: w='w-9'; h='h-5'; break;
    }

    return <div className={`border-2 ${h} ${w} rounded-sm transition-colors`} />;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 mb-4 shadow-sm">
           <Wand2 size={16} className="text-purple-400" />
           <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">AI Image Studio</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Creative Suite</h1>
        <p className="text-slate-400 max-w-xl mx-auto">Generate product shots, marketing assets, or UI placeholders.</p>
      </div>

      <div className="flex justify-center mb-8">
         <div className="bg-slate-900/50 p-1.5 rounded-2xl flex items-center border border-slate-800">
            <button 
               onClick={() => setMode('standard')}
               className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'standard' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
               <Sparkles size={16} /> Standard
            </button>
            <button 
               onClick={() => setMode('ui-placeholder')}
               className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'ui-placeholder' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
               <LayoutTemplate size={16} /> UI Placeholder
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl shadow-glass border border-white/5 bg-slate-900/40">
            <div className="space-y-5">
              
              {mode === 'ui-placeholder' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/30 rounded-2xl border border-slate-800">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Width (px)</label>
                        <input 
                           type="number" 
                           value={width}
                           onChange={(e) => setWidth(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Height (px)</label>
                        <input 
                           type="number" 
                           value={height}
                           onChange={(e) => setHeight(e.target.value)}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                     </div>
                  </div>
              )}

              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-300 ml-1 flex justify-between">
                    <span>Reference Image (Optional)</span>
                    {referenceImage && <span className="text-xs text-green-400 flex items-center gap-1"><Sparkles size={10}/> Active</span>}
                 </label>
                 
                 {!referenceImage ? (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border border-dashed border-slate-700 rounded-2xl p-4 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <Plus size={16} /> Upload Reference
                    </button>
                 ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                        <img src={referenceImage.preview} alt="Ref" className="w-full h-32 object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <button 
                                onClick={() => setReferenceImage(null)}
                                className="bg-red-500/80 text-white p-2 rounded-full hover:bg-red-500 transition shadow-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1">
                   {mode === 'ui-placeholder' ? 'Description / Theme' : 'Your Vision'}
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'ui-placeholder' ? "e.g., Dark mode analytics dashboard background" : "Describe your image in detail..."}
                    className="w-full h-36 px-4 py-4 pr-12 rounded-2xl bg-slate-950/50 border border-slate-700 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none text-slate-100 placeholder:text-slate-600 shadow-inner"
                  />
                  <button
                    onClick={toggleListening}
                    className={`
                      absolute bottom-3 right-3 p-2 rounded-xl transition-all duration-200
                      ${isListening 
                        ? 'bg-red-500/20 text-red-500 animate-pulse ring-2 ring-red-500/40' 
                        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}
                    `}
                    title="Voice Input"
                  >
                     {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>
              </div>

              {mode === 'standard' && (
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                    {Object.values(AspectRatio).map((ratio) => (
                        <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`
                            relative flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-200 gap-1 group
                            ${aspectRatio === ratio
                            ? 'bg-primary/20 border-primary text-primary shadow-glow'
                            : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-800 hover:border-slate-600'}
                        `}
                        >
                        <div className={aspectRatio === ratio ? 'border-primary' : 'border-slate-500 group-hover:border-slate-400'}>
                            {renderAspectRatioIcon(ratio)}
                        </div>
                        <span className="text-[10px] font-medium">{ratio}</span>
                        </button>
                    ))}
                    </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || (!prompt.trim() && !referenceImage)}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                  ${loading || (!prompt.trim() && !referenceImage)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]'}
                `}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? (mode === 'ui-placeholder' ? "Drafting..." : "Dreaming...") : "Generate Asset"}
              </button>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
           <div className={`
              h-full min-h-[500px] rounded-3xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all duration-500
              ${generatedImage ? 'border-transparent shadow-2xl bg-black' : 'border-slate-800 bg-slate-900/30'}
           `}>
              
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm"
                  >
                    <div className="relative">
                       <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin" />
                       <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-500" size={24} />
                    </div>
                    <p className="mt-4 text-slate-400 font-medium animate-pulse">Designing your visual...</p>
                  </motion.div>
                )}

                {!loading && !generatedImage && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-8 opacity-40"
                  >
                    <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto mb-4 flex items-center justify-center">
                       {mode === 'ui-placeholder' ? <Monitor className="w-10 h-10 text-slate-500" /> : <ImageIcon className="w-10 h-10 text-slate-500" />}
                    </div>
                    <p className="text-lg font-medium text-slate-400">Ready to Create</p>
                    <p className="text-sm text-slate-500">
                        {mode === 'ui-placeholder' ? 'Define dimensions and describe your UI mockups.' : 'Your generated masterpiece will appear here'}
                    </p>
                  </motion.div>
                )}

                {!loading && generatedImage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full flex items-center justify-center group"
                  >
                     <img src={generatedImage} alt="Generated" className="max-w-full max-h-[600px] object-contain shadow-2xl" />
                     
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                        <motion.a 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={generatedImage} 
                          download={`dealflow-${mode}-${Date.now()}.png`} 
                          className="self-center bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-blue-50"
                        >
                          <Download size={20} /> Download Image
                        </motion.a>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!generatedImage && !loading && (
                 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
