import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wrench, 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileSpreadsheet, 
  LogOut, 
  Menu, 
  X, 
  User 
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'Staff', email: '' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Oversight Panel', path: '/', icon: LayoutDashboard },
    { name: 'Spare Parts Catalog', path: '/spareparts', icon: Wrench },
    { name: 'Stock-In Entry', path: '/stockin', icon: ArrowDownLeft },
    { name: 'Stock-Out Slip', path: '/stockout', icon: ArrowUpRight },
    { name: 'Audit Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const isActive = (path) => location.pathname === path;

  // Generate User Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="p-1.5 bg-gradient-to-tr from-indigo-500/10 to-sky-500/10 border border-slate-800 rounded-xl transition-all group-hover:scale-105 group-hover:border-indigo-500/30">
                <Wrench className="h-5 w-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-base font-black tracking-wider uppercase text-slate-100 group-hover:text-white transition-colors bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
                SIMS Rwanda
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const IconComp = link.icon;
              const linkActive = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    linkActive
                      ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]'
                      : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <IconComp className={`h-4.5 w-4.5 ${linkActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile & Sign Out option */}
          <div className="hidden md:flex items-center space-x-3.5">
            <div className="flex items-center space-x-3 bg-slate-900/50 border border-slate-800/80 pl-2.5 pr-3.5 py-1.5 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-xs select-none shadow-md">
                {getInitials(user.username)}
              </div>
              <div className="text-left leading-none">
                <p className="text-xs font-black text-slate-100">{user.username}</p>
                {user.email && (
                  <p className="text-[9px] text-indigo-400 mt-0.5 font-mono max-w-[120px] truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Exit Portal</span>
            </button>
          </div>

          {/* Mobile Hamburg Trigger icon */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition-all border border-transparent hover:border-slate-800"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu Panel */}
      {isOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-900 px-3 pt-2 pb-5 space-y-1.5 animate-fadeIn">
          {navLinks.map((link) => {
            const IconComp = link.icon;
            const linkActive = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  linkActive
                    ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 border border-transparent hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <IconComp className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-900 px-3">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
                {getInitials(user.username)}
              </div>
              <div>
                <p className="text-xs font-black text-white leading-tight">{user.username}</p>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5 leading-none">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-rose-950/20 border border-rose-500/20 text-rose-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
