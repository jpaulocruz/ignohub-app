"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UsageChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#3182CE', '#00B5D8', '#4299E1'];

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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#A3AED0', fontSize: 10, fontWeight: 'bold' }}
                        textAnchor="middle"
                        interval={0}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#A3AED0', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0B1437',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
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
