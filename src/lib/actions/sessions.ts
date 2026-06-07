'use server';

import prisma from '@/lib/db';
import { SessionStatus, CashFlowType, PaymentMethod } from '@prisma/client';

export async function checkActiveSession(cashierId: string) {
  try {
    const session = await prisma.registerSession.findFirst({
      where: {
        cashierId,
        status: SessionStatus.OPEN,
      },
      include: {
        cashier: {
          select: { name: true },
        },
      },
    });

    if (!session) return null;

    return {
      id: session.id,
      cashierId: session.cashierId,
      cashierName: session.cashier.name,
      openedAt: session.openedAt.toISOString(),
      openingBalance: Number(session.openingBalance),
    };
  } catch (error) {
    console.error('Error checking active session:', error);
    return null;
  }
}

export async function openSession(cashierId: string, openingBalance: number) {
  try {
    // Check if there is already an open session
    const active = await prisma.registerSession.findFirst({
      where: { cashierId, status: SessionStatus.OPEN },
    });
    
    if (active) {
      return { success: false, error: 'لديك جلسة مفتوحة بالفعل' };
    }

    const session = await prisma.registerSession.create({
      data: {
        cashierId,
        openingBalance,
        expectedClosingBalance: openingBalance,
        status: SessionStatus.OPEN,
      },
      include: {
        cashier: {
          select: { name: true },
        },
      },
    });

    return {
      success: true,
      session: {
        id: session.id,
        cashierId: session.cashierId,
        cashierName: session.cashier.name,
        openedAt: session.openedAt.toISOString(),
        openingBalance: Number(session.openingBalance),
      },
    };
  } catch (error) {
    console.error('Error opening session:', error);
    return { success: false, error: 'فشل فتح الجلسة' };
  }
}

export async function getSessionTotals(sessionId: string) {
  try {
    const session = await prisma.registerSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
        },
        transactions: true,
      },
    });

    if (!session) throw new Error('الجلسة غير موجودة');

    const cashSales = session.orders
      .filter((o) => o.paymentMethod === PaymentMethod.CASH)
      .reduce((acc, o) => acc + Number(o.netAmount), 0);

    const cardSales = session.orders
      .filter((o) => o.paymentMethod === PaymentMethod.CARD)
      .reduce((acc, o) => acc + Number(o.netAmount), 0);

    const mobileSales = session.orders
      .filter((o) => o.paymentMethod === PaymentMethod.MOBILE)
      .reduce((acc, o) => acc + Number(o.netAmount), 0);

    const payIns = session.transactions
      .filter((t) => t.type === CashFlowType.PAY_IN)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const payOuts = session.transactions
      .filter((t) => t.type === CashFlowType.PAY_OUT)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const openingBalance = Number(session.openingBalance);
    const expectedClosingBalance = openingBalance + cashSales + payIns - payOuts;

    return {
      cashSales,
      cardSales,
      mobileSales,
      payIns,
      payOuts,
      openingBalance,
      expectedClosingBalance,
      totalSales: cashSales + cardSales + mobileSales,
    };
  } catch (error) {
    console.error('Error getting session totals:', error);
    throw error;
  }
}

export async function closeSession(sessionId: string, actualClosingBalance: number) {
  try {
    const totals = await getSessionTotals(sessionId);
    const difference = actualClosingBalance - totals.expectedClosingBalance;

    const session = await prisma.registerSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        expectedClosingBalance: totals.expectedClosingBalance,
        actualClosingBalance,
        difference,
        status: SessionStatus.CLOSED,
      },
    });

    return { success: true, session };
  } catch (error) {
    console.error('Error closing session:', error);
    return { success: false, error: 'فشل إغلاق الجلسة' };
  }
}

export async function addCashTransaction(
  sessionId: string,
  type: CashFlowType,
  amount: number,
  description: string
) {
  try {
    const transaction = await prisma.cashTransaction.create({
      data: {
        sessionId,
        type,
        amount,
        description,
      },
    });
    return { success: true, transaction };
  } catch (error) {
    console.error('Error adding cash transaction:', error);
    return { success: false, error: 'فشل إضافة الحركة المالية' };
  }
}

export async function getSessionsHistory() {
  try {
    const sessions = await prisma.registerSession.findMany({
      include: {
        cashier: {
          select: { name: true },
        },
        orders: {
          select: { netAmount: true },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      cashierName: s.cashier.name,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      openingBalance: Number(s.openingBalance),
      expectedClosingBalance: Number(s.expectedClosingBalance),
      actualClosingBalance: s.actualClosingBalance ? Number(s.actualClosingBalance) : null,
      difference: s.difference ? Number(s.difference) : null,
      status: s.status,
      ordersCount: s.orders.length,
      totalSales: s.orders.reduce((acc, o) => acc + Number(o.netAmount), 0),
    }));
  } catch (error) {
    console.error('Error getting sessions history:', error);
    return [];
  }
}
