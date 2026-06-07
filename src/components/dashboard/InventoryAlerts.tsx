'use client';

import React from 'react';
import { SerializedProduct } from '@/types';
import Link from 'next/link';
import { AlertTriangle, PackageOpen, ChevronLeft } from 'lucide-react';

interface InventoryAlertsProps {
  products: SerializedProduct[];
}

export default function InventoryAlerts({ products }: InventoryAlertsProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4.5 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={16} />
            <h4 className="font-bold text-xs text-slate-200">المنتجات منخفضة المخزون</h4>
          </div>
          <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-xxs font-mono font-bold">
            {products.length} تنبيهات
          </span>
        </div>

        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
          {products.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-slate-500 gap-1.5 text-center">
              <PackageOpen size={28} className="text-slate-700 stroke-1" />
              <span className="text-xxs">مستوى المخزون ممتاز لجميع المنتجات!</span>
            </div>
          ) : (
            products.map((p) => {
              const isOut = p.stock === 0;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-850 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xxs text-slate-200 truncate">{p.name}</h5>
                    <span className="text-[10px] text-slate-500 block -mt-0.5">القسم: {p.categoryName}</span>
                  </div>
                  
                  <div className="text-left flex items-center gap-3">
                    <div>
                      <span className={`block text-xxs font-bold text-left ${isOut ? 'text-rose-500' : 'text-amber-500'}`}>
                        {isOut ? 'منتهي' : `${p.stock} قطعة`}
                      </span>
                      <span className="text-[9px] text-slate-500 block">الحد الأدنى: {p.lowStockAlertLimit}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-slate-800/60 pt-3 mt-3">
        <Link
          href="/dashboard/products"
          className="text-xxs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 hover:gap-1.5 transition-all justify-end"
        >
          <span>الذهاب لإدارة المخزن وتوريد السلع</span>
          <ChevronLeft size={12} />
        </Link>
      </div>
    </div>
  );
}
