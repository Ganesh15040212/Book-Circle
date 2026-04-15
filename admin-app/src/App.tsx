import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminPage } from './components/AdminPage';
import { AdminSetup } from './components/AdminSetup';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

type AdminView = 'login' | 'setup' | 'dashboard';

const AdminAppContent: React.FC = () => {

    const { user, isLoading } = useAuth();
    const [view, setView] = useState<AdminView>('login');

    useEffect(() => {
        if (!isLoading) {
            if (user?.isAdmin) {
                setView('dashboard');
            } else if (view !== 'setup') {
                setView('login');
            }
        }
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"
                />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Initializing System...</p>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {!user || !user.isAdmin ? (
                view === 'setup' ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <AdminSetup onSwitchToLogin={() => setView('login')} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <AdminLoginPage onSetup={() => setView('setup')} />
                    </motion.div>
                )
            ) : (
                <motion.div
                    key="admin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-screen"
                >
                    <AdminPage />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default function AdminApp() {
    return (
        <AuthProvider>
            <AdminAppContent />
            <Toaster richColors position="top-right" />
        </AuthProvider>
    );
}
