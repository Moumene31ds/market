'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReceiptPrintProps {
  order: {
    orderNumber: string;
    cashierName: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    createdAt: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      totalPrice: number;
    }[];
  };
}

export default function ReceiptPrint({ order }: ReceiptPrintProps) {
  return (
    <div id="thermal-receipt-print" className="w-[80mm] p-2 bg-white text-black text-xs font-mono select-none">
      {/* Shop Info */}
      <div className="text-center space-y-1 mb-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide">سوبرماركت البركة للجميع</h2>
        <p className="text-[10px] text-gray-800">حي 500 مسكن، الجزائر العاصمة</p>
        <p className="text-[10px] text-gray-800">الهاتف: 0555 12 34 56</p>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Invoice Details */}
      <div className="space-y-0.5 text-[10px] text-gray-800 mb-2">
        <div><strong>رقم الفاتورة:</strong> {order.orderNumber}</div>
        <div><strong>التاريخ:</strong> {formatDate(order.createdAt)}</div>
        <div><strong>الكاشير:</strong> {order.cashierName}</div>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Items Table */}
      <table className="w-full text-right text-[10px] border-collapse">
        <thead>
          <tr className="border-b border-black font-extrabold">
            <th className="pb-1 text-right">المنتج</th>
            <th className="pb-1 text-center w-8">كم</th>
            <th className="pb-1 text-left w-16">السعر</th>
            <th className="pb-1 text-left w-16">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100 last:border-b-0">
              <td className="py-1 text-right leading-tight max-w-[40mm] truncate">{item.name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-left font-mono">{item.price.toFixed(2)}</td>
              <td className="py-1 text-left font-mono">{item.totalPrice.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Totals */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-[10px] text-gray-800">
          <span>المجموع الفرعي:</span>
          <span className="font-mono">{order.subtotal.toFixed(2)} د.ج</span>
        </div>
        
        {order.discount > 0 && (
          <div className="flex justify-between text-[10px] text-gray-800">
            <span>الخصم:</span>
            <span className="font-mono">-{order.discount.toFixed(2)} د.ج</span>
          </div>
        )}

        <div className="flex justify-between text-[10px] text-gray-800">
          <span>الضريبة:</span>
          <span className="font-mono">{order.tax.toFixed(2)} د.ج</span>
        </div>

        <div className="border-t border-black my-1" />

        <div className="flex justify-between font-extrabold text-sm">
          <span>المجموع الكلي:</span>
          <span className="font-mono">{order.total.toFixed(2)} د.ج</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Payment details */}
      <div className="text-[10px] space-y-0.5 text-gray-800 mb-4">
        <div><strong>طريقة الدفع:</strong> {
          order.paymentMethod === 'CASH' 
            ? 'نقدي (CASH)' 
            : order.paymentMethod === 'CARD' 
            ? 'بطاقة (CARD)' 
            : 'دفع إلكتروني (MOBILE)'
        }</div>
      </div>

      {/* Footer message */}
      <div className="text-center text-[9px] text-gray-700 leading-tight mt-4 space-y-1">
        <p>شكراً لزيارتكم وثقتكم بنا!</p>
        <p>يرجى الاحتفاظ بالفاتورة في حال الاسترجاع أو الاستبدال خلال 48 ساعة.</p>
        <p className="font-bold text-[8px] mt-2 font-mono">Market POS Powered by Antigravity</p>
      </div>
    </div>
  );
}
