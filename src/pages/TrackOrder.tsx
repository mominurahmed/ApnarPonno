import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdParam = searchParams.get('id');
  
  const [orderId, setOrderId] = useState(orderIdParam || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        setError("Order not found. Please check the ID and try again.");
        setOrder(null);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to fetch order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIdParam) {
      fetchOrder(orderIdParam);
    }
  }, [orderIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
      setSearchParams({ id: orderId });
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const steps = [
    { label: 'অর্ডার গ্রহণ', icon: Clock, status: 'pending' },
    { label: 'প্রসেসিং হচ্ছে', icon: Package, status: 'processing' },
    { label: 'ডেলিভারি পথে', icon: Truck, status: 'shipped' },
    { label: 'ডেলিভারি সম্পন্ন', icon: CheckCircle2, status: 'delivered' },
  ];

  const currentStep = order ? getStatusStep(order.status) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 blur-[120px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -ml-48 -mb-48" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white tracking-tight">অর্ডার ট্র্যাক করুন</h1>
            <p className="text-white/60 max-w-xl mx-auto text-lg font-light">
              আপনার অর্ডার আইডি দিয়ে বর্তমান অবস্থা জেনে নিন।
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Search Card */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="আপনার অর্ডার আইডি দিন (e.g. abc123xyz)" 
                    className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all text-lg"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? "খোঁজা হচ্ছে..." : "ট্র্যাক করুন"}
                </Button>
              </form>
              {error && <p className="mt-4 text-sm text-destructive font-medium text-center">{error}</p>}
            </CardContent>
          </Card>

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Progress */}
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
                <CardContent className="p-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 hidden md:block" />
                    <div 
                      className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 hidden md:block transition-all duration-1000" 
                      style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((step, i) => {
                      const isCompleted = currentStep > i + 1;
                      const isCurrent = currentStep === i + 1;
                      const Icon = step.icon;

                      return (
                        <div key={i} className="flex md:flex-col items-center gap-4 md:gap-4 relative z-10 flex-grow">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            isCompleted || isCurrent ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="text-left md:text-center">
                            <p className={`text-sm font-bold ${isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                            {isCurrent && <Badge className="mt-1 bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest">Current</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      অর্ডার সামারি
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-500">{item.name} x {item.quantity}</span>
                          <span className="font-bold">৳{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>মোট</span>
                      <span className="text-primary">৳{order.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      অর্ডার করা হয়েছে: {new Date((order.createdAt as any).seconds * 1000).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      ডেলিভারি ঠিকানা
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-bold text-slate-900">{order.shippingAddress.name}</p>
                      <p className="text-sm text-slate-500">{order.shippingAddress.phone}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {order.shippingAddress.address}, {order.shippingAddress.city}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Payment Method</p>
                      <p className="text-sm font-bold uppercase">{order.paymentMethod}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {!order && !loading && !error && (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-400">আপনার অর্ডার ট্র্যাক করুন</h3>
                <p className="text-slate-400 max-w-xs mx-auto text-sm">
                  অর্ডার করার পর প্রাপ্ত আইডিটি এখানে দিয়ে বর্তমান অবস্থা চেক করুন।
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
