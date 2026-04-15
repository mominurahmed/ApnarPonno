import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { QuickViewModal } from '../components/QuickViewModal';

interface QuickViewContextType {
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export const QuickViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleOpen = (e: any) => {
      setSelectedProduct(e.detail);
    };
    window.addEventListener('open-quick-view', handleOpen);
    return () => window.removeEventListener('open-quick-view', handleOpen);
  }, []);

  const openQuickView = (product: Product) => setSelectedProduct(product);
  const closeQuickView = () => setSelectedProduct(null);

  return (
    <QuickViewContext.Provider value={{ openQuickView, closeQuickView }}>
      {children}
      <QuickViewModal product={selectedProduct} onClose={closeQuickView} />
    </QuickViewContext.Provider>
  );
};

export const useQuickView = () => {
  const context = useContext(QuickViewContext);
  if (context === undefined) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
};
