'use server';

import prisma from '@/lib/db';
import { SerializedProduct } from '@/types';

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('فشل جلب الأقسام');
  }
}

export async function createCategory(name: string) {
  try {
    const category = await prisma.category.create({
      data: { name },
    });
    return { success: true, category };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'القسم موجود بالفعل أو حدث خطأ ما' };
  }
}

export async function getProducts(options?: { searchQuery?: string; categoryId?: string }): Promise<SerializedProduct[]> {
  try {
    // Auto-seed if empty
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      try {
        const bev = await prisma.category.create({ data: { name: 'مشروبات' } }).catch(() => prisma.category.findUnique({ where: { name: 'مشروبات' } })) as any;
        const food = await prisma.category.create({ data: { name: 'مواد غذائية' } }).catch(() => prisma.category.findUnique({ where: { name: 'مواد غذائية' } })) as any;
        const bakery = await prisma.category.create({ data: { name: 'مخبوزات' } }).catch(() => prisma.category.findUnique({ where: { name: 'مخبوزات' } })) as any;
        const dairy = await prisma.category.create({ data: { name: 'أجبان وألبان' } }).catch(() => prisma.category.findUnique({ where: { name: 'أجبان وألبان' } })) as any;

        if (bev && food && bakery && dairy) {
          await prisma.product.createMany({
            data: [
              { name: 'كوكا كولا 330 مل', barcode: '5449000000996', price: 80.00, cost: 60.00, stock: 100, lowStockAlertLimit: 10, categoryId: bev.id },
              { name: 'حليب الصومام 1 لتر', barcode: '6130123456789', price: 125.00, cost: 95.00, stock: 45, lowStockAlertLimit: 8, categoryId: dairy.id },
              { name: 'خبز باجيت فرنسي', barcode: '0000000000001', price: 15.00, cost: 10.00, stock: 120, lowStockAlertLimit: 15, categoryId: bakery.id },
              { name: 'قهوة نسكافيه 200غ', barcode: '7613035828131', price: 950.00, cost: 780.00, stock: 20, lowStockAlertLimit: 5, categoryId: food.id },
              { name: 'رقائق شيبس بطل عائلي', barcode: '6130987654321', price: 180.00, cost: 140.00, stock: 4, lowStockAlertLimit: 6, categoryId: food.id },
              { name: 'ماء معدني لالة خديجة 1.5ل', barcode: '6130222222222', price: 40.00, cost: 30.00, stock: 150, lowStockAlertLimit: 20, categoryId: bev.id },
              { name: 'جبن كيري 12 قطعة', barcode: '3073700216773', price: 320.00, cost: 260.00, stock: 3, lowStockAlertLimit: 5, categoryId: dairy.id }
            ]
          });
        }
      } catch (seedErr) {
        console.error('Error seeding initial products:', seedErr);
      }
    }

    const where: any = {};
    
    if (options?.categoryId && options.categoryId !== 'all') {
      where.categoryId = options.categoryId;
    }
    
    if (options?.searchQuery) {
      const q = options.searchQuery.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: p.stock,
      lowStockAlertLimit: p.lowStockAlertLimit,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('فشل جلب المنتجات');
  }
}

export async function createProduct(data: {
  name: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  lowStockAlertLimit: number;
  categoryId: string;
}) {
  try {
    // Check barcode uniqueness
    if (data.barcode && data.barcode.trim() !== '') {
      const existing = await prisma.product.findUnique({
        where: { barcode: data.barcode.trim() },
      });
      if (existing) {
        return { success: false, error: 'الباركود مستخدم بالفعل لمنتج آخر' };
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        lowStockAlertLimit: data.lowStockAlertLimit,
        categoryId: data.categoryId,
      },
    });

    return { success: true, product };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'فشل إضافة المنتج. تحقق من صحة البيانات.' };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    barcode?: string;
    price: number;
    cost: number;
    stock: number;
    lowStockAlertLimit: number;
    categoryId: string;
  }
) {
  try {
    // Check barcode uniqueness
    if (data.barcode && data.barcode.trim() !== '') {
      const existing = await prisma.product.findFirst({
        where: {
          barcode: data.barcode.trim(),
          id: { not: id },
        },
      });
      if (existing) {
        return { success: false, error: 'الباركود مستخدم بالفعل لمنتج آخر' };
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        barcode: data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        lowStockAlertLimit: data.lowStockAlertLimit,
        categoryId: data.categoryId,
      },
    });

    return { success: true, product };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'فشل تحديث المنتج.' };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'لا يمكن حذف المنتج لارتباطه بفواتير سابقة.' };
  }
}

export async function getLowStockProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.lowStockAlertLimit,
        },
      },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: { stock: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: p.stock,
      lowStockAlertLimit: p.lowStockAlertLimit,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return [];
  }
}
