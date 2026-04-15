import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Badge } from '../components/ui/badge';
import { motion } from 'motion/react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    if (q !== null) setSearchQuery(q);
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const pSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));

        const cSnap = await getDocs(collection(db, 'categories'));
        setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateFilters = (newCat: string | null, newSearch: string) => {
    const params: any = {};
    if (newCat) params.category = newCat;
    if (newSearch) params.q = newSearch;
    setSearchParams(params);
    setSelectedCategory(newCat);
    setSearchQuery(newSearch);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Shop...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-heading font-bold tracking-tight text-slate-900">Our Shop</h1>
          <p className="text-slate-500 mt-2">Explore our full range of premium organic products.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 space-y-8">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => updateFilters(selectedCategory, e.target.value)}
                />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Categories</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => updateFilters(null, searchQuery)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-primary text-white font-bold' : 'hover:bg-white'}`}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => updateFilters(cat.slug, searchQuery)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.slug ? 'bg-primary text-white font-bold' : 'hover:bg-white'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => updateFilters(selectedCategory, e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-500">Showing {filteredProducts.length} products</p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
                <Button variant="link" onClick={() => updateFilters(null, '')} className="mt-4">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-slate-400">Categories</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {updateFilters(null, searchQuery); setIsFilterOpen(false);}}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${!selectedCategory ? 'bg-primary text-white font-bold' : 'bg-slate-50'}`}
                  >
                    All Products
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => {updateFilters(cat.slug, searchQuery); setIsFilterOpen(false);}}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${selectedCategory === cat.slug ? 'bg-primary text-white font-bold' : 'bg-slate-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Shop;
