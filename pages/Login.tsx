
import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail, resetPassword } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, AlertCircle, CheckCircle2, Mail, Lock, ArrowRight, HelpCircle, ShieldAlert } from 'lucide-react';
import { FIREBASE_CONFIG } from '../constants';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Email/Password State
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check if we are likely in demo mode
  const isDemoMode = !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.includes('Dummy');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    // Handle Password Reset
    if (isResetting) {
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccessMsg("Password reset email sent! Check your inbox.");
            setIsResetting(false);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
        } finally {
            setLoading(false);
        }
        return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }
    
    setLoading(true);
    
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email is already registered. Try signing in.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        if (isRegistering) {
             setError("Could not create account. Please try a different email.");
        } else {
             setError("Incorrect email or password. Do you need to create an account?");
        }
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password sign-in is not enabled in Firebase Console.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
      // Force demo mode in local storage
      localStorage.setItem('demo_auth_active', 'true');
      window.location.reload(); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-800">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
             <ShoppingBag className="text-white" size={24} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isResetting ? "Reset Password" : isRegistering ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isResetting ? "Enter your email to receive a reset link." : isRegistering ? "Join DealFlow to start saving." : "Sign in to access your negotiation history."}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2 animate-pulse border border-red-100">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-green-100">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-900 mb-1">Email Address</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                   <Mail size={18} />
                 </div>
                 <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary transition-colors bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white focus:shadow-md"
                    placeholder="you@example.com"
                    required
                 />
               </div>
             </div>
             
             {!isResetting && (
                 <div>
                   <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-900">Password</label>
                        {!isRegistering && (
                            <button 
                                type="button"
                                onClick={() => { setIsResetting(true); setError(null); setSuccessMsg(null); }}
                                className="text-xs text-primary hover:text-blue-700 font-medium"
                            >
                                Forgot Password?
                            </button>
                        )}
                   </div>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                       <Lock size={18} />
                     </div>
                     <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary transition-colors bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white focus:shadow-md"
                        placeholder="••••••••"
                        required
                     />
                   </div>
                 </div>
             )}

             <button
                type="submit"
                disabled={loading}
                className={`
                  w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white 
                  ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700 shadow-lg hover:shadow-xl'}
                  transition-all duration-200
                `}
              >
                {loading ? 'Processing...' : (
                   <span className="flex items-center gap-2">
                      {isResetting ? 'Send Reset Link' : isRegistering ? 'Sign Up' : 'Sign In'} <ArrowRight size={16} />
                   </span>
                )}
             </button>
          </form>

          <div className="text-center mt-4">
             {isResetting ? (
                <button 
                    onClick={() => { setIsResetting(false); setError(null); setSuccessMsg(null); }}
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                    Back to Sign In
                </button>
             ) : (
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); setSuccessMsg(null); }}
                    className="text-sm text-primary hover:text-blue-700 font-medium transition-colors"
                >
                    {isRegistering 
                        ? "Already have an account? Sign In" 
                        : "Don't have an account? Sign Up"}
                </button>
             )}
          </div>
        </div>
        
        <div className="mt-6 border-t border-gray-100 pt-6">
            <button 
                onClick={handleDemoLogin}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-semibold"
            >
                <ShieldAlert size={16} />
                Enter Demo Mode (Bypass Auth)
            </button>
            <p className="mt-3 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                <HelpCircle size={12} />
                <span>Use Demo Mode if you can't connect to Firebase.</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
