'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CheckoutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Load User Data
    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/register');
                return;
            }
            setUserId(user.id);

            // Fetch Address
            const { data } = await supabase
                .from('User')
                .select('alamat_pengiriman')
                .eq('user_id', user.id)
                .single();

            if (data && data.alamat_pengiriman) {
                setAddress(data.alamat_pengiriman);
            }
            setLoading(false);
        }
        loadData();
    }, [router]);

    const handlePayment = async () => {
        if (!address) {
            alert('Mohon isi alamat pengiriman.');
            return;
        }
        if (!userId) return;

        setIsProcessing(true);

        try {
            // 1. Update User Address
            await supabase
                .from('User')
                .update({ alamat_pengiriman: address })
                .eq('user_id', userId);

            // 2. Insert Status Langganan
            // Calculate Next Billing (30 Days from now)
            const now = new Date();
            const nextBilling = new Date();
            nextBilling.setDate(now.getDate() + 30);

            const { error: subError } = await supabase
                .from('status_langganan')
                .insert({
                    // sub_id: crypto.randomUUID(), // REMOVED: Mobile Fix
                    user_id: userId,
                    tier_id: 'tier-1', // Seeded data
                    status_aktif: 'Active',
                    tanggal_mulai: now.toISOString(),
                    next_billing_date: nextBilling.toISOString()
                });

            if (subError) throw subError;

            // 3. Insert Log Pengiriman (Processing)
            // For this MVP, we pick a dummy coffee_id or just insert 
            // Assuming FK constraint coffee_id exists. Let's try to query one first or handle error.
            // Ideally we get 'Soul Coffee' from matching logic again, but for speed, let's grab the first coffee.
            const { data: coffee } = await supabase.from('stok_kopi').select('coffee_id').limit(1).single();
            const coffeeId = coffee?.coffee_id; // If null, FK might fail if strict.

            if (coffeeId) {
                await supabase.from('log_pengiriman').insert({
                    // delivery_id: crypto.randomUUID(), // REMOVED: Mobile Fix
                    user_id: userId,
                    coffee_id: coffeeId,
                    tanggal_kirim: now.toISOString(), // Assuming dispatch today
                    nomor_resi: 'PROSES-PACKING'
                });
            }

            // 4. Success UI
            alert('Selamat Datang di BeanVoyage! Langganan Anda aktif.');
            router.push('/dashboard');

        } catch (error) {
            console.error('Payment Error:', error);
            alert('Terjadi kesalahan proses pembayaran: ' + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center p-10 font-sans tracking-widest text-xs">LOADING ORDER DETAILS...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans flex items-center justify-center">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* LEFT: Shipping Form */}
                <div>
                    <h1 className="font-serif text-[#D4AF37] text-3xl mb-8">Checkout</h1>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Alamat Pengiriman</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Jl. Kopi No. 123, Jakarta Selatan..."
                                className="w-full h-32 bg-[#1a1a1a] border border-[#333] p-4 text-[#D4AF37] focus:border-[#D4AF37] outline-none rounded-sm resize-none"
                            />
                        </div>
                        <div className="bg-[#1a1a1a]/50 p-6 border border-[#333] rounded-sm">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Metode Pembayaran (Simulasi)</h3>
                            <div className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                                <div className="w-4 h-4 rounded-full border border-gray-500 bg-gray-700"></div>
                                <span>Kartu Kredit / Debit</span>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="w-4 h-4 rounded-full border border-[#D4AF37] bg-[#D4AF37]"></div>
                                <span className="text-[#D4AF37]">Instant Activation (Dev Mode)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Order Summary */}
                <div className="bg-[#1a1a1a] border border-[#D4AF37] p-8 md:p-10 rounded-sm shadow-xl shadow-[#D4AF37]/5 h-fit">
                    <h2 className="font-serif text-2xl text-white mb-6">Order Summary</h2>

                    {/* Product Card */}
                    <div className="flex gap-4 border-b border-gray-800 pb-6 mb-6">
                        <div className="w-20 h-20 bg-[#000] border border-[#333] flex items-center justify-center">
                            <span className="text-[#D4AF37] text-2xl font-serif">BV</span>
                        </div>
                        <div>
                            <h3 className="text-[#D4AF37] font-bold">The Weekend Voyager</h3>
                            <p className="text-gray-500 text-xs mt-1">Single Origin, 200g, Monthly</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm mb-8">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>Rp 109.000</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="border-t border-gray-800 my-4"></div>
                        <div className="flex justify-between text-xl font-serif text-[#D4AF37]">
                            <span>Total</span>
                            <span>Rp 109.000</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black py-4 font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Bayar Sekarang'}
                    </button>
                    <p className="text-center text-gray-600 text-[10px] mt-4 uppercase tracking-widest">
                        Secure Payment Simulation
                    </p>
                </div>

            </div>
        </div>
    );
}
