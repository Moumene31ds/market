'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { Plus, Minus, Trash2, Tag, Percent, PausePresentation, Play, ShoppingCart, Info } from 'lucide-react';

interface CartSectionProps {
  onCheckout: () => void;
  onOpenHoldModal: () => void;
  onOpenSessionModal: () => void;
}

export default function CartSection({ onCheckout, onOpenHoldModal, onOpenSessionModal }: CartSectionProps) {
  const {
    cartItems,
    heldOrders,
    activeSession,
    discountAmount,
    taxRate,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyDiscount,
    setTaxRate,
    holdCurrentOrder,
    getCartSubtotal,
    getCartTax,
    getCartTotal,
  } = useCartStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showTaxInput, setShowTaxInput] = useState(false);

  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const total = getCartTotal();

  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    const notes = prompt('أدخل ملاحظة لتعليق الطلب (مثال: اسم العميل أو الطاولة):') || '';
    holdCurrentOrder(notes);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4">
      {/* Session Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-violet-500" size={18} />
          <h2 className="font-bold text-sm text-slate-100">سلة المبيعات</h2>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xxs font-semibold">
            {cartItems.reduce((acc, item) => acc + item.quantity, 0)} قطع
          </span>
        </div>

        {activeSession ? (
          <div className="text-right">
            <span className="text-xxs text-emerald-400 block font-semibold">● الصندوق مفتوح</span>
            <span className="text-[10px] text-slate-400 font-mono">الجلسة: {activeSession.cashierName}</span>
          </div>
        ) : (
          <button
            onClick={onOpenSessionModal}
            className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold rounded-lg transition-colors"
          >
            فتح الصندوق البدء
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-0.5 mb-4 space-y-2.5 min-h-[200px]">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <ShoppingCart size={32} className="text-slate-700 stroke-1" />
            <span className="text-xs">السلة فارغة حالياً</span>
            <span className="text-[10px] text-slate-600 max-w-[180px] text-center">
              اختر المنتجات من الشبكة أو امسح الباركود لإضافتها.
            </span>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl hover:border-slate-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-xs text-slate-200 truncate">{item.product.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xxs text-slate-400 font-mono">{formatCurrency(item.product.price)}</span>
                  <span className="text-[10px] text-slate-600">|</span>
                  <span className="text-[10px] text-slate-500">المخزن: {item.product.stock} ق.</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-bold w-6 text-center font-mono text-slate-200">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Pricing & Delete */}
              <div className="flex items-center gap-2 text-left pr-1">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-xs text-slate-100 font-mono">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Controls (Hold, Suspended List, Clear) */}
      {cartItems.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={handleHoldOrder}
            className="flex items-center justify-center gap-1 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xxs font-medium rounded-lg transition-colors"
            title="تعليق الفاتورة الحالية"
          >
            <PausePresentation size={12} />
            تعليق الطلب
          </button>
          
          <button
            onClick={onOpenHoldModal}
            className="flex items-center justify-center gap-1 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xxs font-medium rounded-lg transition-colors relative"
            title="الفواتير المعلقة"
          >
            <Play size={10} />
            الطلبات المعلقة
            {heldOrders.length > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-violet-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                {heldOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={clearCart}
            className="flex items-center justify-center gap-1 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-xxs font-medium rounded-lg transition-colors"
          >
            <Trash2 size={12} />
            تفريغ السلة
          </button>
        </div>
      )}

      {/* Price Calculation details */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2.5 mb-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">المجموع الفرعي:</span>
          <span className="font-semibold font-mono text-slate-200">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount Section */}
        <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-2.5">
          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
            >
              <Tag size={12} />
              الخصم:
            </button>
            <span className="font-semibold font-mono text-emerald-400">
              - {formatCurrency(discountAmount)}
            </span>
          </div>

          {showDiscountInput && (
            <div className="flex gap-2 items-center mt-1">
              <input
                type="number"
                value={discountAmount || ''}
                onChange={(e) => applyDiscount(Number(e.target.value))}
                placeholder="قيمة الخصم بالدنانير..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                min="0"
              />
              <button
                onClick={() => setShowDiscountInput(false)}
                className="text-[10px] text-slate-400 hover:text-slate-200"
              >
                إخفاء
              </button>
            </div>
          )}
        </div>

        {/* Tax Section */}
        <div className="flex flex-col gap-1.5 border-t border-slate-900 pt-2.5">
          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => setShowTaxInput(!showTaxInput)}
              className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
            >
              <Percent size={12} />
              الضريبة ({(taxRate * 100).toFixed(0)}%):
            </button>
            <span className="font-semibold font-mono text-slate-200">
              {formatCurrency(tax)}
            </span>
          </div>

          {showTaxInput && (
            <div className="flex gap-2 items-center mt-1">
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-600"
              >
                <option value="0.00">بدون ضريبة (0%)</option>
                <option value="0.09">تخفيض (9%)</option>
                <option value="0.15">ضريبة قيمة مضافة (15%)</option>
                <option value="0.19">ضريبة عامة (19%)</option>
              </select>
              <button
                onClick={() => setShowTaxInput(false)}
                className="text-[10px] text-slate-400 hover:text-slate-200"
              >
                إخفاء
              </button>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-2.5 text-slate-100">
          <span className="font-bold text-sm">المجموع الكلي:</span>
          <span className="font-extrabold text-lg font-mono text-violet-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      {activeSession ? (
        <button
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          إتمام ودفع الطلب (F9)
        </button>
      ) : (
        <button
          onClick={onOpenSessionModal}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
        >
          <Info size={16} />
          افتح صندوق الكاشير أولاً للبيع
        </button>
      )}
    </div>
  );
}
