'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface SentimentChartProps {
    data: { date: string; score: number }[]
}

export function SentimentChart({ data }: SentimentChartProps) {
    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis
                        dataKey="date"
                        hide
                    />
                    <YAxis
                        domain={[0, 100]}
                        hide
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Data</span>
                                                <span className="text-sm font-bold text-zinc-50">
                                                    {payload[0].payload.date}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Score</span>
                                                <span className="text-sm font-bold text-primary">
                                                    {payload[0].value}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3337f5"
                        strokeWidth={4}
                        dot={false}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
