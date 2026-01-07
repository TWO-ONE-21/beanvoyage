'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Mountain, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// --- STATIC STORY DICTIONARY (Data Enrichment) ---
// Karena database terbatas, kita simpan narasi budaya di sini.
const STORY_DATA: Record<string, any> = {
    'coffee-001': {
        img: 'https://images.unsplash.com/photo-1547364357-6998ce7d4c02?q=85&w=2400&auto=format&fit=crop',
        farmer: 'Ibu Rahmah',
        process: 'Giling Basah (Wet Hulled)',
        harvest: 'September - May',
        altitude: '1,450 MASL',
        region: 'Aceh Highlands',
        story: `In the misty highlands of Takengon, where the air is crisp and the soil is dark with volcanic nutrients, the Gayo Arabica bean begins its journey. This is not merely agriculture; it is a ritual passed down through generations of the Gayo people. Utilizing the unique 'Giling Basah' method, the beans develop a legendary body and heavy, earthy spice notes that are unmistakably Indonesian. Each sip is a testament to the resilience of the farmers who tend these gardens under the shadow of the Burni Telong volcano.`
    },
    'coffee-002': {
        img: 'https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=2071&auto=format&fit=crop',
        farmer: 'Pak Nyoman',
        process: 'Full Washed',
        harvest: 'June - September',
        altitude: '1,200 MASL',
        region: 'Kintamani, Bali',
        story: `Under the watchful eye of Mount Batur, the coffee trees of Kintamani grow alongside citrus orchards, absorbing the fragrant oils into their very roots. The Subak irrigation system, a UNESCO heritage, waters these lands, connecting the spiritual to the physical. Pak Nyoman treats every cherry as an offering to the gods. The result is a cup that defies the traditional heavy profile of Indonesia—bright, citrusy, and dancing with the sweetness of brown sugar.`
    },
    'coffee-003': {
        img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1956&auto=format&fit=crop',
        farmer: 'Ambe\' Datu',
        process: 'Toraja Washed',
        harvest: 'May - August',
        altitude: '1,600 MASL',
        region: 'Tana Toraja, Sulawesi',
        story: `High in the celestial mountains of Sulawesi, the Toraja people live by the philosophy of Aluk Todolo. Coffee here is grown on steep, misty slopes that demand immense physical labor to harvest. The beans are known for their profound depth—a brooding, syrupy body with notes of dark chocolate and forest spices. To drink Toraja Kalosi is to taste the ancient mysteries of the land of heavenly kings.`
    }
};

export default function StoryPage() {
    const params = useParams();
    const router = useRouter();
    const [coffeeData, setCoffeeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const id = params?.id as string;
    const story = STORY_DATA[id]; // Ambil data cerita berdasarkan ID

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            // Ambil data teknis (Acidity/Body) dari Database
            const { data, error } = await supabase
                .from('stok_kopi')
                .select(`
                    *,
                    metadata_rasa_kopi (
                        level_acidity,
                        level_body,
                        tasting_notes
                    )
                `)
                .eq('coffee_id', id)
                .single();

            if (data) {
                setCoffeeData(data);
            }
            setLoading(false);
        };

        fetchData();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#D4AF37] tracking-widest text-xs">LOADING STORY...</div>;

    if (!story || !coffeeData) return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
            <h1 className="font-serif text-3xl mb-4">Story Not Found</h1>
            <p className="text-gray-500 mb-8">Kisah untuk kopi ini belum tertulis dalam arsip kami.</p>
            <Link href="/dashboard" className="text-[#D4AF37] border-b border-[#D4AF37] pb-1 hover:text-white transition">Back to Dashboard</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#D4AF37] selection:text-black">

            {/* HERO SECTION */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10"></div>

                {/* Background Image */}
                {/* Background Image - BARU */}
                <div className="absolute inset-0">
                    <Image
                        src={story.img}
                        alt={coffeeData.nama_origin}
                        fill
                        className="object-cover transition-transform duration-1000 hover:scale-105"
                        priority
                    />
                </div>

                {/* Hero Text */}
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-20 z-20">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] mb-6 transition-colors text-xs tracking-widest uppercase">
                        <ArrowLeft size={14} /> Kembali ke Dashboard
                    </Link>
                    <h1 className="font-serif text-5xl md:text-7xl text-[#D4AF37] mb-4 drop-shadow-lg">
                        The Soul of {coffeeData.nama_origin}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 font-serif italic opacity-90 max-w-2xl">
                        "A journey from the volcanic soils of {story.region} to your cup."
                    </p>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="max-w-5xl mx-auto px-6 py-16 -mt-20 relative z-30">

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    <div className="bg-[#111] border border-gray-800 p-6 text-center rounded-sm hover:border-[#D4AF37]/50 transition-colors">
                        <Mountain className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" />
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">REGION & ALTITUDE</p>
                        <p className="font-serif text-xl text-white">{story.region}</p>
                        <p className="text-sm text-gray-400">{story.altitude}</p>
                    </div>
                    <div className="bg-[#111] border border-gray-800 p-6 text-center rounded-sm hover:border-[#D4AF37]/50 transition-colors">
                        <div className="w-6 h-6 mx-auto mb-3 flex items-center justify-center border border-[#D4AF37] rounded-full text-[#D4AF37] text-xs font-serif">P</div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">PROCESS</p>
                        <p className="font-serif text-xl text-white">{story.process}</p>
                        <p className="text-sm text-gray-400">Small Batch</p>
                    </div>
                    <div className="bg-[#111] border border-gray-800 p-6 text-center rounded-sm hover:border-[#D4AF37]/50 transition-colors">
                        <Calendar className="w-6 h-6 text-[#D4AF37] mx-auto mb-3" />
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">HARVEST</p>
                        <p className="font-serif text-xl text-white">{story.harvest}</p>
                        <p className="text-sm text-gray-400">Current Season</p>
                    </div>
                </div>

                {/* NARRATIVE & STATS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16">

                    {/* Left: The Story */}
                    <div className="md:col-span-7">
                        <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-6 block flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-[#D4AF37]"></span> THE JOURNEY
                        </span>

                        <div className="prose prose-invert prose-lg text-gray-300 font-serif leading-loose">
                            <p>
                                {/* DROP CAP FIX: Leading tight & Margin Top */}
                                <span className="float-left text-7xl font-serif text-[#D4AF37] mr-4 leading-[0.75] mt-2">
                                    {story.story.charAt(0)}
                                </span>
                                {story.story.slice(1)}
                            </p>
                            <p className="mt-8 text-base font-sans text-gray-400">
                                Cultivated by <span className="text-white font-bold">{story.farmer}</span>, this lot was selected for its exceptional character. The beans are hand-picked at peak ripeness, ensuring that only the finest cherries make it to the pulping station. It is a labor of love, requiring patience and a deep understanding of the land.
                            </p>
                        </div>
                    </div>

                    {/* Right: Technical Profile */}
                    <div className="md:col-span-5 space-y-12">
                        <div>
                            <h3 className="font-serif text-xl text-[#D4AF37] mb-8 uppercase tracking-widest text-sm">Taste Profile</h3>

                            {/* Acidity Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase tracking-wide">
                                    <span>Acidity</span>
                                    <span>{coffeeData.metadata_rasa_kopi[0].level_acidity}/5</span>
                                </div>
                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#D4AF37]"
                                        style={{ width: `${(coffeeData.metadata_rasa_kopi[0].level_acidity / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Body Bar */}
                            <div className="mb-8">
                                <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase tracking-wide">
                                    <span>Body</span>
                                    <span>{coffeeData.metadata_rasa_kopi[0].level_body}/5</span>
                                </div>
                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#D4AF37]"
                                        style={{ width: `${(coffeeData.metadata_rasa_kopi[0].level_body / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Tasting Notes */}
                            <div>
                                <p className="text-xs text-gray-500 mb-4 uppercase tracking-wide">TASTING NOTES</p>
                                <div className="flex flex-wrap gap-2">
                                    {coffeeData.metadata_rasa_kopi[0].tasting_notes.split(',').map((note: string, i: number) => (
                                        <span key={i} className="border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-full text-xs uppercase tracking-wide hover:bg-[#D4AF37] hover:text-black transition-colors cursor-default">
                                            {note.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[#111] border border-gray-800 rounded text-center">
                            <p className="font-serif text-gray-400 italic mb-4">"A true reflection of its terroir."</p>
                            <Link href="/dashboard" className="bg-[#D4AF37] text-black px-6 py-3 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-[#b5952f] transition block w-full">
                                KEMBALI KE DASHBOARD
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}