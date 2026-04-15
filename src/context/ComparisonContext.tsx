import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { toast } from 'sonner';

interface ComparisonContextType {
  comparisonList: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  isInComparison: (productId: string) => boolean;
  clearComparison: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<Product[]>([]);

  const addToComparison = (product: Product) => {
    if (comparisonList.length >= 3) {
      toast.error("You can only compare up to 3 products at a time.");
      return;
    }
    if (!comparisonList.find(item => item.id === product.id)) {
      setComparisonList([...comparisonList, product]);
      toast.success(`${product.name} added to comparison`);
    } else {
      removeFromComparison(product.id);
    }
  };

  const removeFromComparison = (productId: string) => {
    setComparisonList(comparisonList.filter(item => item.id !== productId));
  };

  const isInComparison = (productId: string) => {
    return comparisonList.some(item => item.id === productId);
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  return (
    <ComparisonContext.Provider value={{ comparisonList, addToComparison, removeFromComparison, isInComparison, clearComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
