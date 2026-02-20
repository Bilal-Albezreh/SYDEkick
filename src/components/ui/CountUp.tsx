"use client";
import { animate, useInView } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

export default function CountUp({
    to,
    from: initialFrom,
    delay = 0,
    duration = 2,
    className = '',
    startWhen = true,
    separator = '',
    decimals = 2,
    onStart,
    onEnd,
}: any) {
    const ref = useRef<HTMLSpanElement>(null);
    const fromValue = initialFrom !== undefined ? initialFrom : to / 2;
    const isInView = useInView(ref, { once: true });

    const formatValue = useCallback(
        (latest: number) => {
            // Show decimals only once we've hit the target's whole number
            const isCloseToTarget = Math.floor(latest) >= Math.floor(to);
            return Intl.NumberFormat('en-US', {
                useGrouping: !!separator,
                minimumFractionDigits: isCloseToTarget ? decimals : 0,
                maximumFractionDigits: isCloseToTarget ? decimals : 0,
            }).format(latest);
        },
        [to, separator, decimals]
    );

    useEffect(() => {
        if (ref.current) ref.current.textContent = formatValue(fromValue);
    }, [fromValue, formatValue]);

    useEffect(() => {
        if (!isInView || !startWhen) return;
        if (typeof onStart === 'function') onStart();

        const wholeTarget = Math.floor(to);
        const decimalDuration = 0.4; // slow settle for the decimal part
        const sprintDuration = Math.max(duration - decimalDuration, 0.3);

        const update = (latest: unknown) => {
            if (ref.current) ref.current.textContent = formatValue(latest as number);
        };

        let phase2: { stop: () => void } | null = null;

        // Phase 1: fast sprint to the whole number
        const phase1 = animate(fromValue, wholeTarget, {
            duration: sprintDuration,
            delay,
            ease: [0.15, 0.6, 0.2, 1],
            onUpdate: update,
            onComplete: () => {
                // Phase 2: slow settle into the decimal
                phase2 = animate(wholeTarget, to, {
                    duration: decimalDuration,
                    ease: 'easeOut',
                    onUpdate: update,
                    onComplete: () => {
                        if (ref.current) {
                            ref.current.textContent = Intl.NumberFormat('en-US', {
                                useGrouping: !!separator,
                                minimumFractionDigits: decimals,
                                maximumFractionDigits: decimals,
                            }).format(to);
                        }
                        if (typeof onEnd === 'function') onEnd();
                    },
                });
            },
        });

        return () => { phase1.stop(); phase2?.stop(); };
    }, [isInView, startWhen, fromValue, to, duration, delay, separator, decimals, formatValue, onStart, onEnd]);

    return <span className={className} ref={ref} />;
}
