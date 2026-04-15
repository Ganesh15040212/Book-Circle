import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface CaptchaWidgetProps {
    onVerify: (token: string | null) => void;
    theme?: 'light' | 'dark';
}

// Characters that are easy to distinguish (no 0/O, 1/l/I confusion)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const generateCode = (): string =>
    Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({ onVerify, theme = 'light' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [code, setCode] = useState<string>(() => generateCode());
    const [input, setInput] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isDark = theme === 'dark';

    const drawCaptcha = useCallback((currentCode: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        // Background
        ctx.fillStyle = isDark ? '#1e1b4b' : '#eef2ff';
        ctx.fillRect(0, 0, W, H);

        // Random noise lines
        for (let i = 0; i < 10; i++) {
            ctx.strokeStyle = isDark
                ? `rgba(${Math.random() * 100 + 120},${Math.random() * 100 + 120},255,0.35)`
                : `rgba(${Math.random() * 80},${Math.random() * 80},${Math.random() * 180 + 60},0.25)`;
            ctx.lineWidth = Math.random() * 1.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(Math.random() * W, Math.random() * H);
            ctx.bezierCurveTo(
                Math.random() * W, Math.random() * H,
                Math.random() * W, Math.random() * H,
                Math.random() * W, Math.random() * H
            );
            ctx.stroke();
        }

        // Noise dots
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = isDark
                ? `rgba(180,180,255,${Math.random() * 0.45})`
                : `rgba(50,50,150,${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw characters
        const charW = W / (currentCode.length + 1);
        currentCode.split('').forEach((char, i) => {
            ctx.save();
            const x = charW * (i + 0.85) + (Math.random() * 6 - 3);
            const y = H / 2 + (Math.random() * 10 - 5);
            ctx.translate(x, y);
            ctx.rotate((Math.random() - 0.5) * 0.45);

            const fontSize = Math.floor(Math.random() * 8 + 22);
            const bold = Math.random() > 0.4 ? 'bold' : '600';
            ctx.font = `${bold} ${fontSize}px 'Arial', sans-serif`;

            ctx.shadowColor = isDark ? 'rgba(0,0,80,0.6)' : 'rgba(0,0,60,0.4)';
            ctx.shadowBlur = 3;

            ctx.fillStyle = isDark
                ? `hsl(${Math.random() * 80 + 200}, 85%, ${Math.random() * 20 + 65}%)`
                : `hsl(${Math.random() * 80 + 200}, 75%, ${Math.random() * 20 + 18}%)`;

            ctx.fillText(char, 0, 0);
            ctx.restore();
        });
    }, [isDark]);

    useEffect(() => {
        drawCaptcha(code);
    }, [code, drawCaptcha]);

    const refresh = () => {
        const newCode = generateCode();
        setCode(newCode);
        setInput('');
        setIsVerified(false);
        setErrorMsg('');
        onVerify(null);
        setTimeout(() => drawCaptcha(newCode), 0);
    };

    const handleChange = (value: string) => {
        const trimmed = value.slice(0, 6);
        setInput(trimmed);
        setErrorMsg('');

        if (trimmed.length === 6) {
            if (trimmed.toLowerCase() === code.toLowerCase()) {
                setIsVerified(true);
                onVerify('custom-captcha-verified');
            } else {
                setIsVerified(false);
                setErrorMsg('Incorrect code. Refreshing…');
                onVerify(null);
                setTimeout(() => {
                    const newCode = generateCode();
                    setCode(newCode);
                    setInput('');
                    setErrorMsg('');
                }, 1000);
            }
        } else {
            if (isVerified) {
                setIsVerified(false);
                onVerify(null);
            }
        }
    };

    return (
        <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'bg-white/5 border-white/15' : 'bg-indigo-50 border-indigo-200'}`}>
            <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-indigo-700'}`}>
                🔐 Security Check — Type the characters shown below
            </p>

            <div className="flex items-center gap-3">
                <canvas
                    ref={canvasRef}
                    width={220}
                    height={58}
                    className="rounded-lg flex-1 select-none"
                    style={{
                        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #c7d2fe',
                        cursor: 'default',
                    }}
                />
                <button
                    type="button"
                    onClick={refresh}
                    title="Get a new code"
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${isDark
                            ? 'bg-white/10 hover:bg-white/20 text-purple-300 hover:text-white'
                            : 'bg-white hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700 border border-indigo-200'
                        }`}
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Enter the 6 characters above"
                    maxLength={6}
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-mono tracking-widest transition-all outline-none ${isDark
                            ? 'bg-white/10 border border-white/20 text-white placeholder-white/30 focus:ring-2 focus:ring-purple-500'
                            : 'bg-white border border-indigo-200 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400'
                        } ${isVerified ? (isDark ? 'border-green-400 ring-2 ring-green-400/50' : 'border-green-500 ring-2 ring-green-300') : ''}`}
                />
                {isVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                )}
            </div>

            {errorMsg && <p className="text-xs text-red-400 font-medium">{errorMsg}</p>}
            {isVerified && (
                <p className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ✓ Verification successful
                </p>
            )}
        </div>
    );
};
