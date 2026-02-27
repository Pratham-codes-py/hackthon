"use client";
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/layout/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Leaf, Chrome, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { auth } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [showPassword, setShowPassword] = useState(false)

    // Form fields
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const router = useRouter()
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    useEffect(() => {
        if (message) setError(message)
    }, [message])

    // ── Google sign-in (unchanged) ──────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            if (result.user && result.user.email) {
                localStorage.setItem("userEmail", result.user.email);
                localStorage.setItem("userName", result.user.displayName || "User");
            }
            router.push("/input");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to sign in with Google.");
        } finally {
            setGoogleLoading(false);
        }
    };

    // ── Dummy email/password handler ────────────────────────────────────────
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (mode === 'signup' && !name.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        // Simulate a short network delay for realism
        await new Promise((r) => setTimeout(r, 900));

        // Store dummy credentials in localStorage (demo only)
        const displayName = mode === 'signup' ? name.trim() : email.split('@')[0];
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", displayName);

        setIsLoading(false);
        router.push("/input");
    };

    const inputClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#6BAA75] focus:ring-1 focus:ring-[#6BAA75] transition-all";

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4 pt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md bg-card border border-border p-8 rounded-3xl shadow-sm"
                >
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 bg-[#6BAA75]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <Leaf className="w-8 h-8 text-[#6BAA75]" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-foreground">Welcome to EcoTrack</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Sign in to calculate your carbon footprint</p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
                        {(['signin', 'signup'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(''); }}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {m === 'signin' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-3 flex items-center gap-2 mb-4"
                            >
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Email / password form */}
                    <form onSubmit={handleEmailAuth} className="space-y-3 mb-5">
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div
                                    key="name-field"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`${inputClass} pl-10`}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`${inputClass} pl-10`}
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${inputClass} pl-10 pr-10`}
                                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl font-semibold text-base bg-[#4CD964] hover:bg-[#3db854] text-[#0A1F18] transition-all"
                        >
                            {isLoading
                                ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
                                : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">or continue with</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Google (unchanged) */}
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        variant="outline"
                        className="w-full flex items-center gap-3 h-12 rounded-xl border-2 hover:border-[#6BAA75] transition-colors"
                    >
                        <Chrome className="w-5 h-5 text-[#4285F4]" />
                        <span className="font-semibold">{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                    </Button>

                    <p className="text-center text-xs text-muted-foreground mt-5">
                        By signing in, you agree to track your carbon footprint and help save the planet 🌍
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
