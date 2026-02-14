'use client'

import { LucideX, LucideCalendar, LucideZap, LucideCheckCircle2 } from 'lucide-react'

interface SummaryDetailModalProps {
    summary: {
        id: string
        summary_text: string
        highlights: any
        period_start: string
        period_end: string
    }
    onClose: () => void
}

export function SummaryDetailModal({ summary, onClose }: SummaryDetailModalProps) {
    const startDate = new Date(summary.period_start).toLocaleString('pt-BR')
    const endDate = new Date(summary.period_end).toLocaleString('pt-BR')

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl p-6 overflow-y-auto">
            <div className="max-w-3xl w-full bg-zinc-900/50 border border-zinc-800 p-10 rounded-[40px] shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
                >
                    <LucideX className="h-6 w-6" />
                </button>

                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                            <LucideCalendar className="h-3 w-3" />
                            Período de Análise
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter">
                            {startDate} - {endDate}
                        </h2>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl whitespace-pre-wrap text-zinc-300 font-medium leading-relaxed">
                            {summary.summary_text}
                        </div>
                    </div>

                    {summary.highlights && Object.keys(summary.highlights).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-white tracking-tight">Destaques Detectados</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(summary.highlights).map(([key, value]: [string, any]) => (
                                    <div key={key} className="p-4 rounded-2xl bg-indigo-600/5 border border-indigo-600/10 flex gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                            <LucideZap className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{key}</p>
                                            <p className="text-sm text-zinc-300 font-medium mt-0.5">{JSON.stringify(value)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-xl transition-all"
                    >
                        FECHAR DETALHES
                    </button>
                </div>
            </div>
        </div>
    )
}
