'use server';

import prisma from '@/lib/db';
import { Role } from '@prisma/client';

export async function getCashiers() {
  try {
    const cashiers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    if (cashiers.length === 0) {
      // Seed default users if empty
      const defaultAdmin = await prisma.user.create({
        data: {
          name: 'المدير العام',
          email: 'admin@market.com',
          password: 'password123', // In a production app, we would hash this
          role: Role.ADMIN,
        },
      });

      const defaultCashier = await prisma.user.create({
        data: {
          name: 'صراف 1',
          email: 'cashier1@market.com',
          password: 'cashierpassword',
          role: Role.CASHIER,
        },
      });

      return [
        {
          id: defaultAdmin.id,
          name: defaultAdmin.name,
          email: defaultAdmin.email,
          role: defaultAdmin.role,
          createdAt: defaultAdmin.createdAt,
        },
        {
          id: defaultCashier.id,
          name: defaultCashier.name,
          email: defaultCashier.email,
          role: defaultCashier.role,
          createdAt: defaultCashier.createdAt,
        },
      ];
    }

    return cashiers;
  } catch (error) {
    console.error('Error fetching cashiers:', error);
    throw new Error('فشل جلب قائمة الكاشيرات');
  }
}

export async function createCashier(data: { name: string; email: string; role: Role }) {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: 'defaultpassword', // simplified
        role: data.role,
      },
    });
    return { success: true, user };
  } catch (error) {
    console.error('Error creating cashier:', error);
    return { success: false, error: 'فشل إنشاء مستخدم جديد' };
  }
}
