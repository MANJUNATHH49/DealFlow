
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { getInitials } from '../services/firebase';
import { ShoppingBag, MessageSquare, Image as ImageIcon, LogOut, Menu, X, DollarSign, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link to={to} className="relative group flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors">
      <span className={`relative z-10 flex items-center space-x-2 ${isActive(to) ? 'text-primary font-semibold' : 'text-slate-400 group-hover:text-primary'}`}>
        <Icon size={18} />
        <span>{label}</span>
      </span>
      {isActive(to) && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute inset-0 bg-slate-800 rounded-xl"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-2xl shadow-glass px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="bg-gradient-to-tr from-primary to-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"
              >
                <ShoppingBag className="text-white" size={22} />
              </motion.div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
                DealFlow
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <NavLink to="/" icon={DollarSign} label="Price Check" />
            <NavLink to="/chat" icon={MessageSquare} label="AI Chat" />
            <NavLink to="/tools" icon={ImageIcon} label="Tools" />
            
            <div className="w-px h-6 bg-slate-700 mx-4" />

            {user ? (
              <Link to="/profile" className="flex items-center gap-3 pl-2 group">
                {user.photoURL ? (
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    src={user.photoURL} 
                    alt="Profile" 
                    className="h-9 w-9 rounded-full border-2 border-slate-700 shadow-sm ring-2 ring-transparent group-hover:ring-blue-500 transition-all object-cover"
                  />
                ) : (
                  <motion.div 
                     whileHover={{ scale: 1.05 }}
                     className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 group-hover:border-blue-500 text-xs font-bold text-white transition-all"
                  >
                     {getInitials(user.displayName)}
                  </motion.div>
                )}
              </Link>
            ) : (
              <Link to="/login">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-slate-100 text-slate-900 px-5 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute left-4 right-4 top-24 glass-panel rounded-2xl p-4 shadow-xl z-50 flex flex-col space-y-2 border border-slate-700"
          >
            <Link to="/" onClick={() => setIsOpen(false)} className={`p-3 rounded-xl flex items-center gap-3 ${isActive('/') ? 'bg-slate-800 text-primary' : 'text-slate-300'}`}>
              <DollarSign size={20} /> Price Check
            </Link>
            <Link to="/chat" onClick={() => setIsOpen(false)} className={`p-3 rounded-xl flex items-center gap-3 ${isActive('/chat') ? 'bg-slate-800 text-primary' : 'text-slate-300'}`}>
              <MessageSquare size={20} /> AI Chat
            </Link>
            <Link to="/tools" onClick={() => setIsOpen(false)} className={`p-3 rounded-xl flex items-center gap-3 ${isActive('/tools') ? 'bg-slate-800 text-primary' : 'text-slate-300'}`}>
              <ImageIcon size={20} /> Tools
            </Link>
            {user && (
               <Link to="/profile" onClick={() => setIsOpen(false)} className="p-3 rounded-xl flex items-center gap-3 text-slate-300">
                  <UserIcon size={20} /> My Profile
               </Link>
            )}
            <div className="h-px bg-slate-700 my-2" />
            {user ? (
              <button onClick={() => { signOut(); setIsOpen(false); }} className="p-3 rounded-xl flex items-center gap-3 text-red-400 hover:bg-red-900/20">
                <LogOut size={20} /> Sign Out
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="bg-primary text-white p-3 rounded-xl text-center font-medium">
                Sign In
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
