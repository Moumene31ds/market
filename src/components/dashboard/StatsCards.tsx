'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Coins, DollarSign, AlertTriangle, ShoppingBag, Percent } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalOrdersCount: number;
    totalRevenue: number;
    totalCOGS: number;
    totalProfit: number;
    profitMargin: number;
    lowStockCount: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cardItems = [
    {
      title: 'إجمالي الإيرادات (المبيعات)',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'text-violet-400 border-violet-500/20 bg-violet-950/5',
      desc: 'إجمالي المبيعات المحققة',
    },
    {
      title: 'تكلفة البضاعة المباعة (COGS)',
      value: formatCurrency(stats.totalCOGS),
      icon: Coins,
      color: 'text-amber-400 border-amber-500/20 bg-amber-950/5',
      desc: 'سعر شراء المنتجات المباعة',
    },
    {
      title: 'صافي الأرباح الإجمالية',
      value: formatCurrency(stats.totalProfit),
      icon: DollarSign,
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/5',
      desc: 'المبيعات ناقص تكلفة البضائع',
    },
    {
      title: 'هامش الربح المتوسط',
      value: `${stats.profitMargin}%`,
      icon: Percent,
      color: 'text-blue-400 border-blue-500/20 bg-blue-950/5',
      desc: 'نسبة الربح من المبيعات الكلية',
    },
    {
      title: 'عدد الفواتير المكتملة',
      value: `${stats.totalOrdersCount} فاتورة`,
      icon: ShoppingBag,
      color: 'text-indigo-400 border-indigo-500/20 bg-indigo-950/5',
      desc: 'عدد عمليات البيع الناجحة',
    },
    {
      title: 'تنبيهات انخفاض المخزون',
      value: `${stats.lowStockCount} منتجات`,
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? 'text-rose-400 border-rose-500/30 bg-rose-950/10 animate-pulse' : 'text-slate-400 border-slate-800 bg-slate-900/10',
      desc: 'منتجات وصلت للحد الأدنى المسموح',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cardItems.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`flex flex-col justify-between p-4.5 rounded-2xl border backdrop-blur-md transition-all duration-200 hover:scale-[1.01] ${card.color}`}
          >
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-400 font-semibold text-xxs tracking-wide">{card.title}</span>
              <div className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <Icon size={16} />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-100 font-mono tracking-tight leading-none">
                {card.value}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{card.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
