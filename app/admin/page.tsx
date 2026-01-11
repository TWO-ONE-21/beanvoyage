'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import LogoutButton from '@/components/LogoutButton';
import { Package, Truck, CheckCircle, AlertCircle, RefreshCw, Search } from 'lucide-react';

// --- TYPES ---
interface Order {
    delivery_id: string;
    status: string;
    tanggal_kirim: string;
    nomor_resi: string | null;
    User: {
        nama_lengkap: string;
        email: string;
    } | null;
    stok_kopi: {
        nama_origin: string;
    } | null;
}

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [inputResi, setInputResi] = useState<Record<string, string>>({});
    const [updating, setUpdating] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // --- DAFTAR ADMIN ---
    // Harus sinkron dengan Dashboard dan Login
    const ADMIN_EMAILS = [
        'ardoriandaadmin@beanvoyage.com',
        'admin@bean.com'
    ];

    useEffect(() => {
        const initAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                // Logic Security yang Diperbarui (Multi-Admin)
                const currentUserEmail = user?.email?.toLowerCase().trim();

                if (!user || !currentUserEmail || !ADMIN_EMAILS.includes(currentUserEmail)) {
                    console.log("Unauthorized Access. Redirecting...");
                    router.push('/dashboard');
                    return;
                }

                await fetchOrders();

            } catch (err: any) {
                console.error('Admin Init Error:', err);
                setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
            } finally {
                setLoading(false);
            }
        };

        initAdmin();
    }, [router]);

    const fetchOrders = async () => {
        setErrorMsg(null);

        const { data, error } = await supabase
            .from('log_pengiriman')
            .select(`
                delivery_id,
                status,
                tanggal_kirim,
                nomor_resi,
                User:user_id ( nama_lengkap, email ),
                stok_kopi:coffee_id ( nama_origin )
            `)
            .order('tanggal_kirim', { ascending: false });

        if (error) {
            console.error('Supabase Query Error:', error);
            setErrorMsg(`Gagal memuat data: ${error.message} (${error.code})`);
            return;
        }

        setOrders((data as any[]) || []);
    };

    const updateStatus = async (id: string, newStatus: string, resi: string | null = null) => {
        setUpdating(id);

        try {
            const updatePayload: any = { status: newStatus };
            if (resi) updatePayload.nomor_resi = resi;

            const { error } = await supabase
                .from('log_pengiriman')
                .update(updatePayload)
                .eq('delivery_id', id);

            if (error) throw error;

            setOrders(prev => prev.map(order =>
                order.delivery_id === id
                    ? { ...order, ...updatePayload }
                    : order
            ));

            if (resi) {
                setInputResi(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }

        } catch (err: any) {
            alert(`Gagal update status: ${err.message}`);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#D4AF37]">
                <RefreshCw className="animate-spin mr-2" /> VERIFYING ADMIN ACCESS...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans p-8">

            <header className="max-w-7xl mx-auto mb-12 border-b border-[#D4AF37]/30 pb-6 flex justify-between items-center">
                <div>
                    <h1 className="font-serif text-3xl text-[#D4AF37]">BeanVoyage Admin</h1>
                    <p className="text-gray-500 text-xs tracking-widest uppercase mt-1">LOGISTIK & PENGIRIMAN</p>
                </div>

                <div className="flex items-center gap-6">
                    {/* Tombol Back */}
                    <Link href="/dashboard" className="text-gray-400 hover:text-[#D4AF37] text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                        ← KEUANGAN & OPERASIONAL
                    </Link>

                    {/* Tombol Refresh */}
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                    >
                        <RefreshCw size={14} /> REFRESH DATA
                    </button>

                    <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
                    <LogoutButton />
                </div>
            </header>

            {/* ERROR ALERT */}
            {errorMsg && (
                <div className="max-w-7xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-3 text-red-200">
                    <AlertCircle size={20} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* TABLE CONTENT */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-[#111] border border-gray-800 rounded-sm overflow-hidden">

                    {orders.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center text-gray-500">
                            <Package size={48} className="mb-4 opacity-20" />
                            <p className="font-serif text-xl mb-2">Belum ada pesanan masuk</p>
                            <p className="text-sm">Data log pengiriman masih kosong.</p>
                        </div>
                    ) : (
                        // DATA TABLE
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0f0f0f] text-[#D4AF37] text-xs uppercase tracking-widest border-b border-gray-800">
                                    <tr>
                                        <th className="p-6 font-normal">ID & Tanggal</th>
                                        <th className="p-6 font-normal">Pelanggan</th>
                                        <th className="p-6 font-normal">Kopi Origin</th>
                                        <th className="p-6 font-normal">Status Pengiriman</th>
                                        <th className="p-6 font-normal text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {orders.map((order) => {
                                        const currentStatus = (order.status || '').toLowerCase().trim();
                                        return (
                                            <tr key={order.delivery_id} className="hover:bg-white/5 transition-colors">

                                                {/* ID & DATE */}
                                                <td className="p-6 align-top">
                                                    <div className="font-mono text-xs text-gray-500 mb-1">#{order.delivery_id.slice(0, 8)}...</div>
                                                    <div className="text-white text-sm">
                                                        {new Date(order.tanggal_kirim).toLocaleDateString('id-ID', {
                                                            day: 'numeric', month: 'long', year: 'numeric'
                                                        })}
                                                    </div>
                                                </td>

                                                {/* CUSTOMER */}
                                                <td className="p-6 align-top">
                                                    <div className="text-[#D4AF37] font-medium">{order.User?.nama_lengkap || 'Unknown User'}</div>
                                                    <div className="text-xs text-gray-500">{order.User?.email || '-'}</div>
                                                </td>

                                                {/* COFFEE */}
                                                <td className="p-6 align-top">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-gray-600" />
                                                        <span className="text-gray-300">{order.stok_kopi?.nama_origin || 'Unknown Origin'}</span>
                                                    </div>
                                                </td>

                                                {/* STATUS & RESI */}
                                                <td className="p-6 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        <StatusBadge status={order.status} />
                                                        {order.nomor_resi && (
                                                            <div className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded w-fit">
                                                                Resi: {order.nomor_resi}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="p-6 align-top text-right">
                                                    {currentStatus === 'processing' && (
                                                        <div className="flex flex-col items-end gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Input No. Resi"
                                                                className="bg-black border border-gray-700 text-white text-xs p-2 rounded w-40 focus:border-[#D4AF37] outline-none transition-colors"
                                                                value={inputResi[order.delivery_id] || ''}
                                                                onChange={(e) => setInputResi({ ...inputResi, [order.delivery_id]: e.target.value })}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    if (!inputResi[order.delivery_id]) return alert('Masukkan nomor resi terlebih dahulu.');
                                                                    updateStatus(order.delivery_id, 'Shipped', inputResi[order.delivery_id]);
                                                                }}
                                                                disabled={updating === order.delivery_id}
                                                                className="bg-[#D4AF37] text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wide hover:bg-[#b5952f] disabled:opacity-50 transition-colors flex items-center gap-2"
                                                            >
                                                                {updating === order.delivery_id ? <RefreshCw className="animate-spin" size={12} /> : <Truck size={14} />}
                                                                Kirim Barang
                                                            </button>
                                                        </div>
                                                    )}

                                                    {currentStatus === 'shipped' && (
                                                        <button
                                                            onClick={() => updateStatus(order.delivery_id, 'Delivered')}
                                                            disabled={updating === order.delivery_id}
                                                            className="bg-green-700/20 text-green-400 border border-green-700/50 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide hover:bg-green-700/30 disabled:opacity-50 transition-colors flex items-center gap-2 ml-auto"
                                                        >
                                                            {updating === order.delivery_id ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle size={14} />}
                                                            Tiba di Tujuan
                                                        </button>
                                                    )}

                                                    {currentStatus === 'delivered' && (
                                                        <span className="text-xs text-gray-600 italic">Pesanan Selesai</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- HELPER COMPONENT ---
function StatusBadge({ status }: { status: string }) {
    const normalizedStatus = (status || '').toLowerCase().trim();
    switch (normalizedStatus) {
        case 'pending':
        case 'processing': // Handle both just in case
            return <span className="inline-flex items-center gap-1 bg-yellow-900/20 text-yellow-500 border border-yellow-800/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium">{status}</span>;
        case 'shipped':
            return <span className="inline-flex items-center gap-1 bg-blue-900/20 text-blue-400 border border-blue-800/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium">Shipped</span>;
        case 'delivered':
            return <span className="inline-flex items-center gap-1 bg-green-900/20 text-green-500 border border-green-800/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium">Delivered</span>;
        default:
            return <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-400 px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium">{status}</span>;
    }
}