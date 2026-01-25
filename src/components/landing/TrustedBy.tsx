import Image from 'next/image';

export default function TrustedBy() {
    return (
        <section className="max-w-5xl mx-auto mt-24 mb-20 relative">
            {/* Floating Glass Capsule - "Thin Ice" Effect */}
            <div className="relative rounded-3xl border border-white/10 bg-zinc-900/20 backdrop-blur-2xl shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] py-12 px-6 overflow-hidden">
                {/* Subtle Shine Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Headline */}
                    <p className="text-center text-sm font-medium text-zinc-500 uppercase tracking-widest mb-10">
                        Trusted by top University talent at
                    </p>

                    {/* Logo Grid */}
                    <div className="flex items-center justify-center gap-12 flex-wrap">
                        <Image
                            src="/uwaterloo-logo.png"
                            alt="University of Waterloo"
                            width={80}
                            height={80}
                            className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        />
                        <Image
                            src="/ubc-logo.png"
                            alt="UBC"
                            width={80}
                            height={80}
                            className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        />
                        <Image
                            src="/uoft-logo.jpg"
                            alt="University of Toronto"
                            width={80}
                            height={80}
                            className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-full"
                        />
                        <Image
                            src="/guelph-logo.jpg"
                            alt="University of Guelph"
                            width={80}
                            height={80}
                            className="grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 rounded-full"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
