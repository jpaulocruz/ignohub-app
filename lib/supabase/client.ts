import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Defensive check to avoid crashing the browser boot if variables are missing
    if (!url || !anonKey) {
        if (typeof window !== 'undefined') {
            console.error(
                '@supabase/ssr: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing! ' +
                'Please add them to your Vercel Project Settings.'
            )
        }
    }

    return createBrowserClient<Database>(
        url || '',
        anonKey || ''
    )
}
