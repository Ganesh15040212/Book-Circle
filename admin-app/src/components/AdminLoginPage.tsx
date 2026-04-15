import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Shield, Eye, EyeOff, Lock, BookOpen, Fingerprint, ArrowRight, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { CaptchaWidget } from './CaptchaWidget';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminLoginPage: React.FC<{ onSetup?: () => void }> = ({ onSetup }) => {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaKey, setCaptchaKey] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Identity required');
            return;
        }
        if (!captchaToken) {
            toast.error('Security verification required');
            return;
        }
        setIsLoading(true);
        try {
            await login(email, password, captchaToken);
            toast.success('Access granted. Welcome back.');
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
            setCaptchaToken(null);
            setCaptchaKey(k => k + 1);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans selection:bg-indigo-100 italic-none">
            {/* Left Column: Brand/Visual */}
            <div className="hidden md:flex md:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20" />
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-lg text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-8"
                    >
                        <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6 mx-auto md:mx-0">
                            <BookOpen size={32} />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
                            Command the <span className="text-indigo-400">Inventory.</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            Access the professional control center for BookCircle. Monitor transactions, manage users, and curate the global library from one unified interface.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <p className="text-white font-black text-2xl">99.9%</p>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Uptime Strength</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <p className="text-white font-black text-2xl">256-bit</p>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Encrypted Auth</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#F8FAFC]">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-10 text-center md:text-left">
                        <div className="md:hidden inline-flex h-12 w-12 bg-indigo-600 rounded-xl items-center justify-center text-white mb-6">
                            <BookOpen size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Login</h2>
                        <p className="text-slate-500 font-medium">Verify your administrative identity to proceed.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                            <div className="group relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@bookcircle.com"
                                    className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="group relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-14 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-indigo-600" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Security Verification</span>
                            </div>
                            <CaptchaWidget
                                key={captchaKey}
                                onVerify={(token) => setCaptchaToken(token)}
                                theme="light"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !captchaToken}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${isLoading || !captchaToken
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:shadow-2xl hover:bg-slate-900 active:scale-[0.98]'
                                }`}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Authenticating
                                    </>
                                ) : (
                                    <>
                                        Access System <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-12 space-y-4">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 shrink-0 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <Fingerprint size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-indigo-600 leading-tight">
                                Access to this portal is logged. IP: 127.0.0.1 (DEV). System version 1.0.4-PRO.
                            </p>
                        </div>

                        {onSetup && (
                            <button
                                onClick={onSetup}
                                className="w-full text-center text-slate-400 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                                First time initialization? <span className="underline">Configure Admin Node</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
