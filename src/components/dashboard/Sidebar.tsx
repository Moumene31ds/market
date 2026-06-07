'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Receipt, Lock, Store, ChevronLeft } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'لوحة التحليلات والربحية',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'إدارة المنتجات والمخزن',
      path: '/dashboard/products',
      icon: Package,
    },
    {
      name: 'سجل المبيعات والحركات',
      path: '/dashboard/transactions',
      icon: Receipt,
    },
    {
      name: 'جلسات الصندوق والوردية',
      path: '/dashboard/sessions',
      icon: Lock,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-950/45">
            <Package className="text-white" size={16} />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-100">نظام لوحة التحكم</h2>
            <span className="text-[10px] text-slate-500 font-medium block">المخازن والمطابقة المالية</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/25 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className={isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200 transition-colors'} />
                <span>{item.name}</span>
              </div>
              <ChevronLeft size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-violet-400' : 'text-slate-500'}`} />
            </Link>
          );
        })}
      </nav>

      {/* Back to POS footer */}
      <div className="p-4 border-t border-slate-800/80">
        <Link
          href="/pos"
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all"
        >
          <Store size={14} />
          الذهاب لشاشة البيع (POS)
        </Link>
      </div>
    </aside>
  );
}
