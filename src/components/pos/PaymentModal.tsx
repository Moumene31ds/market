'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { processSale } from '@/lib/actions/sales';
import { PaymentMethod } from '@prisma/client';
import { X, CreditCard, Banknote, Smartphone, Check, Printer, Loader2 } from 'lucide-react';
import ReceiptPrint from './ReceiptPrint';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { cartItems, activeSession, discountAmount, taxRate, getCartSubtotal, getCartTax, getCartTotal, getCartCost, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const total = getCartTotal();
  const totalCost = getCartCost();
  const changeDue = Math.max(0, cashReceived - total);

  // Set default cash received to exact amount
  useEffect(() => {
    if (isOpen) {
      setCashReceived(total);
      setSuccessOrder(null);
      setPaymentMethod(PaymentMethod.CASH);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const handleCashShortcut = (amount: number) => {
    setCashReceived((prev) => prev + amount);
  };

  const handleExactAmount = () => {
    setCashReceived(total);
  };

  const handleSubmit = async () => {
    if (!activeSession) {
      alert('لا توجد جلسة صندوق مفتوحة!');
      return;
    }

    if (paymentMethod === PaymentMethod.CASH && cashReceived < total) {
      alert('المبلغ المستلم أقل من قيمة الفاتورة!');
      return;
    }

    try {
      setLoading(true);
      const res = await processSale({
        cashierId: activeSession.cashierId,
        sessionId: activeSession.id,
        cartItems,
        paymentMethod,
        subtotal,
        tax,
        discount: discountAmount,
        total,
        cost: totalCost,
      });

      if (res.success && res.order) {
        setSuccessOrder(res.order);
        // Automatically trigger print dialog
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        alert(res.error || 'فشل إتمام العملية');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع أثناء معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      {/* Printable Receipt Container (Hidden via CSS media print, except when printing) */}
      {successOrder && (
        <div className="hidden">
          <ReceiptPrint order={successOrder} />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="font-bold text-base text-slate-100">
            {successOrder ? 'تم البيع بنجاح!' : 'معالجة عملية الدفع والبيع'}
          </h3>
          {!loading && !successOrder && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {successOrder ? (
          /* Success Screen */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center">
              <Check size={28} />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-lg text-slate-100">تم تسجيل الفاتورة بنجاح</h4>
              <p className="text-xs text-slate-400 font-mono">رقم الفاتورة: {successOrder.orderNumber}</p>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 w-full max-w-md space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>طريقة الدفع:</span>
                <span className="font-semibold text-slate-200">
                  {successOrder.paymentMethod === 'CASH' ? 'نقدي (Cash)' : successOrder.paymentMethod === 'CARD' ? 'بطاقة (Card)' : 'دفع إلكتروني (Mobile)'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>المبلغ الكلي:</span>
                <span className="font-bold font-mono text-slate-200">{formatCurrency(successOrder.total)}</span>
              </div>
              {successOrder.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>المبلغ المستلم:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(cashReceived)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 border-t border-slate-900 pt-2">
                    <span>المبلغ المتبقي للزبون:</span>
                    <span className="font-extrabold font-mono text-emerald-400">{formatCurrency(changeDue)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 w-full max-w-md mt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
              >
                <Printer size={16} />
                إعادة طباعة الوصل
              </button>
              
              <button
                onClick={handleNewSale}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all text-xs"
              >
                بيع جديد (F10)
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Forms */
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Hand: Options and Inputs (8 cols) */}
            <div className="md:col-span-7 space-y-5">
              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">اختر طريقة الدفع:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      paymentMethod === PaymentMethod.CASH
                        ? 'border-violet-600 bg-violet-600/10 text-violet-400'
                        : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Banknote size={20} className="mb-1" />
                    <span className="text-xs font-bold">نقدي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      paymentMethod === PaymentMethod.CARD
                        ? 'border-violet-600 bg-violet-600/10 text-violet-400'
                        : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <CreditCard size={20} className="mb-1" />
                    <span className="text-xs font-bold">بطاقة بنكية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PaymentMethod.MOBILE)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      paymentMethod === PaymentMethod.MOBILE
                        ? 'border-violet-600 bg-violet-600/10 text-violet-400'
                        : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Smartphone size={20} className="mb-1" />
                    <span className="text-xs font-bold">دفع إلكتروني</span>
                  </button>
                </div>
              </div>

              {/* Cash Input Details */}
              {paymentMethod === PaymentMethod.CASH && (
                <div className="space-y-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400">المبلغ المستلم من الزبون:</label>
                    <button
                      type="button"
                      onClick={handleExactAmount}
                      className="text-xxs font-bold text-violet-400 hover:text-violet-300"
                    >
                      المبلغ بالضبط (Exact)
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      value={cashReceived || ''}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 font-mono font-bold text-lg text-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
                      min={total}
                      placeholder="0.00"
                    />
                    <div className="absolute right-3 inset-y-0 flex items-center text-xs font-semibold text-slate-500 pointer-events-none">
                      د.ج
                    </div>
                  </div>

                  {/* Cash Shortcuts */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-medium">اختصارات نقدية سريعة:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleCashShortcut(amt)}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold rounded-lg transition-colors"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Hand: Summary and Checkout CTA (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 block border-b border-slate-800/60 pb-2">تفاصيل الفاتورة:</span>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>إجمالي الخصومات:</span>
                    <span className="font-mono text-emerald-400">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>الضرائب:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-100 border-t border-slate-900 pt-2.5">
                    <span>المجموع الكلي:</span>
                    <span className="font-mono text-violet-400 text-base">{formatCurrency(total)}</span>
                  </div>
                </div>

                {paymentMethod === PaymentMethod.CASH && (
                  <div className="border-t border-slate-800/60 pt-3 space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>المستلم:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-100">
                      <span>الباقي للزبون:</span>
                      <span className="font-mono text-emerald-400 text-base">{formatCurrency(changeDue)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || (paymentMethod === PaymentMethod.CASH && cashReceived < total)}
                className="w-full mt-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    جاري معالجة البيع...
                  </>
                ) : (
                  <>
                    <Printer size={16} />
                    تأكيد الدفع وطباعة الفاتورة
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
