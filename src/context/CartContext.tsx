import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(current => {
      const existing = current.find(item => item._id === newItem._id);
      if (existing) {
        return current.map(item =>
          item._id === newItem._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...newItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(current => current.filter(item => item._id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems(current =>
      current.map(item => (item._id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
