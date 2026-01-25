'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

export default function HeroImage() {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress relative to the container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    // Transform scroll progress into rotation and scale values
    // Initial: rotateX(8deg), scale(0.95)
    // On scroll: rotateX increases (tilts back), scale decreases slightly
    const rotateX = useTransform(scrollYProgress, [0, 1], [8, 25]);
    const scale = useTransform(scrollYProgress, [0, 1], [0.95, 0.85]);
    const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.5]);

    return (
        <div ref={containerRef} className="mt-20 relative" style={{ perspective: '1000px' }}>
            {/* Glow Orb */}
            <motion.div
                className="absolute -inset-10 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 blur-[80px] rounded-full"
                style={{ opacity }}
            />

            {/* Dashboard Image with Scroll-Driven Animation */}
            <motion.div
                className="relative transform-gpu"
                style={{
                    rotateX,
                    scale
                }}
            >
                <Image
                    src="/dashboard-preview.png"
                    alt="SydeKick Dashboard"
                    width={1200}
                    height={800}
                    className="rounded-xl shadow-2xl border border-white/20 mx-auto"
                    priority
                    quality={100}
                />
            </motion.div>
        </div>
    );
}
