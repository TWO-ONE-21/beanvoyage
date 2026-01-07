'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function QuizPage() {
    const router = useRouter();

    // State for inputs
    const [roast, setRoast] = useState<string>('');
    const [acidity, setAcidity] = useState<number>(3); // Default middle value
    const [body, setBody] = useState<number>(3);       // Default middle value
    const [notes, setNotes] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Hybrid Mode State
    const [isMember, setIsMember] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load Data on Mount
    useEffect(() => {
        const checkUser = async () => {
            try {
                // 1. Check Session
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error("Auth Error:", authError);
                }

                if (user) {
                    setIsMember(true);
                    setUserId(user.id);

                    // 2. Fetch Existing Profile
                    // STRICT: Use lowercase table name 'profil_rasa_user'
                    const { data: pref, error: fetchError } = await supabase
                        .from('profil_rasa_user')
                        .select('pref_roast, pref_acidity, pref_body, catatan_preferensi')
                        .eq('user_id', user.id)
                        .maybeSingle(); // Use maybeSingle to avoid 406 if row doesn't exist yet

                    if (fetchError) {
                        console.error("Supabase Fetch Error:", fetchError.message, fetchError.details);
                    }

                    if (pref) {
                        // FIX ROAST PRE-FILL: Robust Case-Insensitive Matching
                        const dbRoast = pref.pref_roast || '';

                        // Default to empty if not found, but try to match
                        let targetRoast = '';
                        if (dbRoast) {
                            const options = ['Light', 'Medium', 'Dark'];
                            targetRoast = options.find(o => o.toLowerCase() === dbRoast.toLowerCase()) || dbRoast;
                        }

                        // Set State
                        setRoast(targetRoast); // This should trigger the UI selection
                        setAcidity(pref.pref_acidity !== null ? pref.pref_acidity : 3);
                        setBody(pref.pref_body !== null ? pref.pref_body : 3);
                        setNotes(pref.catatan_preferensi || '');
                    }
                }
            } catch (err) {
                console.error("Unexpected Error in useEffect:", err);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    // Roast Options Data
    const roastOptions = [
        { id: 'Light', desc: 'Buah-buahan' },
        { id: 'Medium', desc: 'Seimbang' },
        { id: 'Dark', desc: 'Pahit/Kuat' },
    ];

    const handleSubmit = async () => {
        // Validation
        if (!roast) {
            setError('Mohon pilih tingkat roasting (sangrai) yang Anda sukai.');
            return;
        }

        setError(''); // Clear previous errors

        if (isMember && userId) {
            // AUTHORIZED: Update Direct to DB
            try {
                console.log("Updating Profile for User:", userId);
                console.log("Data:", { roast, acidity, body, notes });

                // STRICT: Use lowercase 'profil_rasa_user'
                const { error: updateError } = await supabase
                    .from('profil_rasa_user')
                    .update({
                        pref_roast: roast,
                        pref_acidity: acidity,
                        pref_body: body,
                        catatan_preferensi: notes,
                        // last_updated: new Date().toISOString() // Optional: Check if column exists in schema.sql (It does NOT appear in schema.sql provided, so removing to be safe)
                    })
                    .eq('user_id', userId);

                if (updateError) {
                    console.error("Supabase Update Error Detail:", updateError.message, updateError.details, updateError.hint);
                    throw updateError;
                }

                alert("Profil berhasil dikalibrasi!");
                router.push('/dashboard');

            } catch (err) {
                console.error("Quiz Update Exception:", err);
                setError(`Gagal memperbarui profil: ${(err as Error).message || "Unknown error"}`);
            }
        } else {
            // GUEST: LocalStorage & Redirect to Register
            const preferenceData = {
                roast,
                acidity,
                body,
                notes,
            };
            localStorage.setItem('guest_preference_data', JSON.stringify(preferenceData));
            router.push('/auth/register');
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-[#D4AF37] flex items-center justify-center font-sans tracking-widest text-xs">LOADING PALATE...</div>;

    return (
        <div className="min-h-screen w-full bg-[#000000] flex items-center justify-center p-4">
            {/* Container */}
            <div className="w-full max-w-3xl border border-[#D4AF37] p-8 md:p-12 rounded-sm relative">

                {/* HEADER */}
                <div className="text-center mb-10">
                    <h1 className="font-serif text-[#D4AF37] text-4xl mb-3 tracking-wide">
                        Define Your Palate
                    </h1>
                    <p className="font-sans text-gray-400 text-sm">
                        {isMember ? "Kalibrasi ulang preferensi rasa Anda." : "Bantu kami mencarikan biji kopi yang paling cocok dengan lidahmu."}
                    </p>
                </div>

                <div className="space-y-8">

                    {/* 1. ROAST LEVEL SELECTOR */}
                    <div>
                        <label className="block font-sans text-white text-xs font-bold tracking-widest mb-3 uppercase">
                            Roast Level
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roastOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setRoast(option.id);
                                        setError('');
                                    }}
                                    className={`border border-[#D4AF37]/50 rounded p-6 flex flex-col items-center justify-center transition-all duration-300 hover:bg-[#D4AF37]/10 ${roast === option.id
                                        ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]'
                                        : 'bg-transparent text-gray-400 hover:border-[#D4AF37]'
                                        }`}
                                >
                                    <span className="font-serif text-xl mb-2">{option.id}</span>
                                    <span className="font-sans text-[10px] uppercase opacity-80">{option.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. ACIDITY SLIDER */}
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <label className="block font-sans text-white text-xs font-bold tracking-widest uppercase">
                                Acidity
                            </label>
                            <span className="font-serif text-[#D4AF37] text-lg">{acidity} / 5</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={acidity}
                            onChange={(e) => setAcidity(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                        <div className="flex justify-between font-sans text-[10px] text-gray-500 mt-2 uppercase tracking-wider">
                            <span>Low</span>
                            <span>High/Bright</span>
                        </div>
                    </div>

                    {/* 3. BODY SLIDER */}
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <label className="block font-sans text-white text-xs font-bold tracking-widest uppercase">
                                Body
                            </label>
                            <span className="font-serif text-[#D4AF37] text-lg">{body} / 5</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={body}
                            onChange={(e) => setBody(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                        <div className="flex justify-between font-sans text-[10px] text-gray-500 mt-2 uppercase tracking-wider">
                            <span>Light/Tea-like</span>
                            <span>Heavy/Syrupy</span>
                        </div>
                    </div>

                    {/* 4. TEXT AREA */}
                    <div>
                        <label className="block font-sans text-white text-xs font-bold tracking-widest mb-3 uppercase">
                            Personal Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Saya suka kopi yang aromanya bunga (floral) tapi tidak terlalu asam..."
                            className="w-full bg-[#1a1a1a] border border-[#D4AF37]/30 rounded p-3 text-[#D4AF37] font-sans text-sm placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors h-24 resize-none"
                        />
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <p className="text-red-400 text-xs text-center font-sans">{error}</p>
                    )}

                    {/* 5. SUBMIT BUTTON */}
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold font-sans py-4 rounded transition-colors uppercase tracking-widest text-sm"
                    >
                        {isMember ? 'Simpan Kalibrasi' : 'Lihat Rekomendasi Saya'}
                    </button>

                </div>
            </div>
        </div>
    );
}
