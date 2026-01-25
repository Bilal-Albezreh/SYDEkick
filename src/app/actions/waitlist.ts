'use server';

import { createClient } from '@/utils/supabase/server';

export interface WaitlistResult {
    success: boolean;
    error?: string;
}

export async function submitWaitlist(formData: FormData): Promise<WaitlistResult> {
    const email = formData.get('email') as string;

    // Basic email validation
    if (!email || !email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address' };
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('waitlist')
            .insert({ email });

        if (error) {
            // Handle duplicate email error specifically
            if (error.code === '23505') {
                return { success: false, error: 'This email is already on the waitlist' };
            }

            console.error('Waitlist submission error:', error);
            return { success: false, error: 'Something went wrong. Please try again.' };
        }

        return { success: true };
    } catch (err) {
        console.error('Unexpected error:', err);
        return { success: false, error: 'Something went wrong. Please try again.' };
    }
}
