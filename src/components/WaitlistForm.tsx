'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitWaitlist } from '@/app/actions/waitlist';

export default function WaitlistForm() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('email', email);

        startTransition(async () => {
            const result = await submitWaitlist(formData);

            if (result.success) {
                setSuccess(true);
                setEmail('');
            } else {
                setError(result.error || 'Something went wrong');
            }
        });
    };

    if (success) {
        return (
            <div className="mt-10 flex items-center justify-center gap-3 text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                <p className="text-lg font-medium">You&apos;re on the list!</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-10 w-full max-w-md mx-auto">
            <div className={`relative p-1 rounded-full bg-white/5 border transition-colors ${error ? 'border-red-500/50' : 'border-white/10'
                }`}>
                <div className="flex items-center">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={isPending}
                        className="w-full bg-transparent border-none text-white px-6 py-3 outline-none placeholder:text-zinc-500 disabled:opacity-50"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isPending}
                        className="m-1 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-medium"
                    >
                        {isPending ? 'Joining...' : 'Join Waitlist'}
                    </button>
                </div>
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
            )}
        </form>
    );
}
