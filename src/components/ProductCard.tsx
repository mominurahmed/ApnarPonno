import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Eye, Heart, GitCompare } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useComparison } from '../context/ComparisonContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { addToComparison, isInComparison } = useComparison();
  const navigate = useNavigate();

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/cart');
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="overflow-hidden h-full flex flex-col bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all rounded-2xl group relative">
        {/* Action Buttons Overlay */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
          <Button
            size="icon"
            variant="secondary"
            className={`rounded-full luxury-shadow h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white ${isInWishlist(product.id) ? 'text-red-500' : 'text-slate-600'}`}
            onClick={(e) => {
              e.preventDefault();
              addToWishlist(product);
            }}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className={`rounded-full luxury-shadow h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white ${isInComparison(product.id) ? 'text-primary' : 'text-slate-600'}`}
            onClick={(e) => {
              e.preventDefault();
              addToComparison(product);
            }}
          >
            <GitCompare className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full luxury-shadow h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-600"
            onClick={(e) => {
              e.preventDefault();
              // Trigger quick view
              window.dispatchEvent(new CustomEvent('open-quick-view', { detail: product }));
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Urgency Badge */}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-orange-500 text-white border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
              Only {product.stock} Left!
            </Badge>
          </div>
        )}

        <Link to={`/products/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-slate-50 block">
          <img
            src={product.images[0] || `https://picsum.photos/seed/${product.id}/400/500`}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-slate-900 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">Out of Stock</span>
            </div>
          )}
        </Link>
        
        <CardContent className="p-5 flex-grow flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{product.category.replace('-', ' ')}</p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                <Star className="h-3 w-3 fill-amber-500" />
                <span>4.8</span>
              </div>
            </div>
            <Link to={`/products/${product.id}`} className="block">
              <h3 className="font-heading font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.5rem] text-base">{product.name}</h3>
            </Link>
          </div>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                {product.originalPrice && (
                  <p className="text-xs text-slate-400 line-through mb-0.5">৳{product.originalPrice.toLocaleString()}</p>
                )}
                <p className="font-bold text-primary text-xl tracking-tight">৳{product.price.toLocaleString()}</p>
              </div>
              <Button 
                size="icon" 
                variant="ghost"
                className="rounded-xl bg-slate-50 text-slate-600 hover:bg-primary hover:text-white h-10 w-10 transition-all"
                onClick={() => {
                  addToCart(product);
                  toast.success("Added to cart");
                }}
                disabled={product.stock <= 0}
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>

            <Button 
              className="w-full bg-slate-900 hover:bg-primary text-white font-bold rounded-xl h-12 shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
            >
              এখনই কিনুন
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
