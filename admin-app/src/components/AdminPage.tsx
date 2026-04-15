import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../api';
import { toast } from 'sonner';
import {
    Users, Book, BarChart3, Settings, LogOut, Search,
    Trash2, ShieldAlert, ShieldCheck, Mail, Phone,
    Calendar, ArrowUpRight, ArrowDownRight, MoreVertical,
    Filter, Download, ChevronRight, LayoutDashboard,
    Archive, Clock, AlertCircle, CheckCircle2, User, MessageSquare, Shield, Menu, X, BookOpen
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminUser {
    id: string; name: string; email: string; phone: string;
    isAdmin: boolean; blocked: boolean; createdAt: string;
}

interface BookEntity {
    id: string; title: string; author: string; category: string;
    bookType: string; price: number; status: string;
    ownerId: string; ownerName: string; createdAt: string;
}

interface Request {
    id: string; status: string; createdAt: string;
    bookTitle: string; bookAuthor: string;
    requesterName: string; requesterEmail: string;
    ownerName: string; ownerEmail: string;
}

interface Stats {
    totalUsers: number; totalBooks: number;
    totalRequests: number; pending: number;
}

interface Verification {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    library_name: string;
    library_address: string;
    details: string;
    images: string[];
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

type Tab = 'dashboard' | 'users' | 'books' | 'requests' | 'feedback' | 'verifications';

export const AdminPage: React.FC = () => {
    const { user, accessToken, logout } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [books, setBooks] = useState<BookEntity[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalBooks: 0, totalRequests: 0, pending: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Selection for bulk actions/confirmations
    const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (user?.isAdmin) {
            fetchAdminData();
            interval = setInterval(() => {
                fetchAdminData(true);
            }, 5000); // 5s live updates
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [user]);

    const fetchAdminData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [uRes, bRes, rRes, fRes, vRes] = await Promise.all([
                apiFetch('/admin/users.php', {}, accessToken),
                apiFetch('/admin/books.php', {}, accessToken),
                apiFetch('/admin/requests.php', {}, accessToken),
                apiFetch('/admin/feedbacks.php', {}, accessToken),
                apiFetch('/admin/verifications.php', {}, accessToken),
            ]);

            const parseJson = async (res: Response, name: string) => {
                try {
                    const data = await res.json();
                    if (!res.ok) {
                        console.error(`API Error (${name}):`, data.error || 'Unknown error');
                        return { error: data.error || `HTTP ${res.status}`, data: null };
                    }
                    return { error: null, data };
                } catch (e) {
                    console.error(`JSON Parse Error (${name}):`, e);
                    return { error: `Failed to parse ${res.status} response as JSON`, data: null };
                }
            };

            const [uResData, bResData, rResData, fResData, vResData] = await Promise.all([
                parseJson(uRes, 'users'),
                parseJson(bRes, 'books'),
                parseJson(rRes, 'requests'),
                parseJson(fRes, 'feedbacks'),
                parseJson(vRes, 'verifications'),
            ]);

            if (!uResData.error && uResData.data) {
                setUsers(uResData.data.users || []);
                if (uResData.data.stats) setStats(uResData.data.stats);
            }
            if (!bResData.error && bResData.data) setBooks(bResData.data.books || []);
            if (!rResData.error && rResData.data) setRequests(rResData.data.requests || []);
            if (!fResData.error && fResData.data) setFeedbacks(fResData.data.feedbacks || []);
            if (!vResData.error && vResData.data) setVerifications(vResData.data.verifications || []);

            // If any critical ones failed, show a general warning but don't crash everything
            if (uResData.error || bResData.error || rResData.error) {
                const firstError = uResData.error || bResData.error || rResData.error;
                toast.error(`Some system data failed to load: ${firstError}`);
            }
            
            if (fResData.error) {
                console.warn('Feedback data failed to load:', fResData.error);
            }

        } catch (err: any) {
            console.error('System Load Error:', err);
            if (!silent) toast.error('Connection failed. Please check your network.');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleDeleteBook = async (bookId: string) => {
        setConfirmDeleteOpen(false);
        const loadingToast = toast.loading('Removing book from system...');
        try {
            const res = await apiFetch(`/admin/delete_book.php?id=${bookId}`, {
                method: 'DELETE',
            }, accessToken);

            const data = await res.json();

            toast.dismiss(loadingToast);
            if (!res.ok) throw new Error(data.error || 'Failed to delete book');
            toast.success('Book removed from system');
            setDeleteBookId(null);
            fetchAdminData();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message);
        }
    };

    const handleBlockUser = async (userId: string, blocked: boolean) => {
        const loadingToast = toast.loading(`${blocked ? 'Blocking' : 'Unblocking'} user...`);
        try {
            const res = await apiFetch(`/admin/block_user.php?id=${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ blocked }),
            }, accessToken);
            const data = await res.json();
            toast.dismiss(loadingToast);
            if (!res.ok) throw new Error(data.error || 'Failed to update user');
            toast.success(`User ${blocked ? 'is now restricted' : 'is now active'}`);
            fetchAdminData();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message);
        }
    };

    const filteredRequests = useMemo(() =>
        requests.filter(r =>
            r.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [requests, searchQuery]
    );

    const handleRequestUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
        const loadingToast = toast.loading(`${status === 'approved' ? 'Approving' : 'Declining'} request...`);
        try {
            const res = await apiFetch(`/admin/update_request.php?id=${requestId}`, {
                method: 'POST',
                body: JSON.stringify({ status })
            }, accessToken);

            const data = await res.json();
            toast.dismiss(loadingToast);
            if (!res.ok) throw new Error(data.error || 'Failed to update request');
            toast.success(`Request ${status} by Administrator`);
            fetchAdminData();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message);
        }
    };

    const handleRequestDelete = async (requestId: string) => {
        const loadingToast = toast.loading('Purging request from history...');
        try {
            const res = await apiFetch(`/admin/delete_request.php?id=${requestId}`, {
                method: 'DELETE',
            }, accessToken);

            const data = await res.json();
            toast.dismiss(loadingToast);
            if (!res.ok) throw new Error(data.error || 'Failed to delete request');
            toast.success('Request purged successfully');
            fetchAdminData();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message);
        }
    };

    const filteredVerifications = useMemo(() =>
        verifications.filter(v =>
            v.library_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.user_name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [verifications, searchQuery]
    );

    const handleVerificationUpdate = async (id: string, status: 'approved' | 'rejected') => {
        const loadingToast = toast.loading(`Marking verification as ${status}...`);
        try {
            const res = await apiFetch(`/admin/update_verification.php`, {
                method: 'POST',
                body: JSON.stringify({ id, status })
            }, accessToken);

            const data = await res.json();
            toast.dismiss(loadingToast);
            if (!res.ok) throw new Error(data.error || 'Failed to update verification');
            toast.success(`Verification ${status} successfully`);
            fetchAdminData();
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message);
        }
    };

    const handleDeleteVerification = async (id: string) => {
        if (!confirm('Are you sure you want to delete this verification record?')) return;
        const loadingToast = toast.loading('Deleting verification...');
        try {
            const res = await apiFetch(`/admin/delete_verification.php?id=${id}`, {
                method: 'DELETE'
            }, accessToken);

            const data = await res.json();
            toast.dismiss(loadingToast);
            if (!res.ok) throw new Error(data.error || 'Failed to delete verification');
            toast.success('Verification deleted successfully');
            fetchAdminData(true);
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message);
        }
    };

    // Filtered data for view
    const filteredUsers = useMemo(() =>
        users.filter(u => !u.isAdmin && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))),
        [users, searchQuery]
    );

    const filteredBooks = useMemo(() =>
        books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())),
        [books, searchQuery]
    );

    // Mock data for charts (based on real stats)
    const chartData = [
        { name: 'Mon', users: Math.floor(stats.totalUsers * 0.4), books: Math.floor(stats.totalBooks * 0.3) },
        { name: 'Tue', users: Math.floor(stats.totalUsers * 0.5), books: Math.floor(stats.totalBooks * 0.4) },
        { name: 'Wed', users: Math.floor(stats.totalUsers * 0.6), books: Math.floor(stats.totalBooks * 0.5) },
        { name: 'Thu', users: Math.floor(stats.totalUsers * 0.7), books: Math.floor(stats.totalBooks * 0.6) },
        { name: 'Fri', users: Math.floor(stats.totalUsers * 0.8), books: Math.floor(stats.totalBooks * 0.8) },
        { name: 'Sat', users: Math.floor(stats.totalUsers * 0.9), books: Math.floor(stats.totalBooks * 0.9) },
        { name: 'Sun', users: stats.totalUsers, books: stats.totalBooks },
    ];

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
                />
                <p className="text-slate-500 font-medium animate-pulse">Syncing system data...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 w-72 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
                <div className="p-8 pb-4 relative">
                    <button className="lg:hidden absolute top-6 right-6 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl tracking-tight">BookCircle</h2>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] leading-none">Command Center</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <SidebarItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
                        <SidebarItem active={activeTab === 'users'} icon={<Users size={20} />} label="User Registry" onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }} />
                        <SidebarItem active={activeTab === 'books'} icon={<Book size={20} />} label="Global Library" onClick={() => { setActiveTab('books'); setIsSidebarOpen(false); }} />
                        <SidebarItem active={activeTab === 'requests'} icon={<BarChart3 size={20} />} label="Book Flows" onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }} />
                        <SidebarItem active={activeTab === 'verifications'} icon={<Shield size={20} />} label="Verifications" onClick={() => { setActiveTab('verifications'); setIsSidebarOpen(false); }} />
                        <SidebarItem active={activeTab === 'feedback'} icon={<MessageSquare size={20} />} label="User Feedback" onClick={() => { setActiveTab('feedback'); setIsSidebarOpen(false); }} />
                    </nav>
                </div>

                <div className="mt-auto p-8 pt-0">
                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                {user?.name.charAt(0)}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-black truncate">{user?.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate">System Admin</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                        >
                            <LogOut size={14} />
                            Exit Panel
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between z-10 sticky top-0">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                        <button className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 flex-shrink-0" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex h-10 w-10 bg-slate-100 rounded-xl items-center justify-center text-slate-400 flex-shrink-0">
                            <Search size={20} />
                        </div>
                        <div className="relative flex-1 max-w-sm">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:hidden" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                className="w-full bg-slate-50 sm:bg-transparent border-none focus:ring-4 focus:ring-indigo-100 rounded-xl sm:rounded-none h-10 sm:h-auto pl-10 sm:pl-0 text-sm font-bold placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Verified Secure</span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scroll Area */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'dashboard' && (
                                <div className="space-y-8">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard icon={<Users className="text-indigo-600" />} label="Total Users" value={stats.totalUsers} trend="+12%" />
                                        <StatCard icon={<Book className="text-emerald-600" />} label="Active Books" value={stats.totalBooks} trend="+5%" />
                                        <StatCard icon={<BarChart3 className="text-orange-600" />} label="Total Trans" value={stats.totalRequests} trend="+18%" />
                                        <StatCard icon={<Clock className="text-red-600" />} label="Pending" value={stats.pending} trend="-2%" />
                                    </div>

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900">Platform Growth</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last 7 Days Activity</p>
                                                </div>
                                                <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Filter size={18} />
                                                </div>
                                            </div>
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData}>
                                                        <defs>
                                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                                                            itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                                                        />
                                                        <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900">Inventory Status</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Book Flow Distribution</p>
                                                </div>
                                                <button className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider">
                                                    Show All <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                        <Tooltip
                                                            cursor={{ fill: '#f8fafc' }}
                                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Bar dataKey="books" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={32}>
                                                            {chartData.map((_entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#f43f5e'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <UsersView users={filteredUsers} onBlock={handleBlockUser} />
                            )}

                            {activeTab === 'books' && (
                                <BooksView
                                    books={filteredBooks}
                                    onDelete={(id) => {
                                        setDeleteBookId(id);
                                        setConfirmDeleteOpen(true);
                                    }}
                                />
                            )}

                            {activeTab === 'requests' && (
                                <RequestsView requests={filteredRequests} onDelete={handleRequestDelete} onUpdate={handleRequestUpdate} />
                            )}

                            {activeTab === 'feedback' && (
                                <FeedbackView feedbacks={feedbacks} />
                            )}

                            {activeTab === 'verifications' && (
                                <VerificationsView verifications={filteredVerifications} onUpdate={handleVerificationUpdate} onDelete={handleDeleteVerification} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
                {confirmDeleteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmDeleteOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center"
                        >
                            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-100/50">
                                <Trash2 size={40} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Erase Book?</h3>
                            <p className="text-slate-500 font-bold mb-10 leading-relaxed px-4 text-sm">
                                This action is permanent. The book and its data will be completely removed from our records.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmDeleteOpen(false)}
                                    className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={() => deleteBookId && handleDeleteBook(deleteBookId)}
                                    className="flex-1 py-4 px-6 bg-red-600 text-white rounded-2xl text-xs font-black hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100 uppercase tracking-widest"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components
const SidebarItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
    >
        <div className={`transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}>
            {icon}
        </div>
        <span className="tracking-tight">{label}</span>
    </button>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; trend: string }> = ({ icon, label, value, trend }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {trend}
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</h4>
            <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className="absolute top-0 right-0 h-24 w-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
    </div>
);

const UsersView: React.FC<{ users: AdminUser[]; onBlock: (id: string, block: boolean) => void }> = ({ users, onBlock }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-slate-50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identified User</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Address</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Control</th>
                </tr>
            </thead>
            <tbody>
                {users.map((u, idx) => (
                    <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                    >
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                    {u.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">{u.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 leading-none">ID #{u.id}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-600">{u.email}</p>
                        </td>
                        <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-6">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${u.blocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                {u.blocked ? 'Restricted' : 'Active'}
                            </span>
                        </td>
                        <td className="px-8 py-6">
                            <button
                                onClick={() => onBlock(u.id, !u.blocked)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 ${u.blocked ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-900 text-white shadow-lg shadow-slate-100'
                                    }`}
                            >
                                {u.blocked ? 'Restore Access' : 'Restrict'}
                            </button>
                        </td>
                    </motion.tr>
                ))}
            </tbody>
        </table>
    </div>
);

const BooksView: React.FC<{ books: BookEntity[]; onDelete: (id: string) => void }> = ({ books, onDelete }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {books.map(book => (
            <div key={book.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${book.bookType === 'rent' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                {book.bookType}
                            </span>
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${book.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                {book.status}
                            </span>
                        </div>
                        <h4 className="font-extrabold text-lg leading-tight truncate w-48 group-hover:text-indigo-600 transition-colors">{book.title}</h4>
                        <p className="text-xs font-bold text-slate-400 tracking-tight">by {book.author}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-slate-900">₹{book.price}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{book.category}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            <User size={14} />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Owner</p>
                            <p className="text-xs font-extrabold truncate">{book.ownerName}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(book.createdAt).toLocaleDateString()}
                    </p>
                    <button
                        onClick={() => onDelete(book.id)}
                        className="h-10 w-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all hover:scale-110 shadow-sm"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Background Decor - pointer-events-none prevents it from blocking the delete button */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        ))}
    </div>
);

const RequestsView: React.FC<{ requests: Request[]; onDelete: (id: string) => void; onUpdate: (id: string, status: 'approved' | 'rejected') => void }> = ({ requests, onDelete, onUpdate }) => (
    <div className="space-y-4">
        {requests.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
                <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No Active Flows</h3>
                <p className="text-slate-400 font-bold text-sm">Either no requests match your search or the system is idle.</p>
            </div>
        ) : (
            requests.map((req, idx) => (
                <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-6 flex-1">
                        <div className={`h-16 w-16 shrink-0 rounded-[1.25rem] flex items-center justify-center border-4 border-white shadow-xl ${req.status === 'approved' ? 'bg-emerald-500 text-white' :
                            req.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                            }`}>
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-extrabold text-lg text-slate-900">{req.bookTitle}</h4>
                                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                    req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                    }`}>{req.status}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 italic mb-3">"{req.bookAuthor}"</p>

                            <div className="flex flex-wrap gap-x-8 gap-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Requester</p>
                                        <p className="text-xs font-extrabold">{req.requesterName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Source (Owner)</p>
                                        <p className="text-xs font-extrabold">{req.ownerName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-2 px-6 bg-slate-50 rounded-2xl w-full md:w-auto self-stretch">
                        <div className="text-right flex-1 md:flex-none">
                            <p className="text-[10px] font-black text-slate-400 uppercase text-center md:text-right">Transaction Date</p>
                            <p className="text-xs font-black text-slate-900 text-center md:text-right">
                                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-slate-200 hidden md:block" />

                        {req.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onUpdate(req.id, 'rejected')}
                                    className="h-10 px-4 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => onUpdate(req.id, 'approved')}
                                    className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center"
                                >
                                    Approve
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => onDelete(req.id)}
                                className="hidden group-hover:flex h-10 w-10 items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Purge Request"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </motion.div>
            ))
        )}
    </div>
);

const FeedbackView: React.FC<{ feedbacks: any[] }> = ({ feedbacks }) => (
    <div className="space-y-6">
        {feedbacks.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
                <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No Feedback Yet</h3>
                <p className="text-slate-400 font-bold text-sm">Feedback from users will appear here once submitted.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbacks.map((f, idx) => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={14}
                                        className={star <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                    />
                                ))}
                            </div>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-full">
                                {f.category}
                            </span>
                        </div>

                        <p className="text-sm font-medium text-slate-700 mb-6 leading-relaxed">
                            "{f.message}"
                        </p>

                        <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                {(f.registered_user_name || f.name || 'U').charAt(0)}
                            </div>
                            <div className="truncate">
                                <p className="text-xs font-black truncate">{f.registered_user_name || f.name || 'Anonymous'}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate">
                                    {f.email || (f.registered_user_name ? 'Registered User' : 'Guest')}
                                </p>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300">
                            {new Date(f.created_at).toLocaleDateString()}
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
);

const Star: React.FC<{ size: number, className: string }> = ({ size, className }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const VerificationsView: React.FC<{ verifications: Verification[]; onUpdate: (id: string, status: 'approved' | 'rejected') => void; onDelete: (id: string) => void }> = ({ verifications, onUpdate, onDelete }) => (
    <div className="space-y-6">
        {verifications.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center">
                <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Shield size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No Verification Requests</h3>
                <p className="text-slate-400 font-bold text-sm">All library verification requests have been handled.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {verifications.map((v, idx) => (
                    <motion.div
                        key={v.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                    >
                        <div className="flex justify-between items-start gap-3 mb-4 flex-wrap sm:flex-nowrap">
                            <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-lg text-slate-900 truncate break-words whitespace-normal">{v.library_name}</h4>
                                <p className="text-xs font-bold text-slate-400 mt-0.5 leading-relaxed">{v.library_address}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                                    v.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                    v.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                }`}>{v.status}</span>
                                <button onClick={() => onDelete(v.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete record">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl mb-4">
                            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <User size={14} />
                            </div>
                            <div className="truncate flex-1 min-w-0">
                                <p className="text-xs font-extrabold truncate">{v.user_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate">{v.user_email}</p>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 whitespace-nowrap flex-shrink-0">
                                {new Date(v.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {v.details && (
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl mb-4 italic">
                                "{v.details}"
                            </p>
                        )}

                        {v.images && v.images.length > 0 && (
                            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar snap-x">
                                {v.images.map((img, i) => (
                                    <div key={i} className="h-28 w-40 sm:h-32 sm:w-48 flex-shrink-0 snap-center rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                                        <img src={img} alt="Verification proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer" onClick={() => window.open(img, '_blank')} />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {v.status === 'pending' && (
                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => onUpdate(v.id, 'rejected')}
                                    className="flex-1 py-3 px-4 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => onUpdate(v.id, 'approved')}
                                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                >
                                    Approve Library
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        )}
    </div>
);
