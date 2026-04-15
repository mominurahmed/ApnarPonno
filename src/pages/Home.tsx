import React, { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowRight, Truck, ShieldCheck, Clock, Star, Play, Quote, Instagram, Leaf, Heart, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
        const pSnap = await getDocs(pQuery);
        const allProducts = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(allProducts);
        setFlashSaleProducts(allProducts.filter(p => p.isFlashSale).slice(0, 4));

        const cSnap = await getDocs(collection(db, 'categories'));
        setCategories(cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-primary font-bold">Loading ApnarPonno...</div>;

  return (
    <div className="min-h-screen bg-white pb-20 overflow-hidden">
      {/* Hero Section - Editorial Style */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-50">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=2000" 
            alt="Organic Farm" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/50 to-white" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-primary" />
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-primary">Est. 2024</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-heading font-bold leading-[0.9] tracking-tighter text-slate-900">
                Purely <br />
                <span className="text-primary italic font-serif font-normal">Organic</span> <br />
                Lifestyle
              </h1>
              <p className="text-lg md:text-xl text-slate-600 font-light leading-relaxed max-w-lg">
                Discover the finest selection of hand-picked organic products, sourced directly from nature's heart to your doorstep.
              </p>
              <div className="flex flex-wrap gap-6 pt-4">
                <Link to="/shop">
                  <Button size="lg" className="h-16 px-10 rounded-full text-lg font-bold luxury-shadow hover:scale-105 transition-transform">
                    Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-full text-lg font-bold border-2 border-slate-200 hover:bg-slate-50">
                  <Play className="mr-2 h-5 w-5 fill-current" /> Watch Story
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 w-12 rounded-full border-4 border-white overflow-hidden bg-slate-200">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" />
                    </div>
                  ))}
                  <div className="h-12 w-12 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white text-xs font-bold">
                    10k+
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Happy Customers</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden luxury-shadow aspect-[4/5] max-w-md mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                  alt="Organic Honey" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 z-20 bg-white p-6 rounded-3xl luxury-shadow border border-slate-100 hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Purity</p>
                    <p className="text-sm font-bold">100% Certified</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 z-20 bg-white p-6 rounded-3xl luxury-shadow border border-slate-100 hidden md:block"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery</p>
                    <p className="text-sm font-bold">Fast & Secure</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Signals - Luxury Style */}
      <section className="py-20 border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { icon: Truck, title: "Global Shipping", desc: "Fast & reliable delivery" },
              { icon: ShieldCheck, title: "Quality Assured", desc: "100% organic certified" },
              { icon: Clock, title: "24/7 Support", desc: "Expert help anytime" },
              { icon: Heart, title: "Eco Friendly", desc: "Sustainable packaging" }
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4 group">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <section className="py-24 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-red-500 rounded-2xl flex items-center justify-center luxury-shadow animate-pulse">
                  <Zap className="h-8 w-8 text-white fill-current" />
                </div>
                <div>
                  <h2 className="text-4xl font-heading font-bold tracking-tight text-slate-900">Flash Sales</h2>
                  <p className="text-red-600 font-bold uppercase tracking-widest text-xs">Limited Time Offers - Don't Miss Out!</p>
                </div>
              </div>
              <Link to="/offers">
                <Button variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-500 hover:text-white font-bold h-12 px-8">
                  View All Offers
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories - Visual Grid */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Leaf className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-[0.3em]">Categories</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">Curated Collections</h2>
            </div>
            <Link to="/shop">
              <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 group">
                Browse All <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link 
                  to={`/category/${cat.slug}`}
                  className="group flex flex-col items-center gap-6"
                >
                  <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden luxury-shadow bg-white">
                    <img 
                      src={cat.image || `https://picsum.photos/seed/${cat.slug}/400/400`} 
                      alt={cat.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">12+ Products</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Luxury Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Our Best Sellers</Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">Premium Selection</h2>
            <p className="text-muted-foreground font-light">Experience the highest quality organic products, meticulously selected for your wellness journey.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link to="/shop">
              <Button size="lg" className="h-14 px-12 rounded-full font-bold luxury-shadow">
                View Entire Shop
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Testimonials - Luxury Slider Style */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <div className="flex justify-center items-center gap-1 text-amber-500 mb-2">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-slate-900">Loved by Thousands</h2>
            <p className="text-muted-foreground font-light">Don't just take our word for it. Here's what our community has to say about their organic journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah J.", role: "Health Enthusiast", text: "The quality of the Black Seed Honey is incomparable. I've tried many brands, but ApnarPonno is truly pure and authentic." },
              { name: "Rahat A.", role: "Chef", text: "As a chef, I'm very picky about my ingredients. Their Mustard Oil has that authentic aroma that takes my dishes to the next level." },
              { name: "Nadia M.", role: "Mother", text: "I feel safe giving these products to my children. Knowing they are 100% organic gives me immense peace of mind." }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[2.5rem] luxury-shadow border border-slate-100 relative"
              >
                <Quote className="absolute top-8 right-8 h-12 w-12 text-slate-50" />
                <p className="text-slate-600 italic leading-relaxed mb-8 relative z-10">"{item.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${item.name}`} alt={item.name} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home;
