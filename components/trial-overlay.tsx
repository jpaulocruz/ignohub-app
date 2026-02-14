'use client'

import { LucideLock, LucideCreditCard, LucideLogOut } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function TrialOverlay() {
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-6">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-12 rounded-[40px] shadow-2xl space-y-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                    <LucideLock className="h-10 w-10 text-red-500" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Período de Teste Expirado</h2>
                    <p className="text-zinc-400 font-medium leading-relaxed">
                        Seu trial de 7 dias chegou ao fim. Para continuar acessando os resumos e métricas da sua organização, ative uma assinatura agora.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/billing"
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-primary/20"
                    >
                        <LucideCreditCard className="h-5 w-5" />
                        ATIVAR ASSINATURA
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 text-zinc-500 hover:text-white font-bold py-2 transition-colors text-sm"
                    >
                        <LucideLogOut className="h-4 w-4" />
                        Sair da conta
                    </button>
                </div>

                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest pt-4 border-t border-zinc-800">
                    IgnoHub &bull; Analytics for WhatsApp & Telegram
                </p>
            </div>
        </div>
    )
}
