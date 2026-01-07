import Link from 'next/link';
import React from 'react';
import SpotlightBackground from '@/components/SpotlightBackground';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-[#D4AF37] selection:text-black">

      {/* Dynamic Background */}
      <SpotlightBackground />

      {/* Hero Content */}
      <div className="relative z-20 max-w-4xl px-6 text-center">

        {/* Brand/Logo Placeholder (Text for now) */}
        <div className="mb-8 animate-fade-in">
          <span className="font-serif text-gold-metallic text-2xl tracking-[0.2em] font-bold drop-shadow-md">
            BEANVOYAGE
          </span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight mb-8 text-white drop-shadow-2xl">
          Orchestrating the <br />
          <span className="text-gold-metallic italic">
            Archipelago&apos;s Symphony
          </span>
        </h1>

        <p className="font-sans text-gray-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed tracking-wide mb-12">
          Menyingkap melodi tersembunyi dari kopi terbaik Nusantara. Setiap biji membawa kisah tentang tanah vulkanik, kearifan tradisi, dan dedikasi tangan petani yang merawatnya sepenuh hati.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Link
            href="/quiz"
            className="w-full md:w-auto px-10 py-4 bg-gold-metallic text-black font-bold text-xs md:text-sm uppercase tracking-[0.15em] transition-all transform hover:translate-y-[-2px] rounded-sm shadow-[0_4px_14px_0_rgba(212,175,55,0.39)]"
          >
            MULAI EKSPLORASI
          </Link>

          <Link
            href="/auth/login"
            className="w-full md:w-auto px-10 py-4 border border-[#D4AF37]/50 hover:border-[#D4AF37] text-[#D4AF37] font-bold text-xs md:text-sm uppercase tracking-[0.15em] transition-all hover:bg-[#D4AF37]/5 rounded-sm"
          >
            Member Login
          </Link>
        </div>

      </div>

      {/* Footer / Copyright */}
      {/* Ganti 'absolute' jadi 'relative' + 'mt-16' agar dia punya jarak aman dari tombol */}
      <div className="relative mt-9 mb-6 text-center w-full z-20 opacity-60">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-sans">
          &copy; {new Date().getFullYear()} BEANVOYAGE. KURASI KOPI TERBAIK INDONESIA.
        </p>
      </div>

    </main>
  );
}
