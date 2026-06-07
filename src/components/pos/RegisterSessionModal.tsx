'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { getCashiers } from '@/lib/actions/users';
import { openSession, closeSession, getSessionTotals } from '@/lib/actions/sessions';
import { X, Lock, Unlock, Loader2, DollarSign, Calendar, RefreshCw } from 'lucide-react';

interface RegisterSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterSessionModal({ isOpen, onClose }: RegisterSessionModalProps) {
  const { activeSession, setActiveSession } = useCartStore();

  const [cashiers, setCashiers] = useState<{ id: string; name: string }[]>([]);
  const [selectedCashierId, setSelectedCashierId] = useState<string>('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionTotals, setSessionTotals] = useState<any | null>(null);

  // Load cashiers on open
  useEffect(() => {
    if (isOpen) {
      const loadCashiers = async () => {
        try {
          const list = await getCashiers();
          setCashiers(list);
          if (list.length > 0) {
            setSelectedCashierId(list[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      };

      loadCashiers();

      if (activeSession) {
        // Load totals for current active session
        const loadTotals = async () => {
          try {
            const totals = await getSessionTotals(activeSession.id);
            setSessionTotals(totals);
            setClosingBalance(totals.expectedClosingBalance);
          } catch (err) {
            console.error(err);
          }
        };
        loadTotals();
      }
    }
  }, [isOpen, activeSession]);

  if (!isOpen) return null;

  const handleOpenSession = async () => {
    if (!selectedCashierId) {
      alert('الرجاء اختيار الموظف الكاشير');
      return;
    }

    if (openingBalance < 0) {
      alert('المبلغ الافتتاحي يجب أن يكون أكبر من أو يساوي الصفر');
      return;
    }

    try {
      setLoading(true);
      const res = await openSession(selectedCashierId, openingBalance);
      if (res.success && res.session) {
        setActiveSession(res.session);
        onClose();
      } else {
        alert(res.error || 'فشل فتح الصندوق');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    if (closingBalance < 0) {
      alert('المبلغ الفعلي يجب أن يكون أكبر من أو يساوي الصفر');
      return;
    }

    const confirmClose = window.confirm(
      `هل أنت متأكد من إغلاق الصندوق؟ سيتم تسجيل الفروقات إن وجدت.`
    );
    if (!confirmClose) return;

    try {
      setLoading(true);
      const res = await closeSession(activeSession.id, closingBalance);
      if (res.success) {
        setActiveSession(null);
        setSessionTotals(null);
        onClose();
        alert('تم إغلاق صندوق الكاشير بنجاح وجاري طباعة تقرير الجلسة.');
      } else {
        alert(res.error || 'فشل إغلاق الصندوق');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const selectedCashierName = cashiers.find((c) => c.id === selectedCashierId)?.name || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="font-bold text-base text-slate-100">
            {activeSession ? 'إغلاق وردية الكاشير' : 'بدء وردية جديدة (فتح الصندوق)'}
          </h3>
          {!loading && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {activeSession ? (
            /* Close Session UI */
            <div className="space-y-4">
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>الموظف الحالي:</span>
                  <span className="font-semibold text-slate-200">{activeSession.cashierName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>تاريخ الفتح:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(activeSession.openedAt).toLocaleString('ar-EG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 border-t border-slate-900 pt-2">
                  <span>الرصيد الافتتاحي:</span>
                  <span className="font-mono text-slate-200">
                    {formatCurrency(activeSession.openingBalance)}
                  </span>
                </div>
                
                {sessionTotals ? (
                  <>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>المبيعات النقدية:</span>
                      <span className="font-mono text-emerald-400">
                        +{formatCurrency(sessionTotals.cashSales)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>المدفوعات الإلكترونية / البطاقات:</span>
                      <span className="font-mono text-slate-300">
                        {formatCurrency(sessionTotals.cardSales + sessionTotals.mobileSales)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>إدخال/إخراج نقدية (Pay-In/Out):</span>
                      <span className="font-mono text-slate-200">
                        {formatCurrency(sessionTotals.payIns - sessionTotals.payOuts)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-100 border-t border-slate-900 pt-2">
                      <span>الرصيد النقدي المتوقع بالدرج:</span>
                      <span className="font-mono text-violet-400">
                        {formatCurrency(sessionTotals.expectedClosingBalance)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-4 text-xs text-slate-500 gap-1.5">
                    <Loader2 className="animate-spin text-violet-500" size={14} />
                    جاري حساب المجاميع النقدية...
                  </div>
                )}
              </div>

              {sessionTotals && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">
                    أدخل الرصيد النقدي الفعلي الموجود بالدرج:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={closingBalance || ''}
                      onChange={(e) => setClosingBalance(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                    <div className="absolute left-3 inset-y-0 flex items-center text-xs font-bold text-slate-500">
                      د.ج
                    </div>
                  </div>

                  {/* Difference display */}
                  <div className="flex justify-between text-xxs pt-1">
                    <span className="text-slate-500">الفروقات المحاسبية:</span>
                    <span className={`font-mono font-bold ${
                      closingBalance - sessionTotals.expectedClosingBalance === 0
                        ? 'text-emerald-400'
                        : closingBalance - sessionTotals.expectedClosingBalance > 0
                        ? 'text-blue-400'
                        : 'text-rose-500'
                    }`}>
                      {closingBalance - sessionTotals.expectedClosingBalance > 0 ? '+' : ''}
                      {formatCurrency(closingBalance - sessionTotals.expectedClosingBalance)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCloseSession}
                disabled={loading || !sessionTotals}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Lock size={15} />
                )}
                حفظ الحساب وإغلاق صندوق المبيعات
              </button>
            </div>
          ) : (
            /* Open Session UI */
            <div className="space-y-4">
              {/* Cashier Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">اختر الكاشير المستلم وردية العمل:</label>
                <select
                  value={selectedCashierId}
                  onChange={(e) => setSelectedCashierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-600"
                >
                  <option value="" disabled>اختر كاشير...</option>
                  {cashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opening Balance Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">الرصيد الافتتاحي للدرج (الفكة / الصرف):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={openingBalance || ''}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 font-mono font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-600"
                    placeholder="0.00"
                  />
                  <div className="absolute left-3 inset-y-0 flex items-center text-xs font-bold text-slate-500">
                    د.ج
                  </div>
                </div>
              </div>

              {/* Shortcuts */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-semibold">اختصارات رصيد الفتح:</span>
                <div className="flex gap-1.5">
                  {[2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpeningBalance(amt)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                    >
                      {amt.toLocaleString()} د.ج
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpenSession}
                disabled={loading || !selectedCashierId}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Unlock size={15} />
                )}
                فتح درج الكاشير وبدء تسجيل المبيعات
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
