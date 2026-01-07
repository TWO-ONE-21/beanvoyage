'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterPage() {
    const router = useRouter();
    const [isQuizDataFound, setIsQuizDataFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Switcheroo State: Toggle between Form and "Account Exists" Card
    const [accountExistsMode, setAccountExistsMode] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });

    // 1. Check LocalStorage on Mount
    useEffect(() => {
        const quizData = localStorage.getItem('guest_preference_data');
        if (quizData) {
            setIsQuizDataFound(true);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Registrasi gagal, coba lagi.');

            const userId = authData.user.id;

            // 2. Insert Public User Data
            const { error: userError } = await supabase
                .from('User')
                .insert({
                    user_id: userId,
                    nama_lengkap: formData.fullName,
                    email: formData.email,
                });

            if (userError) throw userError;

            // 3. Insert Quiz Data (If found)
            if (isQuizDataFound) {
                const quizDataStr = localStorage.getItem('guest_preference_data');
                if (quizDataStr) {
                    const quizData = JSON.parse(quizDataStr);

                    const { error: profileError } = await supabase
                        .from('profil_rasa_user')
                        .insert({
                            // profile_id: crypto.randomUUID(), // REMOVED for Mobile Compatibility (Supabase handles default)
                            user_id: userId,
                            pref_acidity: quizData.acidity,
                            pref_body: quizData.body,
                            pref_roast: quizData.roast,
                            catatan_preferensi: quizData.notes,
                        });

                    if (profileError) throw profileError;

                    // 4. Clear LocalStorage
                    localStorage.removeItem('guest_preference_data');
                }
            }

            // 5. Redirect
            router.push('/dashboard');

        } catch (err) {
            const errMsg = (err as Error).message || '';

            // Smart Error Handling: "Switcheroo"
            if (errMsg.includes('User already registered') || errMsg.includes('already registered')) {
                setAccountExistsMode(true); // Toggle UI
                setError('');
                // Don't log to console to avoid scary red text
            } else {
                console.error('Registration Error:', err);
                setError(errMsg || 'Terjadi kesalahan saat menyimpan data.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#000000] flex flex-col md:flex-row">

            {/* LEFT SECTION: Artistic Image/Slogan */}
            <div className="w-full md:w-1/2 bg-[#1a1a1a] flex items-center justify-center p-12 text-[#D4AF37] border-r border-[#D4AF37]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-[#D4AF37]/10 z-10" />
                <div className="relative z-20 text-center">
                    <h2 className="font-serif text-5xl italic mb-4">The Art of<br />Perfect Brew</h2>
                    <p className="font-sans text-sm tracking-[0.2em] text-gray-400 uppercase">
                        Curated for your palate
                    </p>
                </div>
            </div>

            {/* RIGHT SECTION: Form OR Switcheroo Card */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
                <div className="max-w-md w-full">

                    {isQuizDataFound && !accountExistsMode && (
                        <div className="mb-8 bg-[#D4AF37]/10 border border-[#D4AF37] p-4 rounded-sm">
                            <h3 className="text-[#D4AF37] font-serif text-lg mb-1">Profil Rasa Anda Siap!</h3>
                            <p className="text-gray-300 font-sans text-xs leading-relaxed">
                                Kami telah menemukan biji kopi yang selaras dengan palet rasa &apos;Acidity&apos; pilihan Anda.
                            </p>
                        </div>
                    )}

                    {/* --- CONDITIONAL RENDERING START --- */}
                    {accountExistsMode ? (
                        // MODE 1: ACCOUNT EXISTS CARD
                        <div className="animate-fade-in bg-[#1a1a1a] border border-[#D4AF37]/50 p-8 rounded-sm text-center shadow-2xl shadow-[#D4AF37]/10">
                            <h2 className="text-[#D4AF37] font-serif text-2xl mb-4">
                                Email Sudah Terdaftar
                            </h2>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                Tampaknya Anda sudah pernah mendaftar dengan email <strong className="text-white">{formData.email}</strong>.
                                <br /><br />
                                Silakan login untuk menyimpan hasil kuis ini langsung ke akun lama Anda.
                            </p>

                            <Link
                                href="/auth/login"
                                className="block w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold py-4 uppercase tracking-widest text-xs mb-6 transition-colors"
                            >
                                MASUK / LOGIN
                            </Link>

                            <button
                                onClick={() => setAccountExistsMode(false)}
                                className="text-gray-500 text-xs underline hover:text-white transition-colors"
                            >
                                Salah Email? Daftar dengan email lain.
                            </button>
                        </div>

                    ) : (
                        // MODE 2: REGISTER FORM (Normal)
                        <>
                            <h1 className="font-serif text-white text-3xl mb-2">
                                {isQuizDataFound ? 'Simpan Profil & Gabung' : 'Mulai Petualangan Kopi'}
                            </h1>
                            <p className="font-sans text-gray-500 text-sm mb-8">
                                Daftar untuk mulai berlangganan kopi terbaik Indonesia.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-sans font-bold">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full bg-[#1a1a1a] border border-[#333] text-[#D4AF37] p-3 rounded focus:outline-none focus:border-[#D4AF37] transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-sans font-bold">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-[#1a1a1a] border border-[#333] text-[#D4AF37] p-3 rounded focus:outline-none focus:border-[#D4AF37] transition-colors"
                                        placeholder="name@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 font-sans font-bold">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-[#1a1a1a] border border-[#333] text-[#D4AF37] p-3 rounded focus:outline-none focus:border-[#D4AF37] transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {error && <p className="text-red-500 text-xs font-sans">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold font-sans py-4 rounded transition-colors uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? (isQuizDataFound ? 'Menyimpan Profil Rasa...' : 'Mendaftarkan...')
                                        : (isQuizDataFound ? 'SIMPAN PROFIL & LIHAT HASIL' : 'DAFTAR SEKARANG')
                                    }
                                </button>
                            </form>
                        </>
                    )}
                    {/* --- CONDITIONAL RENDERING END --- */}

                </div>
            </div>

        </div>
    );
}
