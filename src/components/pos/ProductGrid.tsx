'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SerializedProduct } from '@/types';
import { getProducts, getCategories } from '@/lib/actions/products';
import { useCartStore } from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { Search, Loader2, Sparkles, Filter, AlertTriangle } from 'lucide-react';

export default function ProductGrid() {
  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  const addToCart = useCartStore((state) => state.addToCart);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load categories and products
  const loadData = async () => {
    try {
      setLoading(true);
      const [allProducts, allCats] = await Promise.all([
        getProducts({
          categoryId: selectedCategory,
          searchQuery: searchQuery,
        }),
        getCategories(),
      ]);
      setProducts(allProducts);
      setCategories(allCats);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery]);

  // Keep search bar focused for barcode scanner
  useEffect(() => {
    const focusInterval = setInterval(() => {
      // Only refocus if the user isn't typing in some other modal or input
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        searchInputRef.current
      ) {
        searchInputRef.current.focus();
      }
    }, 2000);

    return () => clearInterval(focusInterval);
  }, []);

  // Handle Enter key for Barcode Scanner
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      // Find exact barcode match
      const matchedProduct = products.find(
        (p) => p.barcode === trimmedQuery || p.name.toLowerCase() === trimmedQuery.toLowerCase()
      );

      if (matchedProduct) {
        if (matchedProduct.stock > 0) {
          addToCart(matchedProduct, 1);
          setSearchQuery(''); // Reset search
        } else {
          alert(`المنتج ${matchedProduct.name} غير متوفر في المخزن!`);
        }
      } else if (products.length === 1) {
        // If there's only one product filtered, add it
        const singleProduct = products[0];
        if (singleProduct.stock > 0) {
          addToCart(singleProduct, 1);
          setSearchQuery('');
        } else {
          alert(`المنتج ${singleProduct.name} غير متوفر في المخزن!`);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4">
      {/* Search and Barcode Header */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ابحث بالاسم أو امسح الباركود مباشرة..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pr-10 pl-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition-all"
          autoFocus
        />
        {searchQuery && (
          <div className="absolute left-3 inset-y-0 flex items-center text-xs text-violet-400">
            اضغط Enter لإضافة المنتج
          </div>
        )}
      </div>

      {/* Category selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-800/60 no-scrollbar">
        <div className="flex items-center text-slate-400 pl-1">
          <Filter size={14} className="ml-1" />
          <span className="text-xs font-semibold whitespace-nowrap">الأقسام:</span>
        </div>
        
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/30'
              : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
          }`}
        >
          الكل
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/30'
                : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto min-h-[300px] pr-0.5">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-violet-500" size={32} />
            <span className="text-xs">جاري تحميل المنتجات...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <Sparkles size={28} className="text-slate-600" />
            <span className="text-xs">لم يتم العثور على أي منتجات.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => {
              const isLowStock = product.stock <= product.lowStockAlertLimit && product.stock > 0;
              const isOut = product.stock === 0;

              return (
                <button
                  key={product.id}
                  disabled={isOut}
                  onClick={() => addToCart(product)}
                  className={`group relative text-right flex flex-col justify-between h-36 bg-slate-950/40 border rounded-xl p-3 transition-all duration-200 cursor-pointer overflow-hidden ${
                    isOut
                      ? 'border-slate-900 opacity-50 cursor-not-allowed'
                      : isLowStock
                      ? 'border-amber-600/40 hover:border-amber-500 bg-amber-950/5'
                      : 'border-slate-800/80 hover:border-violet-600/60 hover:bg-slate-900/40'
                  }`}
                >
                  {/* Subtle Background Glow on Hover */}
                  {!isOut && (
                    <div className="absolute -inset-full bg-gradient-to-r from-violet-600/0 via-violet-600/5 to-violet-600/0 group-hover:animate-shimmer pointer-events-none" />
                  )}

                  <div className="flex flex-col gap-1 w-full z-10">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xxs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md truncate max-w-[65px]">
                        {product.categoryName}
                      </span>
                      {isLowStock && (
                        <span className="flex items-center text-amber-500 gap-0.5 text-xxs font-semibold bg-amber-500/10 px-1 rounded-md">
                          <AlertTriangle size={10} />
                          قارب
                        </span>
                      )}
                      {isOut && (
                        <span className="text-xxs font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                          نفذ
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-slate-200 text-xs sm:text-sm line-clamp-2 mt-1 leading-tight group-hover:text-violet-400 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex justify-between items-end w-full mt-2 z-10">
                    <div className="flex flex-col">
                      <span className="text-xxs text-slate-500">السعر</span>
                      <span className="font-bold text-slate-100 text-xs sm:text-sm">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    
                    <div className="text-left">
                      <span className="text-xxs text-slate-500">المخزون</span>
                      <span className={`block text-xs font-semibold ${
                        isOut 
                          ? 'text-rose-500' 
                          : isLowStock 
                          ? 'text-amber-500' 
                          : 'text-emerald-500'
                      }`}>
                        {product.stock} ق.
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
