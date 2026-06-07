'use client';

import React, { useState, useEffect } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, createCategory } from '@/lib/actions/products';
import { SerializedProduct } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, FolderPlus, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Forms Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SerializedProduct | null>(null);

  // Product Form Fields
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [stock, setStock] = useState(0);
  const [lowStockLimit, setLowStockLimit] = useState(5);
  const [categoryId, setCategoryId] = useState('');

  // Category Form Fields
  const [newCatName, setNewCatName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allProds, allCats] = await Promise.all([
        getProducts({ searchQuery, categoryId: selectedCategory }),
        getCategories(),
      ]);
      setProducts(allProds);
      setCategories(allCats);
      if (allCats.length > 0 && !categoryId) {
        setCategoryId(allCats[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setName('');
    setBarcode('');
    setPrice(0);
    setCost(0);
    setStock(0);
    setLowStockLimit(5);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: SerializedProduct) => {
    setEditingProduct(product);
    setName(product.name);
    setBarcode(product.barcode || '');
    setPrice(product.price);
    setCost(product.cost);
    setStock(product.stock);
    setLowStockLimit(product.lowStockAlertLimit);
    setCategoryId(product.categoryId);
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || price <= 0 || cost < 0) {
      alert('الرجاء تعبئة الحقول الأساسية بشكل صحيح!');
      return;
    }

    try {
      setSubmitting(true);
      const data = { name, barcode, price, cost, stock, lowStockAlertLimit: lowStockLimit, categoryId };
      
      let res;
      if (editingProduct) {
        res = await updateProduct(editingProduct.id, data);
      } else {
        res = await createProduct(data);
      }

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        alert(res.error || 'حدث خطأ ما');
      }
    } catch (err) {
      console.error(err);
      alert('فشل حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSubmitting(true);
      const res = await createCategory(newCatName.trim());
      if (res.success && res.category) {
        setCategories([...categories, res.category]);
        setCategoryId(res.category.id);
        setNewCatName('');
        setIsCatModalOpen(false);
      } else {
        alert(res.error || 'فشل إضافة القسم');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, prodName: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك بحذف المنتج "${prodName}"؟`)) return;

    try {
      const res = await deleteProduct(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || 'فشل الحذف');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100">إدارة المنتجات ومخزون السلع</h2>
          <p className="text-xs text-slate-500 mt-1">تعديل أسعار المنتجات، التكاليف، تتبع الكميات، وإعداد تنبيهات نفاذ المخزون.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-colors"
          >
            <FolderPlus size={14} className="text-violet-400" />
            قسم جديد
          </button>
          
          <button
            onClick={openNewProductModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all"
          >
            <Plus size={14} />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        <div className="relative md:col-span-8">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو الباركود..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pr-9 pl-4 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-violet-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-violet-600 focus:border-transparent"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-900/40 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto text-xs text-slate-350">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-semibold text-xxs tracking-wider uppercase">
                <th className="py-3 px-4 pr-5">المنتج</th>
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4">الباركود</th>
                <th className="py-3 px-4 text-left">التكلفة (الشراء)</th>
                <th className="py-3 px-4 text-left">سعر البيع</th>
                <th className="py-3 px-4 text-left">هامش الربح %</th>
                <th className="py-3 px-4 text-center">المخزون الحالي</th>
                <th className="py-3 px-4 text-center pl-5">التحكم</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-violet-500" size={16} />
                      <span>جاري تحميل بيانات السلع والمخازن...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    لا توجد منتجات مطابقة لعملية البحث.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock <= p.lowStockAlertLimit;
                  const profitMargin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;

                  return (
                    <tr key={p.id} className="border-b border-slate-800/55 last:border-b-0 hover:bg-slate-950/20">
                      <td className="py-3 px-4 pr-5 font-bold text-slate-200">{p.name}</td>
                      <td className="py-3 px-4 text-slate-400">{p.categoryName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-xxs">{p.barcode || '—'}</td>
                      <td className="py-3 px-4 text-left font-mono text-slate-400">{formatCurrency(p.cost)}</td>
                      <td className="py-3 px-4 text-left font-mono text-slate-200 font-semibold">{formatCurrency(p.price)}</td>
                      <td className="py-3 px-4 text-left font-mono">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                          {profitMargin}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-mono font-bold ${
                            p.stock === 0
                              ? 'text-rose-500'
                              : isLow
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}>
                            {p.stock} قطعة
                          </span>
                          {isLow && (
                            <AlertTriangle size={13} className="text-amber-500" title="مخزون منخفض!" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center pl-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 hover:bg-violet-600/10 hover:text-violet-400 text-slate-400 rounded-lg transition-all"
                            title="تعديل المنتج"
                          >
                            <Edit2 size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-lg transition-all"
                            title="حذف المنتج"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Creation Dialog */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCategorySubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h4 className="font-bold text-sm text-slate-100">إضافة قسم منتجات جديد</h4>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xxs text-slate-400 font-bold block">اسم القسم الجديد:</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-600"
                  placeholder="مثال: مشروبات غازية، منظفات..."
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="animate-spin" size={13} />}
                حفظ القسم الجديد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleProductSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <h4 className="font-bold text-sm text-slate-100">
                {editingProduct ? `تعديل تفاصيل: ${editingProduct.name}` : 'إضافة منتج جديد للمخزن'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">اسم المنتج:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-600"
                    placeholder="أدخل الاسم التجاري للمنتج..."
                    required
                  />
                </div>

                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">القسم:</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-600"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div className="space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">الباركود (Barcode):</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    placeholder="امسح الباركود أو اتركه فارغاً"
                  />
                </div>

                {/* Buying Cost */}
                <div className="space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">تكلفة شراء الحبة (Cost):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cost || ''}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">سعر البيع للحبة (Price):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">كمية المخزون الابتدائية:</label>
                  <input
                    type="number"
                    value={stock || 0}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    min="0"
                    required
                  />
                </div>

                {/* Low Stock Alert Limit */}
                <div className="space-y-1">
                  <label className="text-xxs text-slate-400 font-bold block">الحد الأدنى للتنبيه (Low Stock Limit):</label>
                  <input
                    type="number"
                    value={lowStockLimit || 0}
                    onChange={(e) => setLowStockLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-violet-600"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Profit Calculation Preview */}
              <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 flex justify-between text-xxs font-semibold">
                <span className="text-slate-400">حساب الربحية التقريبية:</span>
                <div className="space-x-3 space-x-reverse">
                  <span>ربح الحبة: <strong className="text-emerald-400 font-mono">{formatCurrency(price - cost)}</strong></span>
                  <span>الهامش: <strong className="text-blue-400 font-mono">{price > 0 ? Math.round(((price - cost) / price) * 100) : 0}%</strong></span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 mt-4"
              >
                {submitting && <Loader2 className="animate-spin" size={15} />}
                حفظ بيانات المنتج
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Inline modal close helper
function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
