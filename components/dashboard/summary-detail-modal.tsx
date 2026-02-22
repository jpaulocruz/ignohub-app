'use client'

import { LucideX, LucideCalendar, LucideZap } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

                    {summary.highlights && Object.keys(summary.highlights).length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-foreground">Highlights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(summary.highlights).map(([key, value]: [string, any]) => (
                                    <div key={key} className="p-3 rounded-lg border border-border bg-card flex gap-3">
                                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                            <LucideZap className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">{key}</p>
                                            <p className="text-sm text-foreground font-medium mt-0.5">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
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
