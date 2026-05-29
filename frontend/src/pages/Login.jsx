import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Wrench, Shield, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authed, bounce directly to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const validateForm = () => {
    if (!email) {
      setMessage({ text: 'Please fill in your email address.', type: 'error' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ text: 'Please enter a valid email address form.', type: 'error' });
      return false;
    }
    if (!password) {
      setMessage({ text: 'Please provide a password.', type: 'error' });
      return false;
    }
    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return false;
    }
    if (!isLogin && !username.trim()) {
      setMessage({ text: 'Please define a username.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!validateForm()) return;

    setLoading(true);
    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { username: username.trim(), email, password };

    try {
      const response = await axios.post(url, payload);
      
      if (response.data.success) {
        // Save auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          _id: response.data._id,
          username: response.data.username,
          email: response.data.email
        }));

        setMessage({ text: `${isLogin ? 'Login' : 'Registration'} successful! Entering application...`, type: 'success' });
        
        setTimeout(() => {
          navigate('/');
          // Page reload or redirect is caught by react-router-dom
        }, 1200);
      } else {
        setMessage({ text: response.data.message || 'Operation failed.', type: 'error' });
      }
    } catch (error) {
      console.error('Authentication Error:', error);
      const errText = error.response?.data?.message || 'Server connection failed. Try again.';
      setMessage({ text: errText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-8">
      {/* Container Card */}
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-8 text-center text-white relative">
          <div className="inline-flex p-3 bg-white/15 rounded-xl mb-3 border border-white/20 shadow-md">
            <Wrench className="h-6 w-6 text-indigo-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SIMS Rwanda</h1>
          <p className="text-sm text-indigo-200 mt-1 font-medium">TSS National Practical Examination 24-25</p>
          <div className="absolute right-3 top-3 inline-flex items-center space-x-1 text-[10px] font-mono bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-800 text-indigo-300">
            <Shield className="h-3 w-3" />
            <span>SECURE JWT</span>
          </div>
        </div>

        {/* Form Body Context */}
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            {isLogin ? 'Sign In to Your Account' : 'Register New Staff Member'}
          </h2>

          {/* Feedback message banner */}
          {message.text && (
            <div className={`flex items-start space-x-2.5 p-3 rounded-lg text-sm mb-5 leading-snug border ${
              message.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input (Registration Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Staff Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>
              {isLogin && email === '' && (
                <p className="text-[10px] text-indigo-400 mt-1 font-mono">
                  Default Exam Sign In Profile: <strong className="font-sans">admin@gmail.com</strong>
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Password Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                />
              </div>
              {isLogin && password === '' && (
                <p className="text-[10px] text-indigo-400 mt-1 font-mono">
                  Default Password Key: <strong className="font-sans">Admin123@</strong>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg py-2.5 px-4 font-bold text-sm tracking-wide transition-colors mt-2 shadow-md flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Session...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In Now' : 'Register & Enter'}</span>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              {isLogin ? "Need a custom staff member account?" : "Already registered as representative?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage({ text: '', type: '' });
              }}
              className="mt-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
            >
              {isLogin ? 'Register New Staff Profile' : 'Sign In with Existing Credentials'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
