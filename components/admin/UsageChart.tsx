"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UsageChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['var(--brand-500)', 'var(--brand-600)', 'var(--brand-400)'];

export function UsageChart({ data }: UsageChartProps) {
    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4A90E2" stopOpacity={1} />
                            <stop offset="100%" stopColor="#357ABD" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                        textAnchor="middle"
                        interval={0}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '12px',
                            color: 'var(--foreground)'
                        }}
                        itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                        cursor={{ fill: 'var(--card-hover)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
