'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            // 1. Perform Login
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (user) {
                // 2. Smart Merge Logic
                // Check if there is guest data in localStorage
                const guestDataStr = localStorage.getItem('guest_preference_data');

                if (guestDataStr) {
                    try {
                        const guestData = JSON.parse(guestDataStr);

                        // Prepare payload
                        const profilePayload = {
                            pref_acidity: guestData.acidity,
                            pref_body: guestData.body,
                            pref_roast: guestData.roast,
                            catatan_preferensi: guestData.notes
                        };

                        // Check if profile exists
                        const { data: existingProfile } = await supabase
                            .from('profil_rasa_user')
                            .select('profile_id')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (existingProfile) {
                            // UPDATE existing
                            const { error: updateError } = await supabase
                                .from('profil_rasa_user')
                                .update(profilePayload)
                                .eq('user_id', user.id);

                            if (updateError) console.error("Update failed:", updateError);
                            else {
                                alert("Profil rasa Anda berhasil diperbarui berdasarkan kuis terakhir!");
                            }
                        } else {
                            // INSERT new (Edge case: old user but no profile)
                            const { error: insertError } = await supabase
                                .from('profil_rasa_user')
                                .insert({
                                    // profile_id: crypto.randomUUID(), // REMOVED for Mobile Compatibility
                                    user_id: user.id,
                                    ...profilePayload
                                });

                            if (insertError) console.error("Insert failed:", insertError);
                            else {
                                alert("Profil rasa baru berhasil disimpan!");
                            }
                        }

                        // Cleanup
                        localStorage.removeItem('guest_preference_data');

                    } catch (mergeError) {
                        console.error("Smart Merge Error:", mergeError);
                        // Don't block login if merge fails, just log it
                    }
                }
            }

            // 3. Redirect based on Email Role (UPDATED for Multi-Admin)
            // Daftar email admin yang diizinkan masuk ke panel admin
            const ADMIN_EMAILS = [
                'ardoriandaadmin@beanvoyage.com',
                'admin@bean.com'
            ];

            // Normalisasi input email agar tidak sensitif huruf besar/kecil
            const userEmail = email.toLowerCase().trim();

            if (ADMIN_EMAILS.includes(userEmail)) {
                console.log("Admin login detected. Redirecting to HQ...");
                router.push('/admin');
            } else {
                console.log("User login detected. Redirecting to Dashboard...");
                router.push('/dashboard');
            }

        } catch (error) {
            setErrorMsg((error as Error).message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37] opacity-5 blur-[100px] rounded-full z-0"></div>

            <div className="w-full max-w-md bg-[#1a1a1a] border border-[#D4AF37]/30 p-8 md:p-12 relative z-10 shadow-2xl shadow-black">

                <div className="text-center mb-10">
                    <Link href="/" className="block font-serif text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-xl tracking-[0.2em] font-bold mb-6 hover:opacity-80 transition drop-shadow-sm">
                        BEANVOYAGE
                    </Link>
                    <h1 className="font-serif text-3xl text-white mb-2 tracking-wide">Welcome Back</h1>
                    <p className="text-gray-500 text-xs font-sans uppercase tracking-widest">
                        Access your coffee journey
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-sans text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-[#D4AF37] focus:border-[#D4AF37] outline-none transition-colors text-sm"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-widest">Password</label>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-[#D4AF37] focus:border-[#D4AF37] outline-none transition-colors text-sm"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-b from-[#D4AF37] to-[#AA8C2C] hover:from-[#E5C565] hover:to-[#B5952F] text-black py-4 font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-xs">
                        Don&apos;t have an account?{' '}
                        <Link href="/quiz" className="text-[#D4AF37] hover:underline ml-1">
                            Start Journey
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}