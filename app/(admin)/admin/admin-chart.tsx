'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ChartPoint = { month: string; count: number };

export function AlumniGrowthChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="rounded-lg border border-default bg-surface-100 p-5">
      <p className="mb-4 text-xs font-mono uppercase tracking-wide text-foreground-lighter">
        Alumni Growth (Last 12 Months)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3ECF8E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3ECF8E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#2E2E2E" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6E6E6E', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6E6E6E', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2A2A2A',
              border: '1px solid #2E2E2E',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#EDEDED',
            }}
            cursor={{ stroke: '#3ECF8E', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3ECF8E"
            strokeWidth={2}
            fill="url(#brandGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#3ECF8E', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
