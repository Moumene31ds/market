import React from 'react';
import { getDashboardStats } from '@/lib/actions/sales';
import { getLowStockProducts as getLowStockAction } from '@/lib/actions/products';
import StatsCards from '@/components/dashboard/StatsCards';
import SalesChart from '@/components/dashboard/SalesChart';
import InventoryAlerts from '@/components/dashboard/InventoryAlerts';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Wallet, ShoppingBag, CreditCard, Award, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering since it relies on DB data
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await getDashboardStats();
  const lowStockProducts = await getLowStockAction();

  const { stats, paymentBreakdown, salesTrend, topProducts } = data;

  return (
    <div className="space-y-6">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100">لوحة التحليلات والمطابقة المحاسبية</h2>
          <p className="text-xs text-slate-500 mt-1">تتبع التدفقات النقدية، تكلفة المبيعات (COGS)، وهامش أرباح المنتجات لحظياً.</p>
        </div>
        
        <Link
          href="/pos"
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all"
        >
          <span>شاشة الكاشير ونقاط البيع</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Financial Summary Cards */}
      <StatsCards stats={stats} />

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Chart Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <SalesChart data={salesTrend} />

          {/* Top selling products */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4.5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/60 mb-3">
              <div className="flex items-center gap-2">
                <Award className="text-yellow-500" size={16} />
                <h4 className="font-bold text-xs text-slate-200">المنتجات الأكثر مبيعاً وهامش الربحية</h4>
              </div>
              <span className="text-[10px] text-slate-500">مرتبة بحسب كمية السلع المباعة</span>
            </div>

            <div className="overflow-x-auto text-xxs font-medium text-slate-300">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2 pr-2">المنتج</th>
                    <th className="py-2 text-center">الكمية المباعة</th>
                    <th className="py-2 text-left">إجمالي الإيرادات</th>
                    <th className="py-2 text-left">الأرباح الصافية</th>
                    <th className="py-2 text-left pl-2">هامش الربح %</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xxs">
                        لا توجد بيانات مبيعات متوفرة حالياً. سجل فواتير في الكاشير لتظهر هنا.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-900 last:border-b-0 hover:bg-slate-950/20">
                        <td className="py-2.5 font-bold text-slate-200 pr-2">{item.name}</td>
                        <td className="py-2.5 text-center font-mono">{item.quantity} قطع</td>
                        <td className="py-2.5 text-left font-mono">{formatCurrency(item.revenue)}</td>
                        <td className="py-2.5 text-left font-mono text-emerald-400 font-semibold">{formatCurrency(item.profit)}</td>
                        <td className="py-2.5 text-left font-mono pl-2">
                          <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px]">
                            {item.margin}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alerts & Payment Breakdown Column (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <InventoryAlerts products={lowStockProducts} />

          {/* Payment Methods Breakdown */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="text-violet-500" size={16} />
                  <h4 className="font-bold text-xs text-slate-200">توزيع المقبوضات بحسب الدفع</h4>
                </div>
              </div>

              <div className="space-y-3 py-1">
                {/* Cash */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xxs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                      الدفع النقدي (Cash)
                    </span>
                    <span className="font-mono text-slate-200">{formatCurrency(paymentBreakdown.cash)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5">
                    <div
                      className="bg-violet-600 h-1.5 rounded-full"
                      style={{
                        width: `${
                          stats.totalRevenue > 0 ? (paymentBreakdown.cash / stats.totalRevenue) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Card */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xxs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      البطاقة البنكية (Card)
                    </span>
                    <span className="font-mono text-slate-200">{formatCurrency(paymentBreakdown.card)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{
                        width: `${
                          stats.totalRevenue > 0 ? (paymentBreakdown.card / stats.totalRevenue) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xxs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      الدفع الإلكتروني (Mobile)
                    </span>
                    <span className="font-mono text-slate-200">{formatCurrency(paymentBreakdown.mobile)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{
                        width: `${
                          stats.totalRevenue > 0 ? (paymentBreakdown.mobile / stats.totalRevenue) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/60 pt-3 mt-4 leading-tight">
              تساعدك هذه النسب على تحديد أفضل طرق الدفع المفضلة لدى عملائك وتسهيل عملية جرد الخزينة في نهاية اليوم.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
