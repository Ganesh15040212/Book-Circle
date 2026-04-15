import React, { useState } from 'react';
import { apiFetch } from '../api';
import { Shield, AlertCircle, User, Mail, Phone, Lock, Key, ArrowLeft, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AdminSetupProps {
    onSwitchToLogin: () => void;
}

export const AdminSetup: React.FC<AdminSetupProps> = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', secretKey: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.secretKey) {
            toast.error('All authentication parameters are required');
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiFetch('/admin/create_admin.php', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Identity creation failed');
            toast.success('Root Admin Provisioned Successfully');
            onSwitchToLogin();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans italic-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.05),transparent_50%)]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full" />
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">System Initialization</h1>
                                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Global Admin Provisioning</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-[1.25rem] flex gap-4">
                            <div className="h-10 w-10 shrink-0 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                                <Key size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-yellow-700 uppercase tracking-widest mb-1 leading-none">Environment Secret</p>
                                <p className="text-sm font-bold text-yellow-900 tracking-tight">
                                    Required Key: <code className="bg-yellow-500/10 px-2 py-0.5 rounded font-black text-yellow-600">bookcircle-admin-2026</code>
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FieldGroup id="name" label="Full Name" icon={<User size={18} />} value={formData.name} placeholder="Root Administrator"
                                    onChange={v => setFormData({ ...formData, name: v })} />

                                <FieldGroup id="email" label="Admin Email" icon={<Mail size={18} />} value={formData.email} placeholder="admin@domain.com" type="email"
                                    onChange={v => setFormData({ ...formData, email: v })} />

                                <FieldGroup id="phone" label="Mobile Number" icon={<Phone size={18} />} value={formData.phone} placeholder="+91 00000 00000"
                                    onChange={v => setFormData({ ...formData, phone: v })} />

                                <FieldGroup id="password" label="System Password" icon={<Lock size={18} />} value={formData.password} placeholder="••••••••" type="password"
                                    onChange={v => setFormData({ ...formData, password: v })} />
                            </div>

                            <FieldGroup id="secret" label="Provisioning Key" icon={<Terminal size={18} />} value={formData.secretKey} placeholder="Enter secret key"
                                onChange={v => setFormData({ ...formData, secretKey: v })} full />

                            <div className="pt-4 flex flex-col md:flex-row gap-4 items-center">
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="order-2 md:order-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <ArrowLeft size={14} /> Back to Login
                                </button>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`order-1 md:order-2 flex-1 md:flex-none ml-auto px-10 py-4 bg-indigo-600 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 ${isLoading ? 'animate-pulse' : ''}`}
                                >
                                    {isLoading ? 'Processing' : 'Initialize Node'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] mt-8">
                    Secure Initialization Layer · Port 5174 · TLS Active
                </p>
            </motion.div>
        </div>
    );
};

const FieldGroup: React.FC<{ id: string; label: string; icon: React.ReactNode; value: string; placeholder: string; onChange: (v: string) => void; type?: string; full?: boolean }> = ({ id, label, icon, value, placeholder, onChange, type = 'text', full = false }) => (
    <div className={`space-y-2 ${full ? 'col-span-1 md:col-span-2' : ''}`}>
        <label htmlFor={id} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                {icon}
            </div>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 transition-all outline-none"
            />
        </div>
    </div>
);
