'use client';

import React from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { X, Play, Trash2, Calendar, FileText, ShoppingBag } from 'lucide-react';

interface HoldOrdersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HoldOrders({ isOpen, onClose }: HoldOrdersProps) {
  const { heldOrders, resumeOrder, deleteHeldOrder } = useCartStore();

  if (!isOpen) return null;

  const handleResume = (id: string) => {
    resumeOrder(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-violet-500" size={18} />
            <h3 className="font-bold text-base text-slate-100">الطلبات المعلقة والمؤجلة</h3>
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xxs font-mono">
              {heldOrders.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 py-12 gap-2">
              <ShoppingBag size={36} className="text-slate-700 stroke-1" />
              <span className="text-xs">لا توجد طلبات معلقة حالياً</span>
            </div>
          ) : (
            heldOrders.map((order) => {
              const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
              const orderTotal = order.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="flex flex-col bg-slate-950/40 border border-slate-800/80 hover:border-slate-800 rounded-xl p-4 gap-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <FileText size={13} className="text-violet-400" />
                        <span>ملاحظة: {order.notes || 'بدون ملاحظات'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Calendar size={11} />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-xxs text-slate-500 block">المجموع</span>
                      <span className="font-bold text-xs font-mono text-violet-400">
                        {formatCurrency(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Item snippets */}
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xxs bg-slate-900 border border-slate-800/60 text-slate-300 px-2 py-1 rounded-md"
                      >
                        {item.product.name} × {item.quantity}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 border-t border-slate-900/40 pt-2.5">
                    <button
                      onClick={() => deleteHeldOrder(order.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-xxs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      حذف
                    </button>
                    
                    <button
                      onClick={() => handleResume(order.id)}
                      className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xxs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Play size={11} />
                      استئناف الطلب
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
