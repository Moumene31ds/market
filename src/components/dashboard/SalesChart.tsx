'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesChartProps {
  data: {
    date: string;
    sales: number;
    profit: number;
    cogs: number;
  }[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-80 bg-slate-950/20 border border-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
        جاري رسم المخطط البياني للمبيعات...
      </div>
    );
  }

  return (
    <div className="w-full h-[340px] bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
      <div className="mb-3">
        <h4 className="font-bold text-xs text-slate-300">مخطط الإيرادات والأرباح وتكلفة البضاعة المباعة (آخر 7 أيام)</h4>
        <span className="text-[10px] text-slate-500 block">يقارن حركة التدفقات النقدية بالأرباح الصافية المحققة</span>
      </div>

      <div className="flex-1 w-full text-xxs font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontSize: '11px',
                textAlign: 'right'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#a78bfa' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconSize={10} 
              fontSize={10}
              wrapperStyle={{ fontSize: '11px' }}
            />
            <Area
              type="monotone"
              name="الإيرادات"
              dataKey="sales"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#salesGrad)"
            />
            <Area
              type="monotone"
              name="صافي الأرباح"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#profitGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
