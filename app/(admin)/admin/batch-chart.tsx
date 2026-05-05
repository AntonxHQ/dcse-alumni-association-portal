'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type BatchPoint = { label: string; count: number };

export function BatchBarChart({ data, title }: Readonly<{ data: BatchPoint[]; title: string }>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-default bg-surface-100 p-5">
        <p className="mb-2 text-xs font-mono uppercase tracking-wide text-foreground-lighter">
          {title}
        </p>
        <p className="text-sm text-foreground-lighter">No data available.</p>
      </div>
    );
  }

  const rotateLabels = data.length > 10;

  return (
    <div className="rounded-lg border border-default bg-surface-100 p-5">
      <p className="mb-4 text-xs font-mono uppercase tracking-wide text-foreground-lighter">
        {title}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#2E2E2E" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6E6E6E', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={rotateLabels ? -45 : 0}
            textAnchor={rotateLabels ? 'end' : 'middle'}
            height={rotateLabels ? 55 : 30}
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
            cursor={{ fill: 'rgba(62,207,142,0.06)' }}
            formatter={(value: number) => [value, 'Alumni']}
          />
          <Bar dataKey="count" fill="#3ECF8E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
