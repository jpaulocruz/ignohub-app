'use client'

import { LucideX, LucideCalendar, LucideZap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SummaryDetailModalProps {
    summary: {
        id: string
        summary_text: string
        highlights: Record<string, unknown> | null | undefined
        consultative_advice?: {
            advice: string
            recommendations: string[]
            community_health_score: number
        } | null
        period_start: string
        period_end: string
    }
    onClose: () => void
}

export function SummaryDetailModal({ summary, onClose }: SummaryDetailModalProps) {
    const startDate = new Date(summary.period_start).toLocaleString('pt-BR')
    const endDate = new Date(summary.period_end).toLocaleString('pt-BR')

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6 overflow-y-auto">
            <div className="max-w-2xl w-full bg-card border border-border p-6 rounded-xl shadow-xl relative animate-in fade-in zoom-in duration-200">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4 h-8 w-8"
                >
                    <LucideX className="h-4 w-4" />
                </Button>

                <div className="space-y-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <LucideCalendar className="h-3.5 w-3.5" />
                            Analysis period
                        </div>
                        <h2 className="text-lg font-semibold text-foreground leading-snug">
                            {startDate} — {endDate}
                        </h2>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {summary.summary_text}
                        </p>
                    </div>

                    {summary.consultative_advice && (
                        <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <LucideZap className="h-4 w-4 fill-primary" />
                                IgnoHub Intelligence Advice
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-foreground font-medium leading-relaxed">
                                    {summary.consultative_advice.advice}
                                </p>

                                {summary.consultative_advice.recommendations && summary.consultative_advice.recommendations.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommendations</p>
                                        <ul className="space-y-1.5">
                                            {summary.consultative_advice.recommendations.map((rec, i) => (
                                                <li key={i} className="text-xs text-foreground flex gap-2">
                                                    <span className="text-primary">•</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <Button onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}
