'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

interface Feature {
    id: number;
    title: string;
    description: string;
    image: string;
    color: string;
}

const features: Feature[] = [
    {
        id: 1,
        title: 'Dashboard',
        description: 'Your homepage. The central command center for your degree.',
        image: '/feature-dashboard.jpg',
        color: 'from-blue-500 to-purple-500',
    },
    {
        id: 2,
        title: 'Grades',
        description: 'GPA Calculator. Track your academic standing in real-time.',
        image: '/feature-grades.jpg',
        color: 'from-green-500 to-emerald-500',
    },
    {
        id: 3,
        title: 'Calendar',
        description: 'Deadlines & OAs. Never miss an assignment or assessment.',
        image: '/feature-calendar.jpg',
        color: 'from-orange-500 to-red-500',
    },
    {
        id: 4,
        title: 'Leaderboard',
        description: 'Social Stats. Compete with friends on study hours and applications.',
        image: '/feature-leaderboard.jpg',
        color: 'from-yellow-500 to-orange-500',
    },
    {
        id: 5,
        title: 'Application Tracker',
        description: 'Kanban Board. Drag-and-drop your way to a co-op offer.',
        image: '/feature-tracker.jpg',
        color: 'from-purple-500 to-pink-500',
    },
];

export default function FeatureStack({ showHeader = true }: { showHeader?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    return (
        <>
            {/* Section Header - Only show if prop is true */}
            {showHeader && (
                <div className="text-center py-20 px-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                        Everything you need, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">in one place</span>
                    </h2>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Scroll to explore the features designed to transform your university experience.
                    </p>
                </div>
            )}

            {/* Desktop: Scroll-Linked Stack */}
            <div ref={containerRef} className="hidden md:block relative h-[500vh]">
                {/* Sticky Wrapper - Centers content vertically and horizontally */}
                <div className="sticky top-0 h-screen flex items-center justify-center">
                    {/* Perspective Container with Glow - MUST have height for absolute children */}
                    <div className="relative w-full h-full max-w-5xl mx-auto px-6" style={{ perspective: '1000px' }}>
                        {/* Glow Orb Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 blur-[120px] rounded-full pointer-events-none" />

                        {/* Render all cards in stack */}
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={feature.id}
                                feature={feature}
                                index={index}
                                totalCards={features.length}
                                scrollYProgress={scrollYProgress}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile: Simple Vertical Stack */}
            <div className="md:hidden py-20 px-6 space-y-12">
                {features.map((feature) => (
                    <div key={feature.id} className="space-y-4">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10">
                            <div className="bg-zinc-800/90 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="relative aspect-video bg-zinc-900">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-zinc-400">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

interface FeatureCardProps {
    feature: Feature;
    index: number;
    totalCards: number;
    scrollYProgress: any;
}

function FeatureCard({ feature, index, totalCards, scrollYProgress }: FeatureCardProps) {
    const cardStart = index / totalCards;
    const cardEnd = (index + 1) / totalCards;

    // Animations for when this card is active
    const rotateX = useTransform(scrollYProgress, [cardStart, cardEnd], [0, 45]);
    const scale = useTransform(scrollYProgress, [cardStart, cardEnd], [1, 0.8]);
    const opacity = useTransform(scrollYProgress, [cardStart, cardEnd], [1, 0]);

    // Only show this card when it's the currently active one
    const isVisible = useTransform(scrollYProgress, (latest: number) => {
        const currentCardIndex = Math.floor(latest * totalCards);
        return currentCardIndex === index ? 'flex' : 'none';
    });

    // Z-index: current card should be on top
    const zIndex = useTransform(scrollYProgress, (latest: number) => {
        const currentCardIndex = Math.floor(latest * totalCards);
        return currentCardIndex === index ? 10 : index;
    });

    return (
        <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-12 p-6"
            style={{
                rotateX,
                scale,
                opacity,
                transformStyle: 'preserve-3d',
                display: isVisible,
                zIndex,
            }}
        >
            {/* Browser Window */}
            <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 relative z-20">
                <div className="bg-zinc-800/90 px-4 py-3 flex items-center gap-2 border-b border-white/5 backdrop-blur-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="ml-4 text-xs text-zinc-500 font-mono">SydeKick — {feature.title}</div>
                </div>
                <div className="relative aspect-video bg-zinc-900">
                    <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover"
                        quality={100}
                        priority={index === 0}
                        unoptimized
                    />
                </div>
            </div>

            {/* Text Content */}
            <div className="text-center max-w-2xl">
                <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-xl text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
        </motion.div>
    );
}
