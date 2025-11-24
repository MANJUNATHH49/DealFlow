
import React from 'react';
import { useAuth } from '../App';
import { getInitials } from '../services/firebase';
import { LogOut, Mail, Shield, Cloud, Database } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-md mx-auto">
      <div className="bg-gradient-to-r from-primary to-blue-600 h-32 relative">
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          {user.photoURL ? (
             <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
             />
          ) : (
             <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-slate-800 flex items-center justify-center text-3xl font-bold text-white">
                {getInitials(user.displayName)}
             </div>
          )}
        </div>
      </div>
      
      <div className="pt-16 pb-8 px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{user.displayName || 'Anonymous User'}</h2>
        
        <div className="flex items-center justify-center gap-2 text-gray-500 mt-2 mb-8">
           <Mail size={16} />
           <span className="text-sm">{user.email}</span>
        </div>

        <div className="space-y-3 mb-8">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg text-left border border-blue-100">
                <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                    <Shield size={18} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">Authenticated Session</p>
                    <p className="text-xs text-gray-500">Securely logged in via Firebase</p>
                </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg text-left border border-purple-100">
                <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600">
                    <Database size={18} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">Cloud Sync Active</p>
                    <p className="text-xs text-gray-500">History saved to Firestore DB</p>
                </div>
            </div>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold border border-red-100"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
