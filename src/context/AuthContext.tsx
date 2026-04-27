import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  addresses?: string[];
  avatar?: string;
}

interface AuthContextType {
  customer: Customer | null;
  login: (customer: Customer) => void;
  logout: () => void;
  updateCustomer: (customer: Customer) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('foodbites_customer');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (customer) {
      localStorage.setItem('foodbites_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('foodbites_customer');
    }
  }, [customer]);

  const login = (userData: Customer) => setCustomer(userData);
  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('token');
  };
  const updateCustomer = (userData: Customer) => setCustomer(userData);

  return (
    <AuthContext.Provider value={{ customer, login, logout, updateCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

