'use client';

// Force dynamic rendering to prevent stale data
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import LogoutButton from '@/components/LogoutButton';
import {
    Check, Settings, X, AlertTriangle, PauseCircle,
    DollarSign, TrendingUp, Users, Package, Star,
    Activity, ArrowRight
} from 'lucide-react';

// --- TYPES ---
interface UserData { nama_lengkap: string; }
interface Subscription { status_aktif: string; tier_id: string; next_billing_date: string; paket_langganan?: { nama_tier: string; }; }
interface Coffee { coffee_id: string; nama_origin: string; metadata_rasa_kopi: { level_acidity: number; level_body: number; tasting_notes: string; }[]; }
interface PerfectMatch extends Coffee { score: number; }
interface DeliveryForReview { delivery_id: string; status: string; tanggal_kirim: string; stok_kopi?: { nama_origin: string; coffee_id: string; }; }

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // State
    const [userData, setUserData] = useState<UserData | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // UI State
    const [lastShipment, setLastShipment] = useState<DeliveryForReview | null>(null);
    const [adminStats, setAdminStats] = useState({ activeMembers: 0, pendingShipments: 0, completedDeliveries: 0, mrr: 0 });
    const [deliveryToReview, setDeliveryToReview] = useState<DeliveryForReview | null>(null);

    // Rating State
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
    const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(false);

    // Recommendation & Management
    const [perfectMatch, setPerfectMatch] = useState<PerfectMatch | null>(null);
    const [noProfile, setNoProfile] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [manageStep, setManageStep] = useState<'MENU' | 'CONFIRM_CANCEL'>('MENU');
    const [isUpdatingSub, setIsUpdatingSub] = useState(false);

    // --- DAFTAR ADMIN ---
    // Tambahkan email admin baru di sini dalam tanda kutip, dipisahkan koma
    const ADMIN_EMAILS = [
        'ardoriandaadmin@beanvoyage.com',
        'admin@admin.com',
        'admin@bean.com'
    ];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // 1. Check Session
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user || !user.email) {
                    router.push('/auth/register');
                    return;
                }

                // 2. CEK ADMIN (MULTI-USER)
                const currentUserEmail = user.email.toLowerCase().trim();

                // Debugging: Lihat di console browser (F12) email apa yang terdeteksi
                console.log("Logged in as:", currentUserEmail);
                console.log("Admin List:", ADMIN_EMAILS);

                if (ADMIN_EMAILS.includes(currentUserEmail)) {
                    console.log("--- ACCESS GRANTED: ADMIN MODE ---");
                    setIsAdmin(true);

                    // Fetch Data Khusus Admin
                    const { count: activeCount } = await supabase.from('status_langganan').select('*', { count: 'exact', head: true }).eq('status_aktif', 'Active');

                    // Hitung MRR (Manual Simulation)
                    // Ambil harga dari paket untuk perhitungan lebih akurat atau gunakan rata-rata
                    // Di sini kita gunakan rata-rata Tier 2 (289k) untuk demo agar angkanya cantik
                    const avgPrice = 289000;
                    const totalRevenue = (activeCount || 0) * avgPrice;

                    const { count: pendingCount } = await supabase.from('log_pengiriman').select('*', { count: 'exact', head: true }).eq('status', 'Processing');
                    const { count: deliveredCount } = await supabase.from('log_pengiriman').select('*', { count: 'exact', head: true }).eq('status', 'Delivered');

                    setAdminStats({
                        activeMembers: activeCount || 0,
                        pendingShipments: pendingCount || 0,
                        completedDeliveries: deliveredCount || 0,
                        mrr: totalRevenue
                    });

                    setLoading(false);
                    return; // BERHENTI DI SINI UNTUK ADMIN (Early Return)
                }

                // === JIKA BUKAN ADMIN (USER BIASA) ===

                // Fetch User Profile
                const { data: profile } = await supabase.from('User').select('nama_lengkap').eq('user_id', user.id).single();
                setUserData(profile);

                // Fetch Subscription
                const { data: sub } = await supabase
                    .from('status_langganan')
                    .select(`*, paket_langganan ( nama_tier )`)
                    .eq('user_id', user.id)
                    .maybeSingle();
                setSubscription(sub);

                // Fetch Shipment
                const { data: shipmentData } = await supabase
                    .from('log_pengiriman')
                    .select(`*, stok_kopi ( nama_origin, coffee_id )`)
                    .eq('user_id', user.id)
                    .order('tanggal_kirim', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                setLastShipment(shipmentData);

                if (shipmentData) {
                    if (shipmentData.status === 'Delivered') {
                        const { data: existingReview } = await supabase
                            .from('ulasan_feedback')
                            .select('feedback_id')
                            .eq('delivery_id', shipmentData.delivery_id)
                            .maybeSingle();

                        if (!existingReview) setDeliveryToReview(shipmentData);
                        else setDeliveryToReview(null);
                    } else {
                        setDeliveryToReview(null);
                    }
                }

                // Lead Logic
                const isActiveUser = sub && sub.status_aktif && sub.status_aktif.toLowerCase() === 'active';
                if (!isActiveUser) await fetchRecommendations(user.id);

            } catch (err) {
                console.error("Dashboard Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Recommendation Logic ---
    const fetchRecommendations = async (userId: string) => {
        const { data: pref } = await supabase.from('profil_rasa_user').select('pref_acidity, pref_body').eq('user_id', userId).maybeSingle();
        if (!pref) { setNoProfile(true); return; }

        const { data: coffees } = await supabase.from('stok_kopi').select(`coffee_id, nama_origin, metadata_rasa_kopi ( level_acidity, level_body, tasting_notes )`);
        if (coffees && coffees.length > 0) {
            let bestMatch: PerfectMatch | null = null;
            let minDifference = Infinity;
            coffees.forEach((c: any) => {
                const meta = c.metadata_rasa_kopi?.[0];
                if (meta) {
                    const diff = Math.abs(pref.pref_acidity - meta.level_acidity) + Math.abs(pref.pref_body - meta.level_body);
                    if (diff < minDifference) {
                        minDifference = diff;
                        bestMatch = { ...c, metadata_rasa_kopi: [meta], score: 100 - (diff * 10) };
                    }
                }
            });
            setPerfectMatch(bestMatch);
        }
    };

    // --- Action Handlers ---
    const handleSubmitReview = async (isPerfectMatch = false) => {
        if (!deliveryToReview) return;
        setSubmittingReview(true);
        const rating = isPerfectMatch ? 5 : reviewRating;
        const notes = isPerfectMatch ? "Auto Perfect Match" : reviewText;

        if (rating === 0) { alert("Mohon berikan rating."); setSubmittingReview(false); return; }

        try {
            const { error } = await supabase.from('ulasan_feedback').insert({
                delivery_id: deliveryToReview.delivery_id,
                skor_rating: rating,
                review_text: notes
            });
            if (error) throw error;

            if (rating <= 3) setShowCalibrationPrompt(true);
            else {
                setIsReviewSubmitted(true);
                setDeliveryToReview(null);
                alert("Ulasan terkirim. Terima kasih!");
                router.refresh();
            }
        } catch (err) { alert("Gagal mengirim ulasan."); } finally { setSubmittingReview(false); }
    };

    const handleCalibrationRedirect = async () => {
        if (deliveryToReview) {
            await supabase.from('ulasan_feedback').insert({
                delivery_id: deliveryToReview.delivery_id,
                skor_rating: reviewRating || 1,
                review_text: "User opted for calibration"
            });
        }
        router.push('/quiz');
    };

    const handleUpdateSubscription = async (newStatus: 'Paused' | 'Cancelled' | 'Active') => {
        if (!subscription) return;
        setIsUpdatingSub(true);
        try {
            await supabase.from('status_langganan').update({ status_aktif: newStatus }).eq('user_id', (await supabase.auth.getUser()).data.user?.id);
            setSubscription(prev => prev ? ({ ...prev, status_aktif: newStatus }) : null);
            setShowManageModal(false);
            setManageStep('MENU');
            router.refresh();
        } catch (err) { alert('Gagal update status.'); } finally { setIsUpdatingSub(false); }
    };

    // --- Formatters ---
    const getProgressWidth = (status: string | undefined) => {
        if (!status) return '0%';
        switch (status) {
            case 'Processing': return '15%'; // Sedikit progress visual
            case 'Shipped': return '50%';
            case 'Delivered': return '100%';
            default: return '0%';
        }
    };

    const formatDate = (dateString: string | undefined, addDays = 0) => {
        const d = dateString ? new Date(dateString) : new Date();
        d.setDate(d.getDate() + addDays);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // --- Loading ---
    if (loading) return <div className="min-h-screen bg-[#050505] text-[#D4AF37] flex items-center justify-center font-sans tracking-widest text-xs">MEMUAT...</div>;

    // === ADMIN DASHBOARD VIEW ===
    if (isAdmin) {
        return (
            <div className="min-h-screen bg-[#050505] text-[#D4AF37] p-8 md:p-12 font-serif">
                <div className="max-w-7xl mx-auto flex justify-between items-center mb-16 px-4 border-b border-[#333] pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">EXECUTIVE <span className="text-[#D4AF37]">DASHBOARD</span></h1>
                        <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mt-2 pl-1">RINGKASAN KEUANGAN & OPERASIONAL</p>
                    </div>
                    <LogoutButton />
                </div>

                <div className="max-w-7xl mx-auto space-y-8 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. REVENUE */}
                        <div className="bg-[#111] p-8 border-l-4 border-[#D4AF37] relative group hover:bg-[#161616] transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-[#D4AF37]/10 rounded-full text-[#D4AF37]"><DollarSign size={24} /></div>
                                <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded"><TrendingUp size={10} /> +12%</span>
                            </div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">TOTAL ESTIMASI PENDAPATAN</p>
                            <h3 className="text-3xl font-serif text-white group-hover:text-[#D4AF37] transition-colors">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(adminStats.mrr)}
                            </h3>
                            <p className="text-xs text-gray-600 mt-2 italic">Pendapatan Bulanan Berulang (MRR)</p>
                        </div>
                        {/* 2. ACTIVE USERS */}
                        <div className="bg-[#111] p-8 border-l-4 border-gray-800 hover:border-gray-600 transition-colors">
                            <div className="p-3 bg-gray-800 rounded-full text-gray-400 w-fit mb-4"><Users size={24} /></div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">PELANGGAN AKTIF</p>
                            <h3 className="text-3xl font-serif text-white">{adminStats.activeMembers}</h3>
                            <p className="text-xs text-gray-600 mt-2">Member Terverifikasi</p>
                        </div>
                        {/* 3. PENDING */}
                        <div className="bg-[#111] p-8 border-l-4 border-red-900/50 hover:border-red-600 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-900/20 rounded-full text-red-500"><Package size={24} /></div>
                                {adminStats.pendingShipments > 0 && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded animate-pulse">BUTUH PROSES</span>}
                            </div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">ANTREAN PENGIRIMAN</p>
                            <h3 className="text-3xl font-serif text-white">{adminStats.pendingShipments}</h3>
                            <p className="text-xs text-gray-600 mt-2">Menunggu di Gudang Logistik</p>
                        </div>
                        {/* 4. SATISFACTION */}
                        <div className="bg-[#111] p-8 border-l-4 border-blue-900/50 hover:border-blue-500 transition-colors">
                            <div className="p-3 bg-blue-900/20 rounded-full text-blue-400 w-fit mb-4"><Star size={24} /></div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-1">RATA-RATA KEPUASAN</p>
                            <h3 className="text-3xl font-serif text-white">4.8<span className="text-lg text-gray-600">/5.0</span></h3>
                            <p className="text-xs text-gray-600 mt-2">Berdasarkan Ulasan Terkini</p>
                        </div>
                    </div>

                    {/* Chart Mockup */}
                    <div className="bg-[#111] p-8 border border-gray-800 rounded-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-serif text-xl border-b border-[#D4AF37] pb-2 inline-block">TREN PERTUMBUHAN MINGGUAN</h3>
                        </div>
                        {/* CHART CONTAINER */}
                        <div className="relative h-64 w-full border-b border-gray-800 flex items-end justify-between gap-3 px-4 pb-0 mt-8">
                            {/* Background Lines (Grid) */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 z-0">
                                <div className="border-t border-gray-500 w-full h-0"></div>
                                <div className="border-t border-gray-500 w-full h-0"></div>
                                <div className="border-t border-gray-500 w-full h-0"></div>
                                <div className="border-t border-gray-500 w-full h-0"></div>
                            </div>

                            {/* BARS with HOVER EFFECT */}
                            {[45, 62, 38, 78, 55, 92, 70].map((h, i) => (
                                <div key={i} className="group relative flex-1 h-full flex items-end z-10 cursor-pointer">
                                    {/* The Bar */}
                                    <div
                                        className="w-full bg-gradient-to-t from-[#D4AF37]/10 to-[#D4AF37]/60 rounded-t-sm transition-all duration-300 ease-out 
                group-hover:from-[#D4AF37] group-hover:to-[#FFF8DC] group-hover:h-[105%] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                                        style={{ height: `${h}%` }}
                                    >
                                        {/* The Tooltip (Floating Number) */}
                                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-[#000] border border-[#D4AF37] text-[#D4AF37] text-[10px] font-bold px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg pointer-events-none whitespace-nowrap">
                                            {h}% Growth
                                            {/* Triangle pointer */}
                                            <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#000] border-r border-b border-[#D4AF37] rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-4 mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>

                    {/* Logistics Link */}
                    <Link href="/admin" className="group flex items-center justify-between bg-[#111] border border-gray-800 hover:border-[#D4AF37] p-8 rounded-sm transition-all duration-300">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-gray-900 group-hover:bg-[#D4AF37] transition-colors rounded-full text-white group-hover:text-black"><Activity size={32} /></div>
                            <div><h3 className="text-2xl text-white font-serif group-hover:text-[#D4AF37] transition-colors">PUSAT KENDALI LOGISTIK</h3><p className="text-gray-500 text-sm mt-1">Kelola pesanan, update status pengiriman, dan pantau logistik Nusantara.</p></div>
                        </div>
                        <div className="text-white group-hover:translate-x-2 transition-transform"><ArrowRight size={32} /></div>
                    </Link>
                </div>
            </div>
        );
    }

    const isActiveMember = subscription?.status_aktif === 'Active';
    const isPaused = subscription?.status_aktif === 'Paused';
    const isCancelled = subscription?.status_aktif === 'Cancelled';

    // === USER DASHBOARD VIEW ===
    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-6 md:p-12 font-sans selection:bg-[#D4AF37] selection:text-black">

            <div className="flex justify-between items-center mb-12 border-b border-gray-900 pb-6">
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl text-white mb-1">
                        Selamat Datang, <span className="text-[#D4AF37] italic">{userData?.nama_lengkap || 'Guest'}</span>
                    </h1>
                    <p className="text-gray-500 text-xs tracking-widest uppercase">
                        PAKET AKTIF: <span className="text-white">{subscription?.paket_langganan?.nama_tier || subscription?.tier_id || 'BELUM BERLANGGANAN'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {!isAdmin && subscription && (
                        <button onClick={() => { setManageStep('MENU'); setShowManageModal(true); }} className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#D4AF37] uppercase tracking-widest transition-colors mr-2">
                            <Settings size={14} /> Atur Langganan
                        </button>
                    )}
                    <LogoutButton />
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-16">
                {/* ACTIVE MEMBER */}
                {isActiveMember ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Current Shipment */}
                        <div>
                            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3"><span className="w-8 h-[1px] bg-[#D4AF37]"></span>Current Shipment</h2>
                            <div className="bg-[#111] p-8 border border-gray-800 rounded-sm relative overflow-hidden">
                                <div className="mb-8 mt-4">
                                    {lastShipment?.status !== 'Delivered' ? (
                                        <>
                                            <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">ESTIMASI TIBA</p>
                                            <p className="font-serif text-2xl text-white">{formatDate(lastShipment?.tanggal_kirim, 3)}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">STATUS PENGIRIMAN</p>
                                            <p className="font-serif text-2xl text-[#D4AF37] animate-pulse">Siap Diseduh</p>
                                        </>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">PROCESSING STATUS</p>
                                    {/* Stepper Logic with Dots */}
                                    <div className="relative pt-8 pb-6">
                                        <div className="absolute top-8 left-0 w-full h-[2px] bg-gray-800 z-0"></div>
                                        <div className="absolute top-8 left-0 h-[2px] bg-[#D4AF37] transition-all duration-1000 z-0" style={{ width: getProgressWidth(lastShipment?.status) }}></div>

                                        <div className="absolute top-8 left-0 transform -translate-y-1/2 z-10">
                                            <div className="w-4 h-4 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
                                            <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] uppercase font-bold text-[#D4AF37]">PACKED</span>
                                        </div>

                                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                                            <div className={`w-4 h-4 rounded-full border-2 ${['Shipped', 'Delivered'].includes(lastShipment?.status || '') ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-gray-900 border-gray-700'}`}></div>
                                            <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] uppercase font-bold text-gray-500">SHIPPED</span>
                                        </div>

                                        <div className="absolute top-8 right-0 transform -translate-y-1/2 z-10">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${lastShipment?.status === 'Delivered' ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-gray-900 border-gray-700'}`}>
                                                {lastShipment?.status === 'Delivered' && <Check className="w-3 h-3 text-black" />}
                                            </div>
                                            <span className="absolute top-6 right-0 -translate-x-1/2 text-[9px] uppercase font-bold text-gray-500">DELIVERED</span>
                                        </div>
                                    </div>

                                    {lastShipment?.stok_kopi && (
                                        <div className="mt-8 text-right">
                                            <Link href={`/story/${lastShipment.stok_kopi.coffee_id}`} className="inline-block border border-[#D4AF37] text-[#D4AF37] px-4 py-2 text-xs font-bold uppercase hover:bg-[#D4AF37] hover:text-black transition-colors">
                                                READ STORY: {lastShipment.stok_kopi.nama_origin}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tasting Journal */}
                        <div>
                            <h2 className="font-serif text-2xl text-white mb-6 flex items-center gap-3"><span className="w-8 h-[1px] bg-[#D4AF37]"></span>Tasting Journal</h2>
                            {deliveryToReview && !isReviewSubmitted ? (
                                <div className="bg-[#1a1a1a] border border-[#D4AF37] p-8 rounded-sm shadow-2xl relative animate-in fade-in">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
                                    <h3 className="font-serif text-xl text-white mb-2">Penilaian Kopi Bulan Ini</h3>
                                    <p className="text-gray-400 text-xs mb-6 font-sans">Pengiriman: {formatDate(deliveryToReview.tanggal_kirim)}</p>
                                    <div className="flex gap-2 mb-6 justify-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} onClick={() => setReviewRating(star)} className={`text-2xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-[#D4AF37]' : 'text-gray-700'}`}>★</button>
                                        ))}
                                    </div>
                                    <textarea className="w-full bg-black/50 border border-gray-800 rounded p-4 text-sm text-gray-300 mb-6 h-24" placeholder="Ceritakan pengalaman rasa Anda..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => handleSubmitReview(false)} disabled={submittingReview} className="w-full bg-[#D4AF37] text-black font-bold py-3 uppercase text-xs">KIRIM ULASAN</button>
                                        <button onClick={() => handleSubmitReview(true)} disabled={submittingReview} className="w-full border border-gray-700 text-gray-400 font-bold py-3 uppercase text-xs hover:border-[#D4AF37] hover:text-[#D4AF37]">PERFECT MATCH! (5★)</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#111] p-8 border border-gray-800 rounded-sm flex flex-col items-center justify-center text-center h-full min-h-[300px] opacity-50">
                                    <p className="font-serif text-gray-500 italic mb-2">&quot;Coffee is a language in itself.&quot;</p>
                                    <div className="mt-8 border border-gray-800 px-6 py-2 rounded-full"><span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">ALL JOURNALS UP TO DATE</span></div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* --- LEAD / GUEST VIEW --- */
                    <>
                        <h1 className="font-serif text-3xl mb-8">Your Soul Coffee</h1>
                        {perfectMatch ? (
                            <div className="bg-[#1a1a1a] border border-[#D4AF37] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-[#D4AF37]/5">
                                <div className="p-8 md:p-12 md:w-2/3 flex flex-col justify-center">
                                    <span className="text-[#D4AF37] font-sans text-xs font-bold tracking-[0.2em] mb-4 uppercase">REKOMENDASI TERBAIK</span>
                                    <h2 className="font-serif text-4xl md:text-5xl text-white mb-2 leading-tight">{perfectMatch.nama_origin}</h2>
                                    <div className="flex gap-2 mb-6">
                                        {perfectMatch.metadata_rasa_kopi[0].tasting_notes.split(',').map((note, idx) => (
                                            <span key={idx} className="bg-[#000] text-gray-300 text-[10px] px-2 py-1 rounded border border-[#333] uppercase tracking-wide">{note.trim()}</span>
                                        ))}
                                    </div>
                                    <p className="text-gray-400 text-sm font-sans leading-relaxed mb-8 max-w-md">Kopi ini memiliki tingkat acidity dan body yang selaras dengan preferensi Anda.</p>
                                    <button onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#D4AF37] hover:bg-[#b5952f] text-black w-full md:w-auto px-8 py-4 rounded font-bold uppercase tracking-widest text-sm transition-all">MULAI BERLANGGANAN</button>
                                </div>
                                <div className="bg-[#D4AF37] p-8 md:w-1/3 flex flex-col items-center justify-center text-black"><span className="font-serif text-6xl md:text-7xl font-black">{perfectMatch.score}%</span></div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-10 border border-dashed border-gray-800">
                                <p className="mb-4">Belum ada profil rasa.</p>
                                <button onClick={() => router.push('/quiz')} className="bg-[#D4AF37] text-black px-6 py-2 rounded font-bold uppercase text-xs">IKUTI KUIS</button>
                            </div>
                        )}

                        {/* --- PAUSED STATE UI --- */}
                        {(isPaused || isCancelled) && (
                            <div className="max-w-2xl mx-auto text-center py-10 mt-10">
                                <div className="bg-yellow-900/10 border border-yellow-600/30 p-10 rounded-sm">
                                    <PauseCircle size={48} className="mx-auto text-yellow-500 mb-6" />
                                    <h2 className="font-serif text-3xl text-yellow-500 mb-4">{isPaused ? 'Membership Dijeda' : 'Membership Non-Aktif'}</h2>
                                    <button onClick={() => handleUpdateSubscription('Active')} className="bg-yellow-600 text-black px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-yellow-500 transition-colors">Aktifkan Kembali</button>
                                </div>
                            </div>
                        )}

                        {/* --- PRICING TIERS --- */}
                        {!isPaused && !isCancelled && (
                            <div id="pricing-section" className="mt-32 mb-16">
                                <div className="text-center mb-16">
                                    <span className="text-[#D4AF37] text-xs font-bold tracking-[0.3em] uppercase">MEMBERSHIP PLANS</span>
                                    <h2 className="font-serif text-4xl mt-3 text-white">Choose Your Voyage</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                                    {/* TIER 1 */}
                                    <div className="bg-[#111] border border-gray-800 p-8 rounded-sm hover:border-gray-600 transition-colors group relative">
                                        <h3 className="font-serif text-2xl text-white mb-2">The Weekend Voyager</h3>
                                        <div className="text-[#D4AF37] font-serif text-3xl mb-6">Rp 189.000<span className="text-sm text-gray-500 font-sans">/mo</span></div>
                                        <Link href="/checkout?tier=tier-1" className="block w-full text-center border border-gray-600 text-gray-300 py-4 uppercase tracking-widest text-xs font-bold hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all">PILIH PAKET INI</Link>
                                    </div>
                                    {/* TIER 2 */}
                                    <div className="bg-[#111] border-2 border-[#D4AF37] p-10 rounded-sm relative transform md:-translate-y-4">
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"><span className="bg-[#D4AF37] text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">MOST POPULAR</span></div>
                                        <h3 className="font-serif text-3xl text-white mb-2">The Daily Ritual</h3>
                                        <div className="text-white font-serif text-4xl mb-8">Rp 289.000<span className="text-sm text-gray-500 font-sans">/mo</span></div>
                                        <Link href="/checkout?tier=tier-2" className="block w-full text-center bg-[#D4AF37] text-black py-5 uppercase tracking-widest text-sm font-bold hover:bg-[#b5952f] transition-all">PILIH PAKET INI</Link>
                                    </div>
                                    {/* TIER 3 */}
                                    <div className="bg-[#111] border border-[#D4AF37]/40 p-8 rounded-sm hover:border-[#D4AF37] transition-colors">
                                        <h3 className="font-serif text-2xl text-white mb-2">The Curator&apos;s Circle</h3>
                                        <div className="text-[#D4AF37] font-serif text-3xl mb-6">Rp 450.000<span className="text-sm text-gray-500 font-sans">/mo</span></div>
                                        <div className="border border-dashed border-[#D4AF37]/50 bg-[#D4AF37]/5 p-4 mb-6 rounded text-center"><p className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-wider mb-1">✨ EXCLUSIVE GIFT</p><p className="text-gray-300 text-xs font-serif italic">Includes &quot;Kawa Daun&quot; Heritage Pack</p></div>
                                        <Link href="/checkout?tier=tier-3" className="block w-full text-center border border-[#D4AF37] text-[#D4AF37] py-4 uppercase tracking-widest text-xs font-bold hover:bg-[#D4AF37] hover:text-black transition-all">JOIN THE CIRCLE</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* MODALS */}
            {showManageModal && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-8 max-w-md w-full relative rounded-sm shadow-2xl">
                        <button onClick={() => setShowManageModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                        {manageStep === 'MENU' ? (
                            <>
                                <h3 className="font-serif text-2xl text-white mb-2">Atur Langganan</h3>
                                <p className="text-gray-400 text-sm mb-8">Paket Aktif: <span className="text-[#D4AF37]">{subscription?.paket_langganan?.nama_tier || 'Standard'}</span></p>
                                <div className="space-y-4">
                                    <button onClick={() => handleUpdateSubscription('Paused')} className="w-full flex items-center justify-center gap-3 bg-[#111] border border-gray-700 hover:border-yellow-500 text-gray-300 hover:text-yellow-500 py-4 rounded transition-all group">
                                        <PauseCircle className="group-hover:text-yellow-500" /><div className="text-left"><span className="block text-sm font-bold uppercase">Jeda Langganan (Pause)</span><span className="block text-[10px] text-gray-500">Lewati pengiriman bulan depan tanpa biaya.</span></div>
                                    </button>
                                    <button onClick={() => setManageStep('CONFIRM_CANCEL')} className="w-full flex items-center justify-center gap-3 bg-[#111] border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-500 py-4 rounded transition-all group">
                                        <X className="group-hover:text-red-500" /><div className="text-left"><span className="block text-sm font-bold uppercase">Batalkan Langganan</span><span className="block text-[10px] text-gray-500">Berhenti berlangganan sepenuhnya.</span></div>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6"><PauseCircle size={32} className="text-[#D4AF37]" /></div>
                                <h3 className="font-serif text-2xl text-white mb-4">Tunggu Sebentar...</h3>
                                <p className="text-gray-300 text-sm leading-relaxed mb-8">Anda bisa <span className="text-[#D4AF37] font-bold">Menjeda (Pause)</span> tanpa kehilangan riwayat.</p>
                                <div className="space-y-3">
                                    <button onClick={() => handleUpdateSubscription('Paused')} className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold py-3 uppercase tracking-widest text-xs transition-all">Ya, Jeda Saja (Recommended)</button>
                                    <button onClick={() => handleUpdateSubscription('Cancelled')} className="w-full bg-transparent border border-red-900/50 text-red-500 hover:bg-red-900/20 font-bold py-3 uppercase tracking-widest text-xs transition-all">Tetap Batalkan</button>
                                </div>
                                <button onClick={() => setManageStep('MENU')} className="mt-6 text-gray-500 text-xs hover:text-white underline cursor-pointer">Kembali</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCalibrationPrompt && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
                    <div className="bg-[#1a1a1a] border border-[#D4AF37] p-8 max-w-md w-full text-center shadow-lg rounded-sm">
                        <h3 className="font-serif text-2xl text-[#D4AF37] mb-2">Mari Kalibrasi Ulang</h3>
                        <p className="text-gray-400 text-sm mb-6">Kami akan menyesuaikan preferensi agar kopi berikutnya lebih pas.</p>
                        <div className="space-y-3">
                            <button onClick={handleCalibrationRedirect} className="w-full bg-[#D4AF37] text-black font-bold py-3 uppercase text-xs">AMBIL ULANG KUIS</button>
                            <button onClick={() => { setShowCalibrationPrompt(false); router.refresh(); }} className="w-full border border-gray-700 text-gray-500 hover:text-white font-bold py-3 uppercase text-xs">NANTI SAJA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}