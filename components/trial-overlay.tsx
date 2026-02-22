'use client'

import { LucideLock, LucideCreditCard, LucideLogOut } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function TrialOverlay() {
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
            <div className="max-w-sm w-full bg-card border border-border p-8 rounded-xl shadow-xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <LucideLock className="h-6 w-6 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">Trial expired</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your 7-day trial has ended. Activate a subscription to continue accessing your organization's summaries and metrics.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button asChild className="gap-2">
                        <Link href="/billing">
                            <LucideCreditCard className="h-4 w-4" />
                            Activate subscription
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
                        <LucideLogOut className="h-4 w-4" />
                        Sign out
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground border-t border-border pt-4">
                    IgnoHub · Analytics for WhatsApp & Telegram
                </p>
            </div>
        </div>
    )
}
