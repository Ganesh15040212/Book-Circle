import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Info, ArrowLeft, ShieldCheck, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { CaptchaWidget } from './CaptchaWidget';
import { apiFetch } from '../api';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

type Step = 'form' | 'otp';

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  // Step tracking
  const [step, setStep] = useState<Step>('form');
  const [captchaKey, setCaptchaKey] = useState(0); // Reset captcha key

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // OTP step
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength helper
  const getPasswordStrength = (pw: string) => {
    if (!pw) return null;
    const checks = [
      pw.length >= 8,
      /[A-Z]/.test(pw),
      /[a-z]/.test(pw),
      /[0-9]/.test(pw),
      /[\W_]/.test(pw),
    ];
    const score = checks.filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (score === 3) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500', width: '80%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };
  const strength = getPasswordStrength(password);

  // Start resend countdown
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Validate form and send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!captchaToken) {
      toast.error('Please complete the security check');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await apiFetch('/auth/send_otp.php', {
        method: 'POST',
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      toast.success('Verification code sent to your email! Check your inbox.');
      setStep('otp');
      startResendTimer();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsSendingOtp(true);
    try {
      const res = await apiFetch('/auth/send_otp.php', {
        method: 'POST',
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      toast.success('New verification code sent to your email!');
      startResendTimer();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP then complete registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      // Verify OTP
      const verifyRes = await apiFetch('/auth/verify_otp.php', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'OTP verification failed');

      const resolvedOtpToken = verifyData.otpToken;

      // Complete registration
      setIsLoading(true);
      await register(name, email, phone, password, captchaToken!, resolvedOtpToken);
      toast.success('Account created successfully! Welcome to BookCircle 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Join BookCircle</CardTitle>
          <CardDescription>Create your account to start sharing books</CardDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${step === 'form' ? 'bg-indigo-600 text-white' : 'bg-green-100 text-green-700'}`}>
              {step === 'otp' ? <ShieldCheck className="w-3 h-3" /> : null}
              Step 1: Details
            </div>
            <div className="h-px w-6 bg-gray-300" />
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${step === 'otp' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              Step 2: Verify Email
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'form' ? (
            /* ── STEP 1: Fill in details ── */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </span>
                </Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210"
                  value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" placeholder="Min 8 chars, uppercase, number, symbol"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                {/* Strength bar */}
                {strength && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                    </div>
                    <p className={`text-xs font-medium ${strength.color.replace('bg-', 'text-').replace('-500', '-600')}`}>
                      Password strength: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Custom CAPTCHA */}
              <CaptchaWidget
                key={captchaKey}
                onVerify={(token) => setCaptchaToken(token)}
                theme="light"
              />

              <Button type="submit" className="w-full" disabled={isSendingOtp || !captchaToken}>
                {isSendingOtp ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Sending Code…</span>
                ) : (
                  <span className="flex items-center gap-2">✉️ Send Verification Code to Email</span>
                )}
              </Button>
            </form>
          ) : (
            /* ── STEP 2: OTP verification ── */
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to details
              </button>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-indigo-800">
                    <p className="font-semibold">Check your email!</p>
                    <p>A 6-digit verification code was sent to <strong>{email}</strong>. Enter it below to complete registration.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isVerifying || isLoading || otp.length !== 6}
              >
                {isVerifying || isLoading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⟳</span> Verifying…</span>
                ) : (
                  <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verify & Create Account</span>
                )}
              </Button>

              {/* Resend */}
              <p className="text-center text-sm text-gray-600">
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span className="text-gray-400">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSendingOtp}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {isSendingOtp ? 'Sending…' : 'Resend Code'}
                  </button>
                )}
              </p>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <button onClick={onSwitchToLogin} className="text-indigo-600 hover:underline font-medium">
              Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
