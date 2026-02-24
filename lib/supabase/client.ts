import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Defensive check to avoid crashing the browser boot if variables are missing
    if (!url || !anonKey) {
        if (typeof window !== 'undefined') {
            console.error(
                'CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing! ' +
                '1. Go to Vercel Dashboard -> Project Settings -> Environment Variables.\n' +
                '2. Add both variables to the PRODUCTION environment.\n' +
                '3. TRIGGER A NEW DEPLOYMENT (Redeploy).'
            )
        }
        // Return a dummy client proxy to prevent @supabase/ssr from throwing its own required field error
        // This will still fail on actual calls, but won't crash the entire JS bundle boot.
        return {
            auth: {
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        maybeSingle: () => Promise.resolve({ data: null, error: null }),
                        single: () => Promise.resolve({ data: null, error: null }),
                    })
                })
            })
        } as any
    }

    return createBrowserClient<Database>(
        url,
        anonKey
    )
}
