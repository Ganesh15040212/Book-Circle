import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';

interface FeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const categories = ['UI/UX', 'Performance', 'Bug', 'Feature Request', 'Other'];

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [category, setCategory] = useState('UI/UX');
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        if (!message.trim()) {
            toast.error('Please enter your feedback');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiFetch('/feedbacks/submit.php', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    email,
                    rating,
                    category,
                    message
                })
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                    resetForm();
                }, 2000);
            } else {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    toast.error(data.error || 'Failed to submit feedback');
                } catch (e) {
                    console.error('Non-JSON error response:', text);
                    toast.error(`System error (${response.status}). Please try again later.`);
                }
            }
        } catch (error: any) {
            console.error('Feedback Submit Error:', error);
            toast.error('Connection failed. Please check your internet.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setHoverRating(0);
        setCategory('UI/UX');
        setMessage('');
        setName('');
        setEmail('');
        setIsSuccess(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {isSuccess ? (
                            <div className="p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                                >
                                    <CheckCircle2 size={40} />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                                <p className="text-gray-500">Your feedback helps us make BookCircle better.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">Share Feedback</h3>
                                            <p className="text-xs text-gray-500 font-medium tracking-tight">Help us improve your experience</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    {/* Rating */}
                                    <div className="text-center space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-sm font-bold text-gray-700 uppercase tracking-widest">Rate your experience</p>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                    className="p-1 focus:outline-none transition-transform active:scale-90"
                                                >
                                                    <Star
                                                        size={32}
                                                        className={`transition-colors ${
                                                            star <= (hoverRating || rating)
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name (Optional)</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setCategory(cat)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                        category === cat
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Feedback</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all resize-none"
                                            placeholder="Tell us what's on your mind..."
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Submit Feedback
                                                <Send size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
