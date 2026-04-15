import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, LogOut, LayoutDashboard, Heart, Phone, MapPin, Clock, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Button } from './ui/button';
import { auth, db } from '../firebase';
import { collection, query, where, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { Product, SiteSettings } from '../types';
import { CartDrawer } from './CartDrawer';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'settings'), (snap) => {
      if (!snap.empty) {
        const settings = snap.docs[0].data() as SiteSettings;
        setSiteSettings(settings);
        if (settings.primaryColor) {
          document.documentElement.style.setProperty('--primary', settings.primaryColor);
        }
        if (settings.themeMode) {
          document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-luxury');
          document.documentElement.classList.add(`theme-${settings.themeMode}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'products'),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/shop?q=${searchQuery}`);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar - Info */}
      {siteSettings?.chinaImportBanner && (
        <div className="bg-amber-400 text-slate-900 py-1.5 text-center overflow-hidden relative">
          <motion.div 
            animate={{ x: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4"
          >
            <Truck className="h-3 w-3" />
            {siteSettings.chinaImportText || 'Directly Imported from China'}
            <Truck className="h-3 w-3" />
          </motion.div>
        </div>
      )}
      <div className="hidden md:block bg-slate-900 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-primary" />
              <span>{siteSettings?.contactPhone || '+880 1234 567890'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{siteSettings?.address || 'Dhaka, Bangladesh'}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-primary" />
              <span>{siteSettings?.announcement || 'Delivery: 24/7 Service'}</span>
            </div>
            <Link to="/track-order" className="hover:text-primary transition-colors">Track Order</Link>
          </div>
        </div>
      </div>

      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden text-primary hover:bg-primary/5" />}>
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <div className="flex flex-col gap-6 mt-8">
                  <Link to="/" className="text-2xl font-bold text-primary">ApnarPonno</Link>
                  <div className="h-px bg-slate-100" />
                  <Link to="/" className="text-lg font-medium hover:text-primary">Home</Link>
                  <Link to="/shop" className="text-lg font-medium hover:text-primary">Shop</Link>
                  <Link to="/offers" className="text-lg font-medium hover:text-primary">Offers</Link>
                  <Link to="/track-order" className="text-lg font-medium hover:text-primary">Track Order</Link>
                </div>
              </SheetContent>
            </Sheet>
            
            <Link to="/" className="text-2xl md:text-3xl font-bold text-primary tracking-tight shrink-0 flex items-center gap-2">
              {siteSettings?.logoUrl ? (
                <img src={siteSettings.logoUrl} alt={siteSettings.siteName} className="h-10 w-auto object-contain" />
              ) : (
                siteSettings?.siteName || 'ApnarPonno'
              )}
            </Link>
          </div>

          {/* Search Bar with Suggestions */}
          <div className="hidden md:block flex-grow max-w-2xl relative">
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                placeholder="Search for organic products..." 
                className="w-full h-12 pl-5 pr-12 rounded-full border-2 border-slate-100 focus:border-primary outline-none transition-all text-sm luxury-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <Button type="submit" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                <Search className="h-5 w-5 text-white" />
              </Button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl luxury-shadow border overflow-hidden z-50">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    className="w-full p-3 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => {
                      navigate(`/products/${product.id}`);
                      setShowSuggestions(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="h-10 w-10 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                      <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1" />
                    </div>
                    <div>
                      <p className="text-sm font-bold line-clamp-1">{product.name}</p>
                      <p className="text-xs text-primary font-bold">৳{product.discountPrice || product.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/wishlist" className="hidden sm:flex flex-col items-center group relative">
              <div className="relative">
                <Heart className={`h-6 w-6 transition-colors ${wishlist.length > 0 ? 'text-red-500 fill-current' : 'text-slate-700 group-hover:text-primary'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-[10px] font-bold text-slate-500 uppercase mt-1">Wishlist</span>
            </Link>

            <button onClick={() => setIsCartOpen(true)} className="relative group flex flex-col items-center outline-none">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-slate-700 group-hover:text-primary transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-[10px] font-bold text-slate-500 uppercase mt-1">Cart</span>
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <button className="flex flex-col items-center group outline-none">
                    <div className="h-7 w-7 rounded-full overflow-hidden border-2 border-slate-200 group-hover:border-primary transition-all">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-full w-full p-1 text-slate-600" />
                      )}
                    </div>
                    <span className="hidden md:block text-[10px] font-bold text-slate-500 uppercase mt-1">Account</span>
                  </button>
                } />
                <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl luxury-shadow border-slate-100">
                  <DropdownMenuLabel className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-full w-full p-2 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold">{profile?.displayName || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{profile?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    {isAdmin && (
                      <DropdownMenuItem render={
                        <Link to="/admin" className="flex items-center p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                          <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Admin Dashboard</span>
                        </Link>
                      } />
                    )}
                    <DropdownMenuItem render={
                      <Link to="/profile" className="flex items-center p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                        <User className="mr-3 h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                    } />
                    <DropdownMenuItem render={
                      <Link to="/orders" className="flex items-center p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                        <ShoppingCart className="mr-3 h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">My Orders</span>
                      </Link>
                    } />
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center p-2 rounded-xl hover:bg-red-50 text-red-500 cursor-pointer">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="text-sm font-medium">Log out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="flex flex-col items-center group">
                <User className="h-6 w-6 text-slate-700 group-hover:text-primary transition-colors" />
                <span className="hidden md:block text-[10px] font-bold text-slate-500 uppercase mt-1">Login</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Bottom Header - Category Menu */}
        <div className="hidden lg:block bg-primary text-white">
          <div className="container mx-auto px-4 flex items-center justify-between h-11">
            <div className="flex items-center gap-8 h-full">
              <Link to="/shop" className="flex items-center gap-2 text-sm font-bold hover:bg-white/10 h-full px-4 transition-colors">
                <Menu className="h-4 w-4" />
                All Categories
              </Link>
              <div className="flex items-center gap-8">
                <Link to="/" className="text-sm font-bold hover:text-secondary transition-colors">Home</Link>
                <Link to="/shop" className="text-sm font-bold hover:text-secondary transition-colors">Shop</Link>
                <Link to="/offers" className="text-sm font-bold hover:text-secondary transition-colors">Offers</Link>
                <Link to="/track-order" className="text-sm font-bold hover:text-secondary transition-colors">Track Order</Link>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <span className="text-white/60">Flash Sale:</span>
              <span className="text-secondary animate-pulse">Up to 50% Off</span>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};
