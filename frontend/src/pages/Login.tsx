import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial entry animation for the "landing" loading screen
    const timer = setTimeout(() => {
      setShowEntryAnimation(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;
      
      login(user, token, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Artificial delay for smooth transition animation
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (showEntryAnimation) {
    return (
      <div className="min-h-screen bg-[#020813] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-watermark-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        
        <div className="relative z-10 flex flex-col items-center animate-bounce-slow">
          <div className="w-24 h-24 bg-white/10 p-4 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl mb-6">
            <img src="/src/assets/logo.jpg" alt="Watermark Logo" className="w-full h-full object-cover rounded-full mix-blend-screen" />
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-watermark-blue-200 to-white tracking-widest uppercase mb-4">
            Watermark Supermarket
          </h1>
          <div className="flex items-center gap-3 text-watermark-blue-300">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm tracking-widest uppercase">Initializing System...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020813] flex items-center justify-center relative overflow-hidden p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-watermark-blue-900/40 via-[#020813] to-[#020813]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-watermark-blue-600/10 rounded-full blur-[120px] opacity-50 animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Glassmorphism Card */}
        <div className="bg-[#071c35]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 mx-auto rounded-2xl p-3 border border-white/10 shadow-xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <img src="/src/assets/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System Login</h2>
            <p className="text-watermark-blue-300 text-sm">Secure access to Madison88 Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-watermark-blue-200 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-watermark-blue-400 group-focus-within:text-white transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a2342]/50 border border-white/10 text-white placeholder-white/30 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-watermark-blue-400/50 focus:border-watermark-blue-400/50 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-watermark-blue-200 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-watermark-blue-400 group-focus-within:text-white transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a2342]/50 border border-white/10 text-white placeholder-white/30 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-watermark-blue-400/50 focus:border-watermark-blue-400/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#1a5b9c] to-[#0d3a66] hover:from-[#2272c2] hover:to-[#124d88] text-white font-medium rounded-xl py-3.5 px-4 shadow-[0_0_20px_rgba(26,91,156,0.3)] hover:shadow-[0_0_25px_rgba(26,91,156,0.5)] transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Access Dashboard
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">
              Authorized Personnel Only &bull; Watermark Supermarket
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
