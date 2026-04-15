import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, GitCompare, ArrowRight, Trash2 } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const ComparisonBar = () => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (comparisonList.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] w-full max-w-2xl px-4">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-slate-900 text-white rounded-2xl p-4 luxury-shadow flex items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <GitCompare className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">Compare</span>
              <Badge className="bg-primary text-white border-none">{comparisonList.length}/3</Badge>
            </div>
            <div className="h-8 w-px bg-white/10 shrink-0" />
            <div className="flex gap-3">
              {comparisonList.map((product) => (
                <div key={product.id} className="relative group shrink-0">
                  <div className="h-12 w-12 bg-white rounded-xl overflow-hidden border border-white/20">
                    <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1" />
                  </div>
                  <button
                    onClick={() => removeFromComparison(product.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {comparisonList.length < 3 && (
                <div className="h-12 w-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20">
                  <PlusIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="sm" onClick={clearComparison} className="text-white/60 hover:text-white hover:bg-white/10 hidden sm:flex">
              Clear
            </Button>
            <Button size="sm" className="rounded-full font-bold px-6" onClick={() => setIsModalOpen(true)}>
              Compare Now
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-6xl bg-white rounded-[3rem] overflow-hidden luxury-shadow flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <GitCompare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Product Comparison</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex-grow overflow-x-auto p-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 text-left w-48 border-b">Features</th>
                      {comparisonList.map((product) => (
                        <th key={product.id} className="p-4 border-b min-w-[250px]">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-32 w-32 bg-slate-50 rounded-2xl overflow-hidden border">
                              <img src={product.image} alt={product.name} className="h-full w-full object-contain p-4" />
                            </div>
                            <h3 className="font-bold text-sm line-clamp-2">{product.name}</h3>
                            <p className="text-primary font-bold">৳{product.discountPrice || product.price}</p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { label: "Category", key: "category" },
                      { label: "Stock Status", key: "stock", format: (v: number) => v > 0 ? "In Stock" : "Out of Stock" },
                      { label: "Organic Certified", val: "Yes" },
                      { label: "Net Weight", val: "500g / 1kg" },
                      { label: "Shelf Life", val: "12 Months" },
                      { label: "Origin", val: "Bangladesh" }
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                        <td className="p-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">{row.label}</td>
                        {comparisonList.map((product) => (
                          <td key={product.id} className="p-4 text-center">
                            {row.val || (row.format ? row.format((product as any)[row.key!]) : (product as any)[row.key!])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className="p-4 border-t"></td>
                      {comparisonList.map((product) => (
                        <td key={product.id} className="p-4 border-t text-center">
                          <Button className="w-full rounded-xl font-bold">Add to Cart</Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
