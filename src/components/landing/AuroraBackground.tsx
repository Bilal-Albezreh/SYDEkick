export default function AuroraBackground() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden">
            {/* Base Layer - Deep Black/Grey */}
            <div className="absolute inset-0 bg-zinc-950" />

            {/* Noise Texture Overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'url(/noise.svg)',
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Aurora Orbs - Multi-Point Ambient Mesh */}
            <div className="absolute inset-0">
                {/* Orb 1 - Top Left (Purple) */}
                <div
                    className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-600/50 rounded-full blur-[120px] animate-pulse"
                    style={{
                        animationDuration: '8s',
                        animationTimingFunction: 'ease-in-out',
                    }}
                />

                {/* Orb 2 - Top Right (Teal/Greenish Accent) */}
                <div
                    className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-teal-500/40 rounded-full blur-[140px] animate-pulse"
                    style={{
                        animationDuration: '10s',
                        animationDelay: '2s',
                        animationTimingFunction: 'ease-in-out',
                    }}
                />

                {/* Orb 3 - Center/Bottom (Blue) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/40 rounded-full blur-[130px]" />

                {/* Optional Orb 4 - Bottom Left for more atmosphere */}
                <div
                    className="absolute -bottom-20 -left-40 w-[700px] h-[700px] bg-indigo-600/35 rounded-full blur-[110px] animate-pulse"
                    style={{
                        animationDuration: '12s',
                        animationDelay: '4s',
                        animationTimingFunction: 'ease-in-out',
                    }}
                />

                {/* Optional Orb 5 - Bottom Right for balance */}
                <div className="absolute bottom-0 -right-40 w-[650px] h-[650px] bg-violet-600/30 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
