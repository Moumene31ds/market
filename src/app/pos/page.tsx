'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSection from '@/components/pos/CartSection';
import PaymentModal from '@/components/pos/PaymentModal';
import HoldOrders from '@/components/pos/HoldOrders';
import RegisterSessionModal from '@/components/pos/RegisterSessionModal';
import { Store, BarChart2, LogOut, Lock } from 'lucide-react';
import Link from 'next/link';

export default function POSTerminalPage() {
  const { cartItems, activeSession } = useCartStore();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHoldOpen, setIsHoldOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);

  // Auto-open session modal if no session exists on mount
  useEffect(() => {
    if (!activeSession) {
      setIsSessionOpen(true);
    }
  }, [activeSession]);

  // Keyboard Shortcuts F9, F10, Esc
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (cartItems.length > 0 && activeSession) {
          setIsPaymentOpen(true);
        }
      }
      if (e.key === 'F10') {
        e.preventDefault();
        // Payment modal has its own handler or closes on ESC/Click
      }
      if (e.key === 'Escape') {
        setIsPaymentOpen(false);
        setIsHoldOpen(false);
        setIsSessionOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [cartItems, activeSession]);

  return (
    <div className="flex flex-col h-screen max-h-screen text-slate-100 overflow-hidden">
      {/* POS Top Navigation Bar */}
      <header className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-950/50">
            <Store className="text-white" size={16} />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-100">سوبرماركت البركة</h1>
            <span className="text-[10px] text-slate-500 font-medium block -mt-0.5">نقطة البيع الكاشير (POS)</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {activeSession && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/40 border border-slate-800 rounded-lg text-xxs font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-slate-400">وردية:</span>
              <span className="text-slate-200">{activeSession.cashierName}</span>
            </div>
          )}

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-800 transition-colors"
          >
            <BarChart2 size={14} className="text-violet-400" />
            لوحة التحكم المحاسبية
          </Link>

          <button
            onClick={() => setIsSessionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent text-rose-400 text-xs font-bold rounded-lg transition-colors"
          >
            <Lock size={13} />
            {activeSession ? 'إغلاق الوردية' : 'فتح الوردية'}
          </button>
        </div>
      </header>

      {/* Main Terminal Screen */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden min-h-0 bg-slate-950">
        {/* Left Column: Cart (5 cols on large screen, first on mobile) */}
        <section className="lg:col-span-4 xl:col-span-3 h-full overflow-hidden flex flex-col">
          <CartSection
            onCheckout={() => setIsPaymentOpen(true)}
            onOpenHoldModal={() => setIsHoldOpen(true)}
            onOpenSessionModal={() => setIsSessionOpen(true)}
          />
        </section>

        {/* Right Column: Product Grid (8 cols on large screen) */}
        <section className="lg:col-span-8 xl:col-span-9 h-full overflow-hidden flex flex-col">
          <ProductGrid />
        </section>
      </main>

      {/* Modals & Dialogs */}
      <RegisterSessionModal
        isOpen={isSessionOpen}
        onClose={() => setIsSessionOpen(false)}
      />

      <HoldOrders
        isOpen={isHoldOpen}
        onClose={() => setIsHoldOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </div>
  );
}
