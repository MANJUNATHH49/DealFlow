
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, BrainCircuit, Sparkles, MessageSquare, Mic, MicOff, Plus, X, Image as ImageIcon } from 'lucide-react';
import { sendChatMessage } from '../services/gemini';
import { saveChatSession } from '../services/history';
import { ChatMessage, ChatSession } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Augment window for SpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const Chat: React.FC = () => {
  const [sessionId] = useState(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hi! I'm your shopping assistant. Ask me about current market trends, product comparisons, or upload an image for analysis.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ file: File, preview: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Autosave chat session
  useEffect(() => {
    if (messages.length > 1) { // Don't save if just the welcome message
        const session: ChatSession = {
            id: sessionId,
            timestamp: Date.now(),
            lastMessage: messages[messages.length - 1].text.substring(0, 100),
            messages: messages,
            title: messages.find(m => m.role === 'user')?.text.substring(0, 40) || 'New Conversation'
        };
        const timeout = setTimeout(() => {
            saveChatSession(session);
        }, 2000); // Debounce save
        return () => clearTimeout(timeout);
    }
  }, [messages, sessionId]);

  // Initialize Speech Recognition
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
            setInput((prev) => {
                const prefix = prev.trim() && !prev.trim().endsWith(' ') ? ' ' : '';
                return prev + prefix + finalTranscript.trim();
            });
        }
      };

      recognition.onerror = (event: any) => {
        // Don't log 'no-speech' as it spams console
        if (event.error !== 'no-speech') {
            console.error("Speech recognition error", event.error);
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Only stop listening state if not explicitly active (allows auto-restart logic if implemented)
        // For now, we sync state.
        if (recognitionRef.current && !isListening) {
             // Already handled
        } else {
             setIsListening(false);
        }
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
        setAttachedImage({
          file,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const messageText = input.trim() || (attachedImage ? "Analyze this image" : "");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
      attachment: attachedImage?.preview
    };

    // Update state optimistically
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    const currentInput = input;
    const currentImage = attachedImage;
    
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Construct history including images from previous messages
      const history = messages.map(m => {
        const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
        
        if (m.text) {
          parts.push({ text: m.text });
        }
        
        if (m.attachment && m.attachment.startsWith('data:')) {
            try {
                // Extract base64 and mime from data URL
                const matches = m.attachment.match(/^data:(.+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    parts.push({
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    });
                }
            } catch (e) {
                console.warn("Failed to parse attachment for history", e);
            }
        }

        return {
          role: m.role,
          parts: parts
        };
      });

      let imagePayload = undefined;
      if (currentImage) {
        const base64Data = currentImage.preview.split(',')[1];
        imagePayload = {
            data: base64Data,
            mimeType: currentImage.file.type
        };
      }

      const responseText = await sendChatMessage(history, messageText, imagePayload, useThinking);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I couldn't generate a response. Please try again.",
        timestamp: Date.now(),
        isThinking: useThinking
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error checking that for you.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] max-w-5xl mx-auto md:my-4 flex flex-col relative">
      
      {/* Header */}
      <div className="glass-panel rounded-t-2xl p-4 border-b border-white/5 flex justify-between items-center z-10 mx-2 md:mx-0">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-tr from-primary to-blue-600 p-2 rounded-lg shadow-lg shadow-primary/20">
              <Bot className="text-white" size={20} />
           </div>
           <div>
             <h2 className="font-bold text-white text-lg leading-tight">Shopping Assistant</h2>
             <p className="text-xs text-slate-400">Powered by Gemini 3 Pro</p>
           </div>
        </div>
        
        <button 
          onClick={() => setUseThinking(!useThinking)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            useThinking 
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-glow' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <BrainCircuit size={14} />
          <span>Thinking Mode {useThinking ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950/50 backdrop-blur-sm mx-2 md:mx-0 custom-scrollbar">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md
                ${msg.role === 'user' ? 'bg-slate-700 text-slate-300' : 'bg-primary text-white'}
              `}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Sparkles size={16} />}
              </div>
              
              <div className="flex flex-col gap-1 items-start">
                {msg.isThinking && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 flex items-center gap-1 ml-1">
                        <BrainCircuit size={10} /> Deep Thought
                    </span>
                )}
                
                {msg.attachment && (
                   <div className={`mb-2 rounded-xl overflow-hidden border border-white/10 shadow-lg ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                      <img src={msg.attachment} alt="Attachment" className="max-w-[200px] h-auto object-cover" />
                   </div>
                )}

                <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm border ${
                    msg.role === 'user'
                        ? 'bg-slate-800 text-white border-slate-700 rounded-tr-sm'
                        : 'bg-gradient-to-br from-blue-600/20 to-slate-800/40 text-slate-100 border-white/10 rounded-tl-sm'
                    }`}
                >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
                <span className="text-[10px] text-slate-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="flex max-w-[80%] gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-glow">
                 <Sparkles size={16} className="text-white animate-pulse" />
              </div>
              <div className="p-4 bg-slate-800/50 border border-white/5 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full" />
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary/70 rounded-full" />
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary/40 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 glass-panel rounded-b-2xl border-t border-white/5 mx-2 md:mx-0 bg-slate-900/90">
        <AnimatePresence>
            {attachedImage && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, mb: 0 }}
                    animate={{ opacity: 1, height: 'auto', mb: 12 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                    className="relative inline-block"
                >
                    <div className="relative group rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                        <img src={attachedImage.preview} alt="Attachment" className="h-24 w-auto object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={removeAttachment} className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-500">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="relative group flex items-center gap-3">
          <div className="relative flex-1 flex items-center gap-2">
             <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
                title="Upload Image"
             >
                <Plus size={20} />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

             <div className="relative flex-1">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={attachedImage ? "Add a caption..." : useThinking ? "Ask a complex question..." : "Ask me anything..."}
                    disabled={isLoading}
                    className="w-full pl-5 pr-14 py-4 bg-slate-900/80 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition text-slate-100 placeholder:text-slate-500 shadow-inner"
                />
                <button
                    onClick={toggleListening}
                    className={`
                        absolute right-3 top-3 p-1.5 rounded-xl transition-all duration-200
                        ${isListening 
                            ? 'bg-red-500/20 text-red-500 animate-pulse ring-2 ring-red-500/40' 
                            : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}
                    `}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
             </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachedImage) || isLoading}
            className={`
                p-4 rounded-2xl transition-all duration-300 flex items-center justify-center flex-shrink-0
                ${(!input.trim() && !attachedImage) || isLoading 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                    : 'bg-primary text-white shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95'}
            `}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-2 flex justify-center items-center gap-2 text-[10px] text-slate-500 font-medium tracking-wide uppercase">
           <MessageSquare size={10} />
           {useThinking ? "Thinking Model Active" : "Standard Chat Mode"}
        </div>
      </div>
    </div>
  );
};

export default Chat;
