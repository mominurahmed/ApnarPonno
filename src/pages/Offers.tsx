import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, OfferSettings } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { Percent, Sparkles } from 'lucide-react';

const Offers = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<OfferSettings>({
    title: 'Exclusive Offers',
    description: "Don't miss out on our premium organic selection at unbeatable prices. Limited time deals on your favorites.",
    bannerImage: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch settings
        const sSnap = await getDocs(collection(db, 'offerSettings'));
        if (!sSnap.empty) {
          setSettings(sSnap.docs[0].data() as OfferSettings);
        }

        // Fetch all products and filter locally for originalPrice > price
        const pSnap = await getDocs(collection(db, 'products'));
        const allProducts = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const discounted = allProducts.filter(p => p.originalPrice && p.originalPrice > p.price);
        setProducts(discounted);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Offers...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 py-20 relative overflow-hidden">
        {settings.bannerImage ? (
          <div className="absolute inset-0">
            <img src={settings.bannerImage} alt="Banner" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900" />
          </div>
        ) : (
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48" />
        )}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Percent className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold tracking-tight text-white">{settings.title}</h1>
            <p className="text-white/60 max-w-xl text-lg font-light">
              {settings.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Today's Best Deals</h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-medium">No active offers at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Offers;
