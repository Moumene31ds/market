'use server';

import prisma from '@/lib/db';
import { PaymentMethod, OrderStatus } from '@prisma/client';
import { CartItem } from '@/types';

export async function processSale(data: {
  cashierId: string;
  sessionId: string;
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  cost: number;
}) {
  try {
    if (data.cartItems.length === 0) {
      return { success: false, error: 'السلة فارغة' };
    }

    // Wrap in a Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Invoice Number
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      const count = await tx.order.count({
        where: {
          createdAt: {
            gte: new Date(year, today.getMonth(), today.getDate()),
          },
        },
      });
      const orderNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      // 2. Double check stock and update inventory
      const orderItemsData = [];
      let totalCostCalculated = 0;

      for (const item of data.cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.product.id },
        });

        if (!product) {
          throw new Error(`المنتج ${item.product.name} غير موجود`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `الكمية غير كافية للمنتج ${product.name}. المتوفر: ${product.stock}`
          );
        }

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity },
        });

        const itemCost = Number(product.cost);
        const itemPrice = Number(product.price);
        const totalLinePrice = itemPrice * item.quantity;
        const totalLineCost = itemCost * item.quantity;
        const lineProfit = totalLinePrice - totalLineCost;

        totalCostCalculated += totalLineCost;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: itemPrice,
          unitCost: itemCost,
          totalPrice: totalLinePrice,
          totalCost: totalLineCost,
          profitAmount: lineProfit,
        });
      }

      // Calculate gross profit
      // Net Amount paid by user is total (subtotal + tax - discount)
      // Net profit = Net Amount - Total Cost of goods sold (COGS)
      const grossProfit = data.total - totalCostCalculated;

      // 3. Create the Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          cashierId: data.cashierId,
          sessionId: data.sessionId,
          subtotalAmount: data.subtotal,
          taxAmount: data.tax,
          discountAmount: data.discount,
          netAmount: data.total,
          totalCost: totalCostCalculated,
          grossProfit,
          paymentMethod: data.paymentMethod,
          status: OrderStatus.COMPLETED,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          cashier: {
            select: { name: true },
          },
        },
      });

      // Update expected balance of the session if it's a cash transaction
      if (data.paymentMethod === PaymentMethod.CASH) {
        const session = await tx.registerSession.findUnique({
          where: { id: data.sessionId },
        });
        if (session) {
          await tx.registerSession.update({
            where: { id: data.sessionId },
            data: {
              expectedClosingBalance: Number(session.expectedClosingBalance) + data.total,
            },
          });
        }
      }

      return order;
    });

    return {
      success: true,
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        cashierName: result.cashier.name,
        subtotal: Number(result.subtotalAmount),
        tax: Number(result.taxAmount),
        discount: Number(result.discountAmount),
        total: Number(result.netAmount),
        paymentMethod: result.paymentMethod,
        createdAt: result.createdAt.toISOString(),
        items: result.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      },
    };
  } catch (error: any) {
    console.error('Error processing sale:', error);
    return { success: false, error: error.message || 'فشل إتمام عملية البيع' };
  }
}

export async function getDashboardStats() {
  try {
    const totalOrdersCount = await prisma.order.count({
      where: { status: OrderStatus.COMPLETED },
    });

    const orders = await prisma.order.findMany({
      where: { status: OrderStatus.COMPLETED },
    });

    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.netAmount), 0);
    const totalCOGS = orders.reduce((acc, o) => acc + Number(o.totalCost), 0);
    const totalProfit = totalRevenue - totalCOGS;

    // Get payment methods breakdown
    const cashSales = orders
      .filter((o) => o.paymentMethod === PaymentMethod.CASH)
      .reduce((acc, o) => acc + Number(o.netAmount), 0);
    const cardSales = orders
      .filter((o) => o.paymentMethod === PaymentMethod.CARD)
      .reduce((acc, o) => acc + Number(o.netAmount), 0);
    const mobileSales = orders
      .filter((o) => o.paymentMethod === PaymentMethod.MOBILE)
      .reduce((acc, o) => acc + Number(o.netAmount), 0);

    // Get profit margin chart data (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pastOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    const salesTrendMap: { [key: string]: { sales: number; profit: number; cogs: number } } = {};
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      salesTrendMap[dateStr] = { sales: 0, profit: 0, cogs: 0 };
    }

    pastOrders.forEach((o) => {
      const dateStr = o.createdAt.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      if (salesTrendMap[dateStr]) {
        salesTrendMap[dateStr].sales += Number(o.netAmount);
        salesTrendMap[dateStr].cogs += Number(o.totalCost);
        salesTrendMap[dateStr].profit += Number(o.grossProfit);
      }
    });

    const salesTrend = Object.keys(salesTrendMap).map((date) => ({
      date,
      sales: Math.round(salesTrendMap[date].sales * 100) / 100,
      profit: Math.round(salesTrendMap[date].profit * 100) / 100,
      cogs: Math.round(salesTrendMap[date].cogs * 100) / 100,
    }));

    // Top products
    const orderItems = await prisma.orderItem.findMany({
      include: {
        product: true,
      },
    });

    const productSalesMap: { [key: string]: { name: string; quantity: number; revenue: number; profit: number } } = {};
    orderItems.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += Number(item.totalPrice);
      productSalesMap[item.productId].profit += Number(item.profitAmount);
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
        revenue: Math.round(item.revenue * 100) / 100,
        profit: Math.round(item.profit * 100) / 100,
        margin: item.revenue > 0 ? Math.round((item.profit / item.revenue) * 100) : 0,
      }));

    // Stock alert count
    const lowStockCount = await prisma.product.count({
      where: {
        stock: {
          lte: prisma.product.fields.lowStockAlertLimit,
        },
      },
    });

    return {
      stats: {
        totalOrdersCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
        lowStockCount,
      },
      paymentBreakdown: {
        cash: Math.round(cashSales * 100) / 100,
        card: Math.round(cardSales * 100) / 100,
        mobile: Math.round(mobileSales * 100) / 100,
      },
      salesTrend,
      topProducts,
    };
  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    throw error;
  }
}

export async function getSalesHistory() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        cashier: {
          select: { name: true },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      cashierName: o.cashier.name,
      subtotal: Number(o.subtotalAmount),
      tax: Number(o.taxAmount),
      discount: Number(o.discountAmount),
      total: Number(o.netAmount),
      cost: Number(o.totalCost),
      profit: Number(o.grossProfit),
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.toISOString(),
      itemsCount: o.items.reduce((acc, item) => acc + item.quantity, 0),
    }));
  } catch (error) {
    console.error('Error fetching sales history:', error);
    return [];
  }
}
