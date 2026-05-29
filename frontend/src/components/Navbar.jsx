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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Spare Parts', path: '/spareparts', icon: Wrench },
    { name: 'Stock In', path: '/stockin', icon: ArrowDownLeft },
    { name: 'Stock Out', path: '/stockout', icon: ArrowUpRight },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-indigo-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Wrench className="h-6 w-6 text-indigo-200" />
              </div>
              <span>SIMS Rwanda</span>
            </Link>
          </div>

          {/* Desktop Navigation Link Items */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navLinks.map((link) => {
              const IconComp = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-indigo-700 text-white border-b-2 border-indigo-200'
                      : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User profile & Logout Trigger */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-indigo-950 px-3 py-1.5 rounded-lg border border-indigo-800">
              <div className="p-1 bg-indigo-800 rounded-full">
                <User className="h-4 w-4 text-indigo-200" />
              </div>
              <div className="text-left leading-none">
                <p className="text-xs font-semibold">{user.username}</p>
                {user.email && <p className="text-[10px] text-indigo-300 font-mono">{user.email}</p>}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-indigo-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel Drawer */}
      {isOpen && (
        <div className="md:hidden bg-indigo-950 border-t border-indigo-800 px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const IconComp = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-indigo-800 text-white font-bold'
                    : 'text-indigo-200 hover:bg-indigo-900 hover:text-white'
                }`}
              >
                <IconComp className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-indigo-900 px-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-800 rounded-full text-indigo-200">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{user.username}</p>
                <p className="text-xs text-indigo-300 font-mono leading-none">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-bold transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
