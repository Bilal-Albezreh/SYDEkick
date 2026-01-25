'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MorphNav() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            className="fixed z-50"
            initial={false}
            animate={{
                width: isScrolled ? 'auto' : '100%',
                top: isScrolled ? '1.5rem' : '0',
                left: isScrolled ? '50%' : '0',
                right: isScrolled ? 'auto' : '0',
                x: isScrolled ? '-50%' : '0',
                borderRadius: isScrolled ? '9999px' : '0',
            }}
            transition={{
                duration: 0.4,
                ease: "linear", // Fully linear - no acceleration/deceleration
            }}
        >
            <motion.div
                className={`
          ${isScrolled
                        ? 'bg-black/60 backdrop-blur-xl border border-white/10'
                        : 'bg-zinc-950/50 backdrop-blur-md border-b border-white/10'
                    }
          transition-colors duration-300
        `}
                style={{
                    borderRadius: isScrolled ? '9999px' : '0',
                }}
            >
                <div className={`flex items-center justify-between ${isScrolled ? 'px-6 py-3' : 'px-6 py-4'}`}>
                    {/* Logo - Always Visible */}
                    <Link href="/" className="flex items-center gap-2">
                        <motion.span
                            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500"
                            animate={{
                                fontSize: isScrolled ? '1.125rem' : '1.25rem',
                            }}
                            transition={{
                                duration: 0.4,
                                ease: "linear",
                            }}
                        >
                            SydeKick
                        </motion.span>
                    </Link>

                    {/* Center Navigation Links - Disappears when scrolled */}
                    <AnimatePresence>
                        {!isScrolled && (
                            <motion.div
                                className="hidden md:flex items-center gap-8"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                    duration: 0.3,
                                    ease: "linear",
                                }}
                            >
                                <Link
                                    href="#features"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                                >
                                    Features
                                </Link>
                                <Link
                                    href="#trustedby"
                                    className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                                >
                                    Testimonials
                                </Link>

                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Launch Beta Button - Always Visible */}
                    <motion.div
                        animate={{
                            scale: isScrolled ? 0.95 : 1,
                        }}
                        transition={{
                            duration: 0.4,
                            ease: "linear",
                        }}
                    >
                        <Link
                            href="/dashboard"
                            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/20"
                        >
                            <span>Launch Beta</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </motion.nav>
    );
}
