"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface WeeklyActivityChartProps {
    data: { label: string; messages: number; members: number }[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[280px] w-full flex items-center justify-center border border-dashed rounded-xl bg-muted/5">
                <p className="text-xs text-muted-foreground italic">Sem atividade recente registrada</p>
            </div>
        );
    }

    return (
        <div className="h-[280px] w-full" style={{ minHeight: '280px', minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <BarChart data={data}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3337f5" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#3337f5" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#888' }}
                        dy={10}
                    />
                    <YAxis
                        hide
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(51, 55, 245, 0.05)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-xl border border-zinc-200 bg-white/90 backdrop-blur-md p-3 shadow-xl dark:bg-zinc-950/90 dark:border-zinc-800">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] items-center uppercase text-zinc-500 font-bold tracking-wider">
                                                Semana {payload[0].payload.label}
                                            </p>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Mensagens</span>
                                                <span className="text-sm font-bold text-primary">
                                                    {payload[0].value}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-xs text-zinc-600 dark:text-zinc-400">Membros Ativos</span>
                                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                    {payload[1]?.value}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="messages"
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                    />
                    <Bar
                        dataKey="members"
                        fill="#f0f1ff"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
