import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Star, Heart, Share2, ShieldCheck, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden luxury-shadow flex flex-col md:flex-row max-h-[90vh]"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-sm"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="md:w-1/2 h-64 md:h-auto relative bg-slate-50">
            <img
              src={product.image}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain p-8"
              referrerPolicy="no-referrer"
            />
            {product.discountPrice && (
              <Badge className="absolute top-6 left-6 bg-red-500 text-white px-3 py-1 text-sm font-bold">
                -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
              </Badge>
            )}
          </div>

          <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold">4.9 (120+ Reviews)</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
            <p className="text-sm text-muted-foreground mb-6">{product.category}</p>

            <div className="flex items-center gap-4 mb-8">
              {product.discountPrice ? (
                <>
                  <span className="text-3xl font-bold text-primary">৳{product.discountPrice}</span>
                  <span className="text-xl text-muted-foreground line-through">৳{product.price}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">৳{product.price}</span>
              )}
            </div>

            <p className="text-slate-600 mb-8 leading-relaxed">
              {product.description || "Experience the pure essence of nature with our premium organic products. Sourced directly from trusted farmers, ensuring the highest quality and nutritional value for your health."}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quality</p>
                  <p className="text-xs font-bold">100% Organic</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Truck className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shipping</p>
                  <p className="text-xs font-bold">Fast Delivery</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                className="flex-grow h-14 rounded-2xl text-lg font-bold gap-2"
                onClick={() => {
                  addToCart(product);
                  onClose();
                }}
              >
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className={`h-14 w-14 rounded-2xl border-2 ${isInWishlist(product.id) ? 'bg-red-50 border-red-200 text-red-500' : ''}`}
                onClick={() => addToWishlist(product)}
              >
                <Heart className={`h-6 w-6 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2">
                <Share2 className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
