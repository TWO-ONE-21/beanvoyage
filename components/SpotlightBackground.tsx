'use client';

import React, { useEffect, useRef } from 'react';

export default function SpotlightBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            requestAnimationFrame(() => {
                // ANCHOR POINT: (70, 0)
                // Left 20px (container) + 50px (pivot offset) = 70px absolute X
                // Top 0px absolute Y
                const anchorX = 70;
                const anchorY = 0;

                const dx = e.clientX - anchorX;
                const dy = e.clientY - anchorY;

                // 1. Calculate Angle
                const angleRad = Math.atan2(dy, dx);

                // 2. Clamp Rotation: 0 to 90 degrees (Horizontal Right to Vertical Down)
                const clampedAngle = Math.max(0, Math.min(Math.PI / 1.5, angleRad));

                if (containerRef.current) {
                    containerRef.current.style.transform = `rotate(${clampedAngle}rad)`;
                }
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a0a0a]">

            {/* 1. Ambient Background Glow (Static) */}
            <div
                className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
            ></div>

            {/* ROTATING CONTAINER */}
            {/* Locks Lamp + Beam together */}
            <div
                ref={containerRef}
                className="absolute top-0 left-[20px] w-0 h-0 z-10 will-change-transform"
                style={{
                    // Pivot at (50, 0) which aligns with the SVG's Yoke Mount
                    transformOrigin: '50px 0px'
                }}
            >
                {/* 2. LIGHT BEAM (Corrected Coordinates) */}
                {/* 
                   Target: Center of Lens 
                   SVG Lens Center is approx at (100, 50).
                   So Beam 'left' should be ~100px.
                   Beam 'top' should center around 50px.
                */}
                <div
                    className="absolute z-0 pointer-events-none origin-left"
                    style={{
                        top: '-100px', // Center Y (50) - Half Height (150) = -100
                        left: '100px', // Start at Lens X
                        width: '200vh',
                        height: '300px',
                        background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.4) 0%, rgba(212, 175, 55, 0) 80%)',
                        // CLIP-PATH: Fanning out cone
                        // 0% X is the source (Lens).
                        // Y range 45%-55% (10% height) -> Fanning to 0%-100%
                        clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)',
                        filter: 'blur(30px)',
                    }}
                ></div>

                {/* 3. PHYSICAL LAMP SVG */}
                {/* Positioned at (0,0) so its (50,0) yoke aligns with parent pivot */}
                <div className="absolute top-0 left-0 w-[150px] h-[150px] z-10">
                    <svg
                        width="150"
                        height="150"
                        viewBox="0 0 150 150"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.9))' }}
                    >
                        {/* YOKE BRACKET (Pivot at 50,0) */}
                        <rect x="45" y="0" width="10" height="20" fill="#111" stroke="#333" />
                        <path d="M50 20 C20 20 20 80 50 80" fill="none" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="4" fill="#111" stroke="#D4AF37" strokeWidth="2" />

                        {/* LAMP BODY */}
                        <path d="M50 30 L100 25 L100 75 L50 70 Z" fill="#080808" stroke="#D4AF37" strokeWidth="2" />

                        {/* Heat Fins */}
                        <path d="M50 30 C35 30 35 70 50 70" fill="#111" stroke="#333" strokeWidth="1" />
                        <line x1="42" y1="35" x2="42" y2="65" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.3" />
                        <line x1="46" y1="34" x2="46" y2="66" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.3" />

                        {/* Lens Ring (Center X=100, Y=50) */}
                        <rect x="100" y="24" width="8" height="52" rx="2" fill="#222" stroke="#D4AF37" strokeWidth="2" />

                        {/* Barn Doors */}
                        <path d="M104 24 L140 0 L150 5 L108 24 Z" fill="#D4AF37" fillOpacity="0.9" stroke="black" strokeWidth="0.5" />
                        <path d="M104 76 L140 100 L150 95 L108 76 Z" fill="#D4AF37" fillOpacity="0.9" stroke="black" strokeWidth="0.5" />
                        <path d="M108 24 L108 76" stroke="#000" strokeWidth="2" strokeOpacity="0.5" />
                    </svg>
                </div>
            </div>

            {/* 4. Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay z-20"></div>
        </div>
    );
}
