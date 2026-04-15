import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, 
  Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, 
  ChevronRight, ChevronDown, DollarSign, TrendingUp, ArrowUpRight, 
  ArrowDownRight, Image as ImageIcon, Star, Copy, Truck, AlertCircle,
  Megaphone, Tag, BarChart3, Sparkles, Filter, CheckSquare, Square,
  CheckCircle2, Zap
} from 'lucide-react';
import { generateProductDescription, analyzeSalesTrends } from '../services/geminiService';
import { motion } from 'motion/react';
import { db, storage } from '../firebase';
import { collection, query, getDocs, orderBy, limit, doc, updateDoc, addDoc, deleteDoc, where, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Product, Order, UserProfile, Category, Review, OfferSettings, SiteSettings } from '../types';
import { courierService } from '../services/courierService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { toast } from 'sonner';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    avgRating: 0,
    totalReviews: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const productsSnap = await getDocs(collection(db, 'products'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        
        const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const lowStock = products.filter(p => p.stock <= 10);
        setLowStockProducts(lowStock);

        const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        
        const reviews = reviewsSnap.docs.map(d => d.data() as Review);
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0;

        setStats({
          totalSales,
          totalOrders: ordersSnap.size,
          totalProducts: productsSnap.size,
          totalCustomers: usersSnap.size,
          avgRating,
          totalReviews: reviewsSnap.size
        });

        // Process chart data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const salesByDay = last7Days.map(date => {
          const dayOrders = orders.filter(o => {
            const oDate = o.createdAt ? new Date((o.createdAt as any).seconds * 1000).toISOString().split('T')[0] : '';
            return oDate === date;
          });
          return {
            name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            orders: dayOrders.length
          };
        });

        setChartData(salesByDay);

        const recentQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(recentQuery);
        setRecentOrders(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));

        const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(4));
        const reviewsRecentSnap = await getDocs(reviewsQuery);
        setRecentReviews(reviewsRecentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const categories = [
        { name: "Organic Honey", slug: "organic-honey", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800" },
        { name: "Pure Ghee", slug: "pure-ghee", image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800" },
        { name: "Dry Fruits", slug: "dry-fruits", image: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=800" },
        { name: "Natural Spices", slug: "natural-spices", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800" },
      ];

      for (const cat of categories) {
        await addDoc(collection(db, 'categories'), cat);
      }

      const products = [
        { name: "Premium Sundarban Honey", description: "100% pure and natural honey collected from the Sundarbans. Rich in antioxidants and minerals.", price: 850, originalPrice: 950, category: "organic-honey", stock: 120, images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800"], createdAt: new Date().toISOString() },
        { name: "Traditional Cow Ghee", description: "Hand-churned traditional cow ghee made from grass-fed cows. Perfect for cooking and health.", price: 1200, originalPrice: 1400, category: "pure-ghee", stock: 45, images: ["https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800"], createdAt: new Date().toISOString() },
        { name: "Premium Mixed Dry Fruits", description: "A healthy mix of almonds, cashews, walnuts, and raisins. High energy snack.", price: 1500, originalPrice: 1800, category: "dry-fruits", stock: 80, images: ["https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=800"], createdAt: new Date().toISOString() },
        { name: "Organic Turmeric Powder", description: "Pure organic turmeric powder with high curcumin content. No artificial colors.", price: 350, originalPrice: 450, category: "natural-spices", stock: 200, images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"], createdAt: new Date().toISOString() },
        { name: "Black Seed Honey", description: "Pure honey infused with black seed (Kalijira) extracts for extra health benefits.", price: 950, originalPrice: 1100, category: "organic-honey", stock: 60, images: ["https://images.unsplash.com/photo-1471943311424-646960669fbc?w=800"], createdAt: new Date().toISOString() },
        { name: "Roasted Salted Cashews", description: "Premium quality cashews, perfectly roasted and lightly salted.", price: 1100, originalPrice: 1300, category: "dry-fruits", stock: 100, images: ["https://images.unsplash.com/photo-1509911595703-f145ee659b99?w=800"], createdAt: new Date().toISOString() },
        { name: "Pure Mustard Oil", description: "Cold-pressed pure mustard oil, rich in flavor and aroma. Traditional extraction.", price: 280, originalPrice: 320, category: "pure-ghee", stock: 150, images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800"], createdAt: new Date().toISOString() },
        { name: "Cinnamon Sticks", description: "Premium quality organic cinnamon sticks from the best gardens.", price: 450, originalPrice: 550, category: "natural-spices", stock: 90, images: ["https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800"], createdAt: new Date().toISOString() },
      ];

      for (const prod of products) {
        const docRef = await addDoc(collection(db, 'products'), prod);
        
        // Add a sample review for each product
        await addDoc(collection(db, 'reviews'), {
          productId: docRef.id,
          userId: 'admin',
          userName: 'Verified Buyer',
          rating: 5,
          comment: `This ${prod.name} is absolutely amazing! Highly recommended.`,
          createdAt: new Date().toISOString()
        });
      }

      toast.success("Seed data added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAiInsights = async () => {
    setAnalyzing(true);
    try {
      const insights = await analyzeSalesTrends(chartData);
      setAiInsights(insights);
    } catch (error) {
      toast.error("AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleGetAiInsights} 
            disabled={analyzing} 
            variant="outline" 
            className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
          >
            <Sparkles className={`h-4 w-4 mr-2 ${analyzing ? 'animate-pulse' : ''}`} />
            {analyzing ? "Analyzing..." : "AI Insights"}
          </Button>
          <Button onClick={handleSeedData} disabled={loading} variant="outline" className="rounded-xl">
            {loading ? "Seeding..." : "Seed Initial Data"}
          </Button>
        </div>
      </div>

      {aiInsights && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-24 w-24 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              AI Business Insights
            </h3>
            <div className="text-sm text-indigo-800 whitespace-pre-line leading-relaxed">
              {aiInsights}
            </div>
            <Button variant="ghost" size="sm" className="mt-4 text-indigo-600 hover:bg-indigo-100 h-7 text-[10px] font-bold uppercase" onClick={() => setAiInsights('')}>
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: `৳${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12.5%", desc: "Lifetime earnings" },
          { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-50", trend: "+8.2%", desc: "Completed orders" },
          { title: "Customer Rating", value: `${stats.avgRating.toFixed(1)}/5.0`, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", trend: stats.totalReviews, desc: "Total reviews" },
          { title: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-rose-600", bg: "bg-rose-50", trend: "+15.3%", desc: "Registered users" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-100 rounded-full px-2 py-0">
                  {stat.trend}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-3xl font-bold tracking-tighter mb-1">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Daily sales performance for the last 7 days</CardDescription>
            </div>
            {lowStockProducts.length > 0 && (
              <Badge variant="destructive" className="rounded-full animate-pulse">
                {lowStockProducts.length} Low Stock Items
              </Badge>
            )}
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`৳${value}`, 'Sales']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>Latest customer feedback</CardDescription>
            </div>
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentReviews.length > 0 ? recentReviews.map((review) => (
                <div key={review.id} className="space-y-2 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{review.userName}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 italic">"{review.comment}"</p>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No reviews yet</div>
              )}
            </div>
            <Button render={<Link to="/admin/reviews" />} variant="ghost" className="w-full mt-6 text-primary font-bold text-xs uppercase tracking-widest">
              Manage All Reviews
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-primary font-bold text-xs">
                      {order.shippingAddress.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold line-clamp-1">{order.shippingAddress.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {order.createdAt ? new Date((order.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">৳{order.totalAmount.toLocaleString()}</p>
                    <Badge variant="outline" className="text-[10px] uppercase h-5">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button render={<Link to="/admin/orders" />} variant="ghost" className="w-full mt-6 text-primary font-bold text-xs uppercase tracking-widest">
              View All Orders
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Most popular items in your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Premium Sundarban Honey", sales: 145, revenue: 123250, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800" },
                { name: "Traditional Cow Ghee", sales: 98, revenue: 117600, image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800" },
                { name: "Premium Mixed Dry Fruits", sales: 76, revenue: 114000, image: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=800" },
                { name: "Organic Turmeric Powder", sales: 112, revenue: 39200, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800" },
              ].map((product, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold truncate">{product.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{product.sales} Sales</p>
                      <p className="text-xs font-bold text-primary">৳{product.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button render={<Link to="/admin/products" />} variant="ghost" className="w-full mt-6 text-primary font-bold text-xs uppercase tracking-widest">
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    stock: 0,
    sku: '',
    weight: '',
    images: [''],
    isFlashSale: false,
    flashSaleEnd: '',
    isChinaImport: true
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'category') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `${type}s/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      if (type === 'product') {
        setFormData(prev => ({ ...prev, images: [url] }));
      } else {
        // This will be used in CategoryManagement
        return url;
      }
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    
    const cSnap = await getDocs(collection(db, 'categories'));
    setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: editingProduct.price,
        originalPrice: editingProduct.originalPrice || 0,
        category: editingProduct.category,
        stock: editingProduct.stock,
        sku: editingProduct.sku || '',
        weight: editingProduct.weight || '',
        images: editingProduct.images.length > 0 ? editingProduct.images : [''],
        isFlashSale: editingProduct.isFlashSale || false,
        flashSaleEnd: editingProduct.flashSaleEnd || '',
        isChinaImport: editingProduct.isChinaImport !== undefined ? editingProduct.isChinaImport : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        category: '',
        stock: 0,
        sku: '',
        weight: '',
        images: [''],
        isFlashSale: false,
        flashSaleEnd: '',
        isChinaImport: true
      });
    }
  }, [editingProduct]);

  const handleAiGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Please enter product name and category first");
      return;
    }
    setGeneratingAi(true);
    try {
      const desc = await generateProductDescription(formData.name, formData.category);
      setFormData(prev => ({ ...prev, description: desc }));
      toast.success("AI description generated!");
    } catch (error) {
      toast.error("AI generation failed");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success("Product added successfully!");
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success("Product deleted");
        fetchProducts();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage your products, stock, and pricing.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or SKU..." 
              className="pl-9 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingProduct(null);
          }}>
            <DialogTrigger
              render={
                <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              }
            />
            <DialogContent className="max-w-2xl rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-2 col-span-2">
                  <Label className="font-bold">Product Name*</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Premium Organic Honey" 
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold">Description</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold text-primary hover:bg-primary/10"
                      onClick={handleAiGenerateDescription}
                      disabled={generatingAi}
                    >
                      <Sparkles className={`h-3 w-3 mr-1 ${generatingAi ? 'animate-spin' : ''}`} />
                      {generatingAi ? "Generating..." : "Generate with AI"}
                    </Button>
                  </div>
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Detailed product description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Sale Price (৳)*</Label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Original Price (৳)</Label>
                  <Input type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">SKU</Label>
                  <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. HON-001" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Weight / Unit</Label>
                  <Input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 500g" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Category*</Label>
                  <select 
                    className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Stock Quantity*</Label>
                  <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="rounded-xl h-12" />
                </div>
                <div className="space-y-4 col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${formData.isFlashSale ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
                      <Label className="font-bold">Flash Sale</Label>
                    </div>
                    <button 
                      className={`w-10 h-6 rounded-full transition-colors relative ${formData.isFlashSale ? 'bg-red-500' : 'bg-slate-200'}`}
                      onClick={() => setFormData({...formData, isFlashSale: !formData.isFlashSale})}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isFlashSale ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                  {formData.isFlashSale && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500">Flash Sale End Date & Time</Label>
                      <Input 
                        type="datetime-local" 
                        value={formData.flashSaleEnd} 
                        onChange={e => setFormData({...formData, flashSaleEnd: e.target.value})} 
                        className="rounded-xl h-10"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${formData.isChinaImport ? 'text-amber-500' : 'text-slate-400'}`} />
                      <Label className="font-bold">China Import</Label>
                    </div>
                    <button 
                      className={`w-10 h-6 rounded-full transition-colors relative ${formData.isChinaImport ? 'bg-amber-500' : 'bg-slate-200'}`}
                      onClick={() => setFormData({...formData, isChinaImport: !formData.isChinaImport})}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isChinaImport ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="font-bold">Product Image</Label>
                  <div className="flex items-center gap-4">
                    {formData.images[0] && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border">
                        <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-grow">
                      <Input type="file" onChange={e => handleImageUpload(e, 'product')} accept="image/*" className="rounded-xl" />
                      {uploading && <p className="text-xs text-primary animate-pulse mt-1">Uploading image...</p>}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 px-8">Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading || uploading} className="rounded-xl h-12 px-8 font-bold">
                  {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="w-12 h-12 rounded-xl overflow-hidden border bg-muted">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-2 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{product.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">SKU: {product.sku || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">৳{product.price.toLocaleString()}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[10px] text-muted-foreground line-through">৳{product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-rose-600' : ''}`}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => {
                        setEditingProduct(product);
                        setIsDialogOpen(true);
                      }}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `categories/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const fetchCategories = async () => {
    const snap = await getDocs(collection(db, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        slug: editingCategory.slug,
        image: editingCategory.image || ''
      });
    } else {
      setFormData({ name: '', slug: '', image: '' });
    }
  }, [editingCategory]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and Slug are required");
      return;
    }

    setLoading(true);
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), formData);
        toast.success("Category updated");
      } else {
        await addDoc(collection(db, 'categories'), formData);
        toast.success("Category added");
      }
      setIsDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this category?")) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success("Category deleted");
        fetchCategories();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL identifier)</Label>
                <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
              </div>
              <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-lg bg-muted border overflow-hidden shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No Image</div>
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <Input 
                      value={formData.image} 
                      onChange={e => setFormData({...formData, image: e.target.value})} 
                      placeholder="Or paste image URL"
                    />
                  </div>
                </div>
                {uploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map(cat => (
          <Card key={cat.id} className="overflow-hidden border-none shadow-sm group">
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img src={cat.image || `https://picsum.photos/seed/${cat.slug}/400/200`} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => {
                  setEditingCategory(cat);
                  setIsDialogOpen(true);
                }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}>Delete</Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold">{cat.name}</h3>
              <p className="text-xs text-muted-foreground">slug: {cat.slug}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const OrderTimeline = ({ status, createdAt, updatedAt, courierInfo }: { status: string, createdAt: any, updatedAt?: string, courierInfo?: any }) => {
  const steps = [
    { label: 'Placed', active: true },
    { label: 'Processing', active: ['processing', 'shipped', 'delivered'].includes(status) },
    { label: 'Shipped', active: ['shipped', 'delivered'].includes(status) },
    { label: 'Delivered', active: status === 'delivered' },
  ];

  return (
    <div className="relative flex justify-between items-center w-full py-6 px-4">
      <div className="absolute h-[2px] bg-slate-100 left-8 right-8 top-1/2 -translate-y-1/2 z-0" />
      {steps.map((step, i) => (
        <div key={i} className="relative z-10 flex flex-col items-center">
          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            step.active ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-200'
          }`}>
            {step.active && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
          <p className={`text-[9px] font-bold mt-2 uppercase tracking-tighter ${step.active ? 'text-primary' : 'text-slate-400'}`}>
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
};

const OrderManagement = ({ showIncomplete = false }: { showIncomplete?: boolean }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [showIncomplete]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSendToCourier = async (order: Order) => {
    setLoading(true);
    try {
      const response = await courierService.sendOrder(order);
      if (response.success && response.trackingId) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'shipped',
          courierInfo: {
            courierName: 'Steadfast Courier', // Default for now
            trackingId: response.trackingId,
            status: 'Pending',
            lastUpdated: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        });
        toast.success("Order sent to courier successfully!");
        fetchOrders();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Courier error:", error);
      toast.error("Failed to send order to courier");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTracking = async (orderId: string, trackingId: string) => {
    try {
      const newStatus = await courierService.getTrackingStatus(trackingId);
      await updateDoc(doc(db, 'orders', orderId), {
        'courierInfo.status': newStatus,
        'courierInfo.lastUpdated': new Date().toISOString()
      });
      toast.success("Tracking status updated");
      fetchOrders();
    } catch (error) {
      console.error("Tracking error:", error);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const subtotal = order.totalAmount - (order.totalAmount >= 2000 ? 0 : 100);
    const shipping = order.totalAmount >= 2000 ? 0 : 100;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.5; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #10b981; }
            .invoice-info { text-align: right; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f9fafb; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
            .totals { margin-left: auto; width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: #10b981; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ApnarPonno</div>
            <div class="invoice-info">
              <div style="font-weight: bold;">INVOICE</div>
              <div>Order ID: #${order.id.substring(0, 8)}</div>
              <div>Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div style="display: flex; gap: 50px;" class="section">
            <div style="flex: 1;">
              <div class="section-title">Bill To:</div>
              <div style="font-weight: bold;">${order.shippingAddress.name}</div>
              <div>${order.shippingAddress.phone}</div>
              <div>${order.shippingAddress.address}</div>
              <div>${order.shippingAddress.city}</div>
            </div>
            <div style="flex: 1;">
              <div class="section-title">Payment Method:</div>
              <div>${order.paymentMethod.toUpperCase()}</div>
              <div class="section-title" style="margin-top: 15px;">Shipping Method:</div>
              <div>Standard Delivery</div>
            </div>
          </div>

          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>৳${subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>৳${shipping.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total:</span>
              <span>৳${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with ApnarPonno!</p>
            <p>For any queries, contact us at support@apnarponno.com</p>
          </div>

          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleConvertToPending = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
      toast.success("Order converted to Pending status");
      fetchOrders();
    } catch (error) {
      console.error("Error converting order:", error);
      toast.error("Failed to convert order");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        toast.success("Order deleted successfully");
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
      }
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrderIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedOrderIds.map(id => 
        updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: new Date().toISOString() })
      ));
      toast.success(`Updated ${selectedOrderIds.length} orders to ${newStatus}`);
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (error) {
      toast.error("Bulk update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (window.confirm(`Delete ${selectedOrderIds.length} selected orders?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedOrderIds.map(id => deleteDoc(doc(db, 'orders', id))));
        toast.success(`Deleted ${selectedOrderIds.length} orders`);
        setSelectedOrderIds([]);
        fetchOrders();
      } catch (error) {
        toast.error("Bulk delete failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddress.phone.includes(searchQuery);
    
    const matchesStatus = showIncomplete ? order.status === 'incomplete' : order.status !== 'incomplete';
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {showIncomplete ? "Incomplete Orders" : "Order Management"}
          </h2>
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-left-2">
              <span className="text-xs font-bold text-primary">{selectedOrderIds.length} Selected</span>
              <div className="h-4 w-[1px] bg-primary/20 mx-1" />
              <select 
                className="h-7 rounded-lg border-none bg-transparent text-[10px] font-bold text-primary focus:ring-0 cursor-pointer"
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                value=""
              >
                <option value="" disabled>Update Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
            <Clock className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            className="hidden md:flex items-center gap-2"
            onClick={() => {
              const csv = [
                ['Order ID', 'Customer', 'Phone', 'Amount', 'Status', 'Date'].join(','),
                ...filteredOrders.map(o => [
                  o.id,
                  o.shippingAddress.name,
                  o.shippingAddress.phone,
                  o.totalAmount,
                  o.status,
                  o.createdAt ? new Date((o.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'
                ].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('hidden', '');
              a.setAttribute('href', url);
              a.setAttribute('download', `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.success("Report downloaded successfully");
            }}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-bold">Export</span>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <div 
                    className={`h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                      selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0
                        ? 'bg-primary border-primary' 
                        : 'border-slate-300 hover:border-primary'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedOrderIds.length === filteredOrders.length) {
                        setSelectedOrderIds([]);
                      } else {
                        setSelectedOrderIds(filteredOrders.map(o => o.id));
                      }
                    }}
                  >
                    {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow 
                    className={`cursor-pointer transition-colors ${expandedOrderId === order.id ? 'bg-muted/50' : 'hover:bg-muted/30'} ${selectedOrderIds.includes(order.id) ? 'bg-primary/5' : ''}`} 
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div 
                        className={`h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                          selectedOrderIds.includes(order.id)
                            ? 'bg-primary border-primary' 
                            : 'border-slate-300 hover:border-primary'
                        }`}
                        onClick={() => {
                          setSelectedOrderIds(prev => 
                            prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id]
                          );
                        }}
                      >
                        {selectedOrderIds.includes(order.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.shippingAddress.name}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{order.shippingAddress.address}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{order.shippingAddress.phone}</TableCell>
                    <TableCell className="font-bold text-primary">৳{order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          order.status === 'delivered' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                          order.status === 'processing' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                          order.status === 'incomplete' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' :
                          'bg-slate-100 text-slate-700 hover:bg-slate-100'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date((order.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'incomplete' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] font-bold border-primary text-primary hover:bg-primary hover:text-white"
                            onClick={() => handleConvertToPending(order.id)}
                          >
                            Convert to Order
                          </Button>
                        ) : (
                          <select 
                            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteOrder(order.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedOrderId === order.id && (
                    <TableRow className="bg-muted/20 border-b-2 border-primary/10">
                      <TableCell colSpan={8} className="p-0">
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="p-6 overflow-hidden"
                        >
                          <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 text-center">Order Status Timeline</h3>
                            <OrderTimeline 
                              status={order.status} 
                              createdAt={order.createdAt} 
                              updatedAt={order.updatedAt} 
                              courierInfo={order.courierInfo} 
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div className="space-y-3">
                              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer Info</h3>
                              <div className="space-y-1 text-xs">
                                <p><span className="font-medium text-muted-foreground">Order ID:</span> <span className="font-mono">{order.id}</span> 
                                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-2" onClick={() => {
                                    navigator.clipboard.writeText(order.id);
                                    toast.success("Tracking ID copied!");
                                  }}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </p>
                                <p><span className="font-medium text-muted-foreground">Name:</span> {order.shippingAddress.name}</p>
                                <p><span className="font-medium text-muted-foreground">Phone:</span> {order.shippingAddress.phone}</p>
                                <p><span className="font-medium text-muted-foreground">Address:</span> {order.shippingAddress.address}</p>
                                <p><span className="font-medium text-muted-foreground">City:</span> {order.shippingAddress.city}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment & Courier Info</h3>
                              <div className="space-y-1 text-xs">
                                <p><span className="font-medium text-muted-foreground">Method:</span> {order.paymentMethod.toUpperCase()}</p>
                                <p><span className="font-medium text-muted-foreground">Payment Status:</span> <Badge variant="outline" className="text-[10px] h-5">{order.paymentStatus}</Badge></p>
                                {order.courierInfo ? (
                                  <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10 space-y-1">
                                    <p className="font-bold text-primary">Courier: {order.courierInfo.courierName}</p>
                                    <p>Tracking ID: <span className="font-mono">{order.courierInfo.trackingId}</span></p>
                                    <p>Status: <Badge className="bg-emerald-500">{order.courierInfo.status}</Badge></p>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 text-[10px] mt-1" 
                                      onClick={() => handleRefreshTracking(order.id, order.courierInfo!.trackingId)}
                                    >
                                      Refresh Tracking
                                    </Button>
                                  </div>
                                ) : (
                                  order.status !== 'incomplete' && order.status !== 'cancelled' && (
                                    <Button 
                                      className="mt-2 w-full h-8 text-xs font-bold" 
                                      onClick={() => handleSendToCourier(order)}
                                      disabled={loading}
                                    >
                                      Send to Courier API
                                    </Button>
                                  )
                                )}
                                <Button 
                                  variant="outline" 
                                  className="mt-2 w-full h-8 text-xs font-bold border-slate-200 hover:bg-slate-50" 
                                  onClick={() => handlePrintInvoice(order)}
                                >
                                  <Copy className="h-3 w-3 mr-2" />
                                  Print Invoice
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Items</h3>
                            <div className="border rounded-lg overflow-hidden bg-background">
                              <Table>
                                <TableHeader className="bg-muted/50">
                                  <TableRow className="h-8">
                                    <TableHead className="text-[10px] h-8">Product</TableHead>
                                    <TableHead className="text-center text-[10px] h-8">Qty</TableHead>
                                    <TableHead className="text-right text-[10px] h-8">Price</TableHead>
                                    <TableHead className="text-right text-[10px] h-8">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item, i) => (
                                    <TableRow key={i} className="h-8">
                                      <TableCell className="font-medium text-[11px] py-1">{item.name}</TableCell>
                                      <TableCell className="text-center text-[11px] py-1">{item.quantity}</TableCell>
                                      <TableCell className="text-right text-[11px] py-1">৳{item.price.toLocaleString()}</TableCell>
                                      <TableCell className="text-right text-[11px] py-1 font-bold">৳{(item.price * item.quantity).toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="bg-muted/30 font-bold h-8">
                                    <TableCell colSpan={3} className="text-right text-[11px] py-1">Subtotal</TableCell>
                                    <TableCell className="text-right text-[11px] py-1">৳{(order.totalAmount - (order.totalAmount >= 2000 ? 0 : 100)).toLocaleString()}</TableCell>
                                  </TableRow>
                                  <TableRow className="bg-muted/30 font-bold h-8">
                                    <TableCell colSpan={3} className="text-right text-[11px] py-1">Shipping</TableCell>
                                    <TableCell className="text-right text-[11px] py-1">৳{order.totalAmount >= 2000 ? 0 : 100}</TableCell>
                                  </TableRow>
                                  <TableRow className="bg-primary text-primary-foreground font-bold h-10">
                                    <TableCell colSpan={3} className="text-right text-xs">Grand Total</TableCell>
                                    <TableCell className="text-right text-sm">৳{order.totalAmount.toLocaleString()}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const OfferManagement = () => {
  const [settings, setSettings] = useState<OfferSettings>({
    title: 'Exclusive Offers',
    description: "Don't miss out on our premium organic selection at unbeatable prices.",
    bannerImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDocs(collection(db, 'offerSettings'));
        if (!docSnap.empty) {
          setSettings(docSnap.docs[0].data() as OfferSettings);
        }
      } catch (error) {
        console.error("Error fetching offer settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `offers/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setSettings(prev => ({ ...prev, bannerImage: url }));
      toast.success("Banner image uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'offerSettings'));
      if (snap.empty) {
        await addDoc(collection(db, 'offerSettings'), settings);
      } else {
        await updateDoc(doc(db, 'offerSettings', snap.docs[0].id), settings as any);
      }
      toast.success("Offer settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Offer Page Management</h2>
        <p className="text-muted-foreground">Customize the header and banner of your offers page.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Header Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input 
              value={settings.title} 
              onChange={e => setSettings({...settings, title: e.target.value})} 
              placeholder="e.g. Exclusive Offers"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea 
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={settings.description} 
              onChange={e => setSettings({...settings, description: e.target.value})} 
              placeholder="Enter page description..."
            />
          </div>
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div className="flex gap-4 items-start">
              <div className="w-32 h-20 rounded-lg bg-muted border overflow-hidden shrink-0">
                {settings.bannerImage ? (
                  <img src={settings.bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No Image</div>
                )}
              </div>
              <div className="flex-grow space-y-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Input 
                  value={settings.bannerImage} 
                  onChange={e => setSettings({...settings, bannerImage: e.target.value})} 
                  placeholder="Or paste image URL"
                />
              </div>
            </div>
            {uploading && <p className="text-xs text-primary animate-pulse">Uploading...</p>}
          </div>
          <Button onClick={handleSave} disabled={loading || uploading} className="w-full">
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    userName: 'Admin',
    rating: 5,
    comment: ''
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')));
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      
      const pSnap = await getDocs(collection(db, 'products'));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    if (!formData.productId || !formData.comment) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        ...formData,
        userId: 'admin',
        userPhoto: '',
        createdAt: new Date().toISOString()
      });
      toast.success("Review added by admin");
      setIsDialogOpen(false);
      setFormData({ productId: '', userName: 'Admin', rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      console.error("Error adding review:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this review?")) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
        toast.success("Review deleted");
        fetchReviews();
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Review Management</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search reviews..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Review
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Product</Label>
                  <select 
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.productId}
                    onChange={e => setFormData({...formData, productId: e.target.value})}
                  >
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Reviewer Name</Label>
                  <Input value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setFormData({...formData, rating: star})}>
                        <Star className={`h-6 w-6 ${star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Comment</Label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.comment}
                    onChange={e => setFormData({...formData, comment: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>{loading ? "Adding..." : "Add Review"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map(review => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                        {review.userPhoto ? (
                          <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-full h-full p-1.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{review.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-xs">{review.comment}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(review.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      setCustomers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Customer Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search customers..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => (
                <TableRow key={customer.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {customer.photoURL ? (
                          <img src={customer.photoURL} alt={customer.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{customer.displayName || 'Unnamed User'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'}>
                      {customer.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsManagement = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'ApnarPonno',
    contactEmail: 'support@apnarponno.com',
    contactPhone: '+880 1XXX XXXXXX',
    address: 'Dhaka, Bangladesh',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    announcement: 'Welcome to ApnarPonno - Your Trusted Online Shop!',
    primaryColor: '#10b981',
    logoUrl: '',
    chinaImportBanner: true,
    chinaImportText: 'Directly Imported from China - Premium Quality Guaranteed',
    themeMode: 'luxury'
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDocs(collection(db, 'settings'));
        if (!snap.empty) {
          setSettings(snap.docs[0].data() as SiteSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `settings/logo_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setSettings(prev => ({ ...prev, logoUrl: url }));
      toast.success("Logo uploaded!");
    } catch (error) {
      toast.error("Logo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'settings'));
      if (snap.empty) {
        await addDoc(collection(db, 'settings'), settings);
      } else {
        await updateDoc(doc(db, 'settings', snap.docs[0].id), settings as any);
      }
      toast.success("Settings saved successfully");
      if (settings.primaryColor) {
        document.documentElement.style.setProperty('--primary', settings.primaryColor);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Site Customization</h2>
          <p className="text-muted-foreground text-sm">Manage your brand identity and site-wide settings.</p>
        </div>
        <Button onClick={handleSave} disabled={loading || uploading} className="gap-2">
          {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              General Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-muted border flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="flex-grow space-y-2">
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                  <Input value={settings.logoUrl} onChange={e => setSettings({...settings, logoUrl: e.target.value})} placeholder="Or logo URL" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Primary Brand Color</Label>
              <div className="flex gap-3">
                <Input type="color" className="w-12 h-10 p-1" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} />
                <Input value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} placeholder="#hex-color" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              China Import Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">China Import Banner</Label>
                <p className="text-[10px] text-muted-foreground">Show "Imported from China" badge on site</p>
              </div>
              <button 
                className={`w-10 h-6 rounded-full transition-colors relative ${settings.chinaImportBanner ? 'bg-primary' : 'bg-slate-200'}`}
                onClick={() => setSettings({...settings, chinaImportBanner: !settings.chinaImportBanner})}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.chinaImportBanner ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            <div className="space-y-2">
              <Label>Import Banner Text</Label>
              <Input value={settings.chinaImportText} onChange={e => setSettings({...settings, chinaImportText: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Theme Style</Label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.themeMode}
                onChange={e => setSettings({...settings, themeMode: e.target.value as any})}
              >
                <option value="light">Modern Light</option>
                <option value="dark">Sleek Dark</option>
                <option value="luxury">Editorial Luxury</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Contact & Support Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Store Address</Label>
                <textarea 
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.address} 
                  onChange={e => setSettings({...settings, address: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Announcement Bar Text</Label>
                <Input value={settings.announcement} onChange={e => setSettings({...settings, announcement: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Facebook Page URL</Label>
                <Input value={settings.facebookUrl} onChange={e => setSettings({...settings, facebookUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input value={settings.instagramUrl} onChange={e => setSettings({...settings, instagramUrl: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CourierSettings = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    secretKey: '',
    provider: 'steadfast'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'courier'));
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'courier'), config);
      courierService.setConfiguration({
        apiKey: config.apiKey,
        secretKey: config.secretKey,
        provider: config.provider as any
      });
      toast.success("Courier settings saved successfully!");
    } catch (error) {
      console.error("Error saving courier settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Courier Integration</h2>
        <p className="text-sm text-muted-foreground">Configure your courier API credentials for direct order fulfillment.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold">Courier Provider</Label>
            <select 
              className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={config.provider}
              onChange={e => setConfig({...config, provider: e.target.value})}
            >
              <option value="steadfast">Steadfast Courier</option>
              <option value="pathao">Pathao</option>
              <option value="redx">RedX</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">API Key</Label>
            <Input 
              type="password" 
              value={config.apiKey} 
              onChange={e => setConfig({...config, apiKey: e.target.value})} 
              placeholder="Enter your API Key"
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Secret Key / Store ID</Label>
            <Input 
              type="password" 
              value={config.secretKey} 
              onChange={e => setConfig({...config, secretKey: e.target.value})} 
              placeholder="Enter your Secret Key or Store ID"
              className="rounded-xl h-12"
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold">Important Note:</p>
              <p>Your API keys are stored securely in your database. Make sure you have the correct permissions set up in your courier account.</p>
            </div>
          </div>

          <Button 
            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Tag, label: 'Categories', path: '/admin/categories' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: Clock, label: 'Incomplete Orders', path: '/admin/incomplete' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: Truck, label: 'Courier API', path: '/admin/courier' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: Megaphone, label: 'Offers & Campaigns', path: '/admin/offers' },
    { icon: Settings, label: 'Site Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <Link to="/" className="text-2xl font-bold text-primary tracking-tight">ApnarPonno</Link>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Admin Control Center</p>
        </div>
        
        <nav className="flex-grow px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
                <span className="text-sm font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/orders" element={<OrderManagement showIncomplete={false} />} />
          <Route path="/incomplete" element={<OrderManagement showIncomplete={true} />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/courier" element={<CourierSettings />} />
          <Route path="/reviews" element={<ReviewManagement />} />
          <Route path="/offers" element={<OfferManagement />} />
          <Route path="/settings" element={<SettingsManagement />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
