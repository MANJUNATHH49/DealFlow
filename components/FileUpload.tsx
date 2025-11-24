import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, X, Camera, RefreshCw, SwitchCamera, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  // Camera Logic
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
      setIsCameraOpen(false);
    }
  }, [facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    }
  }, [facingMode, isCameraOpen, startCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror if user facing
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            onFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isCameraOpen ? (
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full h-[500px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Overlay UI */}
            <div className="absolute inset-0 flex flex-col justify-between p-6">
               <div className="flex justify-between items-start">
                 <div className="bg-black/40 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <ScanLine size={14} className="text-primary animate-pulse" />
                    Scanning Product
                 </div>
                 <button onClick={stopCamera} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition border border-white/10">
                    <X size={24} />
                 </button>
               </div>
               
               {/* Scanning Guides */}
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border border-white/30 rounded-2xl relative">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl -mt-1 -ml-1" />
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl -mt-1 -mr-1" />
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl -mb-1 -ml-1" />
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl -mb-1 -mr-1" />
                  </div>
               </div>

               <div className="flex justify-between items-center relative z-20">
                  <div className="w-12"></div> {/* Spacer */}
                  
                  <button 
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition active:scale-95 shadow-glow backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 bg-white rounded-full" />
                  </button>

                  <button 
                    onClick={toggleCamera}
                    className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition border border-white/10"
                  >
                    <SwitchCamera size={20} />
                  </button>
               </div>
            </div>
          </motion.div>
        ) : selectedFile ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group w-full h-[400px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-glass"
          >
            <div className="absolute inset-0 p-4 flex items-center justify-center">
               <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm gap-4">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClear}
                className="bg-red-500/20 text-red-400 p-4 rounded-full border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors shadow-lg backdrop-blur-md"
              >
                <RefreshCw size={24} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drop Zone */}
              <motion.div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  relative h-64 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                  border-2 border-dashed
                  ${isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-slate-700 hover:border-primary/50 hover:bg-slate-800/50 bg-slate-900/40'}
                `}
              >
                <motion.div 
                  animate={isDragging ? { y: -10 } : { y: 0 }}
                  className="p-4 bg-slate-800 rounded-2xl shadow-lg mb-4"
                >
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-slate-400'}`} />
                </motion.div>
                <p className="text-lg font-bold text-slate-200">Upload Screenshot</p>
                <p className="text-xs text-slate-500 mt-1">Drag & drop or click</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInput} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>

              {/* Camera Button */}
              <motion.button
                onClick={() => setIsCameraOpen(true)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="h-64 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed border-slate-700 hover:border-secondary/50 hover:bg-slate-800/50 bg-slate-900/40 group"
              >
                <div className="p-4 bg-slate-800 rounded-2xl shadow-lg mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-secondary" />
                </div>
                <p className="text-lg font-bold text-slate-200">Scan Product</p>
                <p className="text-xs text-slate-500 mt-1">Take photo directly</p>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;