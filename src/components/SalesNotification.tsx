import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';

const locations = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj'];
const products = ['Premium Honey', 'Organic Ghee', 'Black Seed Oil', 'Mixed Dry Fruits', 'Organic Turmeric', 'Premium Tea', 'Natural Soap', 'Chia Seeds'];

export const SalesNotification = () => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState({ location: '', product: '', time: '' });

  useEffect(() => {
    const showRandom = () => {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      setData({
        location: randomLocation,
        product: randomProduct,
        time: 'just now'
      });
      setShow(true);
      setTimeout(() => setShow(false), 5000);
    };

    const initialDelay = setTimeout(showRandom, 10000);
    const interval = setInterval(showRandom, 30000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -50, y: 50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -50, scale: 0.8 }}
          className="fixed bottom-6 left-6 z-[60] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-center gap-4 max-w-sm"
        >
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-grow pr-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Recent Purchase</p>
            <p className="text-sm font-bold text-slate-800">
              Someone from <span className="text-primary">{data.location}</span> bought <span className="text-primary">{data.product}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">{data.time}</p>
          </div>
          <button 
            onClick={() => setShow(false)}
            className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
