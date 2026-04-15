import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingCart, Heart, Share2, ShieldCheck, Truck, RotateCcw, Star, Minus, Plus, Clock, Send, User } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const q = query(collection(db, 'reviews'), where('productId', '==', id), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const pData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(pData);
          
          // Fetch related
          const q = query(collection(db, 'products'), where('category', '==', pData.category), limit(4));
          const qSnap = await getDocs(q);
          setRelatedProducts(qSnap.docs.filter(d => d.id !== id).map(d => ({ id: d.id, ...d.data() } as Product)));

          // Fetch reviews
          await fetchReviews();
        } else {
          toast.error("Product not found");
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to leave a review");
      navigate('/login');
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewData = {
        productId: id,
        userId: user.uid,
        userName: profile?.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: profile?.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      toast.success("Review submitted successfully!");
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return null;

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Images */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-muted border-8 border-white shadow-2xl">
            <img 
              src={product.images[activeImage] || `https://picsum.photos/seed/${product.id}/800/1000`} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`aspect-square w-24 rounded-2xl overflow-hidden border-4 transition-all shrink-0 ${activeImage === idx ? 'border-primary shadow-lg' : 'border-white shadow-md'}`}
              >
                <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full uppercase tracking-[0.2em] text-[10px] font-bold">{product.category}</Badge>
              {product.stock > 0 && <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Available Now</span>}
            </div>
            <h1 className="text-5xl md:text-7xl font-heading tracking-tight leading-[0.9]">{product.name}</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 bg-yellow-400/10 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-700">{averageRating} ({reviews.length} Reviews)</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">SKU: AP-{product.id.slice(0, 6).toUpperCase()}</span>
            </div>
            <p className="text-4xl font-bold text-primary tracking-tighter">৳{product.price.toLocaleString()}</p>
            
            {/* Stock Progress Bar */}
            {product.stock > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-orange-600">Hurry! Only {product.stock} left in stock</span>
                  <span className="text-slate-400">Sold: {Math.floor(Math.random() * 100) + 50}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(product.stock / 50) * 100}%` }}
                    className="h-full bg-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed text-lg font-light">
              {product.description || "Experience the pinnacle of craftsmanship with this exquisite piece. Meticulously designed for those who appreciate the finer things in life, combining timeless aesthetics with modern functionality."}
            </p>
          </div>

          <div className="space-y-6 pt-8 border-t border-primary/5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-primary/5 rounded-lg p-1 border border-primary/10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 hover:bg-white"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-bold">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 hover:bg-white"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  className="flex-grow h-12 gap-2 text-sm font-bold rounded-lg border-primary text-primary hover:bg-primary/5"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    for(let i=0; i<quantity; i++) addToCart(product);
                    toast.success("Added to cart");
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  কার্টে যোগ করুন
                </Button>
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 animate-bounce-subtle"
                disabled={product.stock <= 0}
                onClick={() => {
                  for(let i=0; i<quantity; i++) addToCart(product);
                  navigate('/cart');
                }}
              >
                অর্ডার করুন
              </Button>
            </div>

            {/* Psychological Triggers */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2">
              <div className="flex items-center gap-2 text-orange-700 text-sm font-bold">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>অফারটি শেষ হতে আর অল্প সময় বাকি!</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                <span>আজকে {Math.floor(Math.random() * 50) + 20} জন এই পণ্যটি অর্ডার করেছেন</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10">
            {[
              { icon: Truck, title: "Shipping", desc: "Complimentary" },
              { icon: RotateCcw, title: "Returns", desc: "14-day window" },
              { icon: ShieldCheck, title: "Authentic", desc: "Certified quality" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-6 rounded-[2rem] bg-white shadow-lg shadow-black/5 border border-primary/5">
                <item.icon className="h-6 w-6 text-primary/40" />
                <p className="font-bold text-xs uppercase tracking-widest">{item.title}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mb-24 pt-24 border-t border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-heading tracking-tight">Customer Reviews</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">{averageRating}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(averageRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Based on {reviews.length} reviews</p>
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
              <h3 className="font-bold text-lg">Leave a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold text-slate-400">Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="transition-transform active:scale-90"
                      >
                        <Star className={`h-6 w-6 ${star <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold text-slate-400">Your Experience</Label>
                  <textarea
                    className="w-full min-h-[120px] rounded-2xl border-none bg-white p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                    placeholder="Share your thoughts about this product..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 gap-2 font-bold"
                  disabled={submittingReview}
                >
                  <Send className="h-4 w-4" />
                  {submittingReview ? "Submitting..." : "Post Review"}
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                          {review.userPhoto ? (
                            <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{review.userName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm font-light italic">"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-100 rounded-[3rem]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">No reviews yet</h3>
                <p className="text-sm text-slate-400 max-w-xs">Be the first to share your experience with this product!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <h2 className="text-4xl font-heading tracking-tight">You May Also Like</h2>
              <p className="text-muted-foreground font-light">Complete your look with these curated pieces</p>
            </div>
            <Button variant="ghost" className="text-primary font-bold">Explore More</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Buy Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 p-4 md:hidden flex gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center bg-primary/5 rounded-lg p-1 border border-primary/10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-bold">{quantity}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            disabled={quantity >= product.stock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          className="flex-grow h-12 text-base font-bold rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          disabled={product.stock <= 0}
          onClick={() => {
            for(let i=0; i<quantity; i++) addToCart(product);
            navigate('/cart');
          }}
        >
          অর্ডার করুন
        </Button>
      </div>
    </div>
  );
};

export default ProductDetail;
