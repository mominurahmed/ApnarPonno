import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category as CategoryType } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        // Fetch category info
        const cSnap = await getDocs(query(collection(db, 'categories'), where('slug', '==', slug)));
        if (!cSnap.empty) {
          setCategory({ id: cSnap.docs[0].id, ...cSnap.docs[0].data() } as CategoryType);
        }

        // Fetch products in this category
        const pSnap = await getDocs(query(collection(db, 'products'), where('category', '==', slug)));
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Category...</div>;

  if (!category) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Category not found</h2>
        <Link to="/shop" className="text-primary hover:underline">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Breadcrumbs & Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Link to="/" className="hover:text-primary flex items-center gap-1">
              <Home className="h-3 w-3" /> Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">{category.name}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-slate-900">{category.name}</h1>
              <p className="text-slate-500 mt-2">Showing all premium products in {category.name}.</p>
            </div>
            <div className="bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-600">
              {products.length} Products Available
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
            <h3 className="text-xl font-bold text-slate-900">No products in this category yet</h3>
            <p className="text-slate-500 mt-2">Check back soon for new arrivals!</p>
            <Link to="/shop">
              <button className="mt-6 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20">
                Browse Other Products
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
