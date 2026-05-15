import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, ArrowLeft, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';
import { toast } from 'sonner';
import { CaptchaWidget } from './CaptchaWidget';

interface ForgotPasswordPageProps {
    onBackToLogin: () => void;
}

type Step = 'request' | 'verify' | 'reset' | 'success';

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
    const [step, setStep] = useState<Step>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [captchaKey, setCaptchaKey] = useState(0);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captchaToken) {
            toast.error('Please complete the security check');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiFetch('/auth/forgot_password.php', {
                method: 'POST',
                body: JSON.stringify({ email, captchaToken }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

            toast.success(data.message);
            setStep('verify');
        } catch (error: any) {
            toast.error(error.message);
            setCaptchaKey(k => k + 1);
            setCaptchaToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiFetch('/auth/verify_otp.php', {
                method: 'POST',
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid OTP');

            setOtpToken(data.otpToken);
            setStep('reset');
            toast.success('Identity verified!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiFetch('/auth/reset_password.php', {
                method: 'POST',
                body: JSON.stringify({ email, otpToken, password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            toast.success('Password reset successful!');
            setStep('success');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900">
                        {step === 'request' && 'Forgot Password?'}
                        {step === 'verify' && 'Verify Identity'}
                        {step === 'reset' && 'New Password'}
                        {step === 'success' && 'All Set!'}
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                        {step === 'request' && "No worries! Enter your email to get a reset code."}
                        {step === 'verify' && `We've sent a 6-digit code to ${email}`}
                        {step === 'reset' && "Almost there! Choose a strong new password."}
                        {step === 'success' && "Your password has been updated successfully."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {step === 'request' && (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <CaptchaWidget
                                key={captchaKey}
                                onVerify={(token) => setCaptchaToken(token)}
                            />

                            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" disabled={isLoading || !captchaToken}>
                                {isLoading ? 'Sending Code...' : 'Send Reset Code'}
                            </Button>
                        </form>
                    )}

                    {step === 'verify' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="space-y-2 text-center">
                                <Label htmlFor="otp" className="text-xs font-black uppercase tracking-widest text-slate-400">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    className="text-center text-3xl font-black tracking-[0.5em] h-16 rounded-2xl border-slate-200"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </Button>
                            
                            <button 
                                type="button" 
                                onClick={() => setStep('request')} 
                                className="w-full text-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                Didn't get a code? Try again
                            </button>
                        </form>
                    )}

                    {step === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-widest text-slate-400">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-12 rounded-xl border-slate-200"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-xs font-black uppercase tracking-widest text-slate-400">Confirm Password</Label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-12 rounded-xl border-slate-200"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold" disabled={isLoading}>
                                {isLoading ? 'Updating Password...' : 'Reset Password'}
                            </Button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="py-6 text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="bg-emerald-100 p-4 rounded-full">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                                </div>
                            </div>
                            <Button onClick={onBackToLogin} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold">
                                Back to Login
                            </Button>
                        </div>
                    )}

                    {step !== 'success' && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <button
                                onClick={onBackToLogin}
                                className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span>Return to Login</span>
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
