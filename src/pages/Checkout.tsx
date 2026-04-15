import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle2, CreditCard, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const draftOrderIdRef = useRef<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    phone: '',
    address: '',
    city: '',
    paymentMethod: 'cod'
  });

  // Handle incomplete order system (Drafts)
  useEffect(() => {
    if (cart.length === 0) return;

    const saveDraft = async () => {
      // Only save if at least name or phone is provided
      if (!formData.name && !formData.phone) return;

      try {
        const draftData = {
          userId: user?.uid || 'guest',
          items: cart,
          totalAmount: totalPrice + (totalPrice >= 2000 ? 0 : 100),
          status: 'incomplete', // Mark as incomplete
          shippingAddress: {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
          },
          paymentMethod: formData.paymentMethod,
          paymentStatus: 'pending',
          updatedAt: serverTimestamp(),
        };

        if (draftOrderIdRef.current) {
          await updateDoc(doc(db, 'orders', draftOrderIdRef.current), draftData);
        } else {
          const docRef = await addDoc(collection(db, 'orders'), {
            ...draftData,
            createdAt: serverTimestamp(),
          });
          draftOrderIdRef.current = docRef.id;
        }
      } catch (error) {
        console.error("Error saving draft order:", error);
      }
    };

    const timeoutId = setTimeout(saveDraft, 2000); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [formData, user, cart, totalPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const orderData = {
        userId: user?.uid || 'guest',
        items: cart,
        totalAmount: totalPrice + (totalPrice >= 2000 ? 0 : 100),
        status: 'pending', // Finalize order
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        },
        paymentMethod: formData.paymentMethod,
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let finalOrderId = draftOrderIdRef.current;

      if (finalOrderId) {
        await updateDoc(doc(db, 'orders', finalOrderId), orderData);
      } else {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        finalOrderId = docRef.id;
      }
      
      setPlacedOrderId(finalOrderId);
      setOrderSuccess(true);
      clearCart();
      toast.success("Order placed successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">অর্ডার সফল হয়েছে!</h1>
          <p className="text-muted-foreground max-w-md mx-auto text-lg font-light">
            আপনার অর্ডারটি গ্রহণ করা হয়েছে। আপনার অর্ডার আইডিটি সংরক্ষণ করুন।
          </p>
        </div>
        
        <Card className="max-w-md mx-auto bg-slate-50 border-dashed border-2">
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Order Tracking ID</p>
            <p className="text-2xl font-mono font-bold text-primary">{placedOrderId}</p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button size="lg" className="h-14 px-10 font-bold rounded-full" onClick={() => navigate('/')}>Continue Shopping</Button>
          <Button size="lg" variant="outline" className="h-14 px-10 font-bold rounded-full" onClick={() => navigate(`/track-order?id=${placedOrderId}`)}>Track Order</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-10">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={formData.phone} onChange={handleInputChange} required placeholder="+880 1XXX XXXXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Input id="address" value={formData.address} onChange={handleInputChange} required placeholder="House #, Road #, Area" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={handleInputChange} required placeholder="Dhaka" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-transparent bg-background'}`}
                  onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-primary' : 'border-muted'}`}>
                    {formData.paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when you receive</p>
                  </div>
                </div>
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${formData.paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-transparent bg-background'}`}
                  onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'online' ? 'border-primary' : 'border-muted'}`}>
                    {formData.paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Online Payment</p>
                    <p className="text-xs text-muted-foreground">bKash, Nagad, Card</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-primary/10 shadow-xl sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground line-clamp-1 flex-grow mr-4">{item.name} x {item.quantity}</span>
                    <span className="font-medium shrink-0">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">৳{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Shipping
                  </span>
                  <span className="font-medium">{totalPrice >= 2000 ? "৳0 (Free)" : "৳100"}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">৳{(totalPrice + (totalPrice >= 2000 ? 0 : 100)).toLocaleString()}</span>
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
                disabled={loading || cart.length === 0}
              >
                {loading ? "অর্ডার প্রসেস হচ্ছে..." : "অর্ডার কনফার্ম করুন"}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                By placing your order, you agree to our terms and conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
