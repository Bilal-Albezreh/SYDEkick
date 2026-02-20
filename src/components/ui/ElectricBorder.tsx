"use client";

import { useRef, useEffect, ReactNode } from "react";

interface ElectricBorderProps {
    children: ReactNode;
    color?: string;
    speed?: number;       // arc travel speed (lower = faster visual)
    chaos?: number;       // bolt jitter amount (0–0.5)
    borderRadius?: number;
    className?: string;
}

function hexToRgba(hex: string, alpha: number): string {
    const raw = hex.replace("#", "");
    const r = parseInt(raw.substring(0, 2), 16);
    const g = parseInt(raw.substring(2, 4), 16);
    const b = parseInt(raw.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export default function ElectricBorder({
    children,
    color = "#6366f1",
    speed = 1.5,
    chaos = 0.15,
    borderRadius = 24,
    className = "",
}: ElectricBorderProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let t = 0;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);

        // Get a point on the rounded-rect perimeter at fraction f (0–1)
        const perimeterPoint = (f: number, w: number, h: number, r: number): [number, number] => {
            r = Math.min(r, Math.min(w, h) / 2);
            const sW = w - 2 * r;
            const sH = h - 2 * r;
            const arc = (Math.PI / 2) * r;
            const total = 2 * sW + 2 * sH + 4 * arc;
            let pos = ((f % 1) + 1) % 1 * total;

            const segs: Array<() => [number, number]> = [
                () => { const a = Math.PI + (pos / arc) * (Math.PI / 2); return [r + r * Math.cos(a), r + r * Math.sin(a)]; },
                () => [r + (pos / sW) * sW, 0],
                () => { const a = 1.5 * Math.PI + (pos / arc) * (Math.PI / 2); return [w - r + r * Math.cos(a), r + r * Math.sin(a)]; },
                () => [w, r + (pos / sH) * sH],
                () => { const a = (pos / arc) * (Math.PI / 2); return [w - r + r * Math.cos(a), h - r + r * Math.sin(a)]; },
                () => [w - r - (pos / sW) * sW, h],
                () => { const a = 0.5 * Math.PI + (pos / arc) * (Math.PI / 2); return [r + r * Math.cos(a), h - r + r * Math.sin(a)]; },
                () => [0, h - r - (pos / sH) * sH],
            ];
            const lens = [arc, sW, arc, sH, arc, sW, arc, sH];

            for (let i = 0; i < lens.length; i++) {
                if (pos <= lens[i]) return segs[i]();
                pos -= lens[i];
            }
            return [0, r];
        };

        const draw = () => {
            const w = canvas.width;
            const h = canvas.height;
            const r = Math.min(borderRadius, Math.min(w, h) / 2);
            ctx.clearRect(0, 0, w, h);

            t = (t + speed * 0.004) % 1;

            const trailLen = 0.2;
            const segs = 36;

            for (let i = 0; i < segs; i++) {
                const f0 = (t - trailLen + (i / segs) * trailLen + 1) % 1;
                const f1 = (t - trailLen + ((i + 1) / segs) * trailLen + 1) % 1;
                const [x0, y0] = perimeterPoint(f0, w, h, r);
                const [x1, y1] = perimeterPoint(f1, w, h, r);

                // Apply jitter
                const jx = chaos * (Math.random() - 0.5) * 6;
                const jy = chaos * (Math.random() - 0.5) * 6;
                const alpha = Math.pow((i + 1) / segs, 1.6);

                // Glow
                ctx.beginPath();
                ctx.moveTo(x0 + jx, y0 + jy);
                ctx.lineTo(x1 + jx, y1 + jy);
                ctx.strokeStyle = hexToRgba(color, alpha * 0.25);
                ctx.lineWidth = 6;
                ctx.lineCap = "round";
                ctx.stroke();

                // Core
                ctx.beginPath();
                ctx.moveTo(x0 + jx, y0 + jy);
                ctx.lineTo(x1 + jx, y1 + jy);
                ctx.strokeStyle = hexToRgba(color, alpha * 0.85);
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Spark head
            const [hx, hy] = perimeterPoint(t, w, h, r);
            const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8);
            grad.addColorStop(0, "rgba(255,255,255,0.9)");
            grad.addColorStop(0.4, hexToRgba(color, 0.6));
            grad.addColorStop(1, hexToRgba(color, 0));
            ctx.beginPath();
            ctx.arc(hx, hy, 8, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            animRef.current = requestAnimationFrame(draw);
        };
        animRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animRef.current);
            ro.disconnect();
        };
    }, [color, speed, chaos, borderRadius]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ position: "relative", borderRadius }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                    borderRadius,
                }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
        </div>
    );
}
