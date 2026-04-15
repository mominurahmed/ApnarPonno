import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { motion } from 'motion/react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Your cart is empty</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Looks like you haven't added anything to your cart yet. Explore our products and find something you love!
        </p>
        <Link to="/">
          <Button size="lg" className="h-12 px-8 font-bold">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-10">Shopping Cart ({totalItems})</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {/* Free Shipping Progress */}
          <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className={totalPrice >= 2000 ? "text-primary" : "text-slate-600"}>
                {totalPrice >= 2000 
                  ? "অভিনন্দন! আপনি ফ্রি ডেলিভারি পাচ্ছেন।" 
                  : `আর মাত্র ৳${(2000 - totalPrice).toLocaleString()} টাকার পণ্য কিনলেই পাচ্ছেন ফ্রি ডেলিভারি!`}
              </span>
              <span className="text-primary">{Math.min(100, (totalPrice / 2000) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalPrice / 2000) * 100)}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>

          {cart.map((item) => (
            <Card key={item.id} className="overflow-hidden border-none shadow-sm bg-muted/30">
              <CardContent className="p-4 flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0 border">
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/products/${item.id}`} className="font-bold hover:text-primary transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">{item.category}</p>
                    </div>
                    <p className="font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center border rounded-lg bg-background">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-bold">Order Summary</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">৳{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{totalPrice >= 2000 ? "৳0 (Free)" : "৳100"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">৳0</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">৳{(totalPrice + (totalPrice >= 2000 ? 0 : 100)).toLocaleString()}</span>
                </div>
              </div>
              <Button 
                className="w-full h-12 gap-2 text-base font-bold rounded-xl"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
          
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
            <h3 className="font-bold text-sm">Have a coupon?</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Coupon code" 
                className="flex-grow h-10 rounded-lg border bg-background px-3 text-sm"
              />
              <Button variant="secondary" size="sm">Apply</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
