'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // 1. Sign Out from Supabase
            await supabase.auth.signOut();

            // 2. Clear Local Storage (Clean state)
            localStorage.clear();

            // 3. Redirect to Home
            router.push('/');
        } catch (error) {
            console.error("Logout Failed", error);
            // Force redirect anyway
            router.push('/');
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="group flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] transition-colors"
            title="Sign Out"
        >
            <span className="text-[10px] uppercase font-bold tracking-widest group-hover:underline decoration-[#D4AF37]/50 underline-offset-4">
                Logout
            </span>
            {/* Simple Log Out Icon (SVG) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70 group-hover:opacity-100"
            >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
        </button>
    );
}
