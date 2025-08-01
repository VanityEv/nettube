import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SafeDataContextType {
  errors: string[];
  addError: (error: string) => void;
  clearErrors: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const SafeDataContext = createContext<SafeDataContextType | undefined>(undefined);

interface SafeDataProviderProps {
  children: ReactNode;
}

export const SafeDataProvider: React.FC<SafeDataProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addError = (error: string) => {
    console.warn('SafeData Error:', error);
    setErrors(prev => [...prev, error]);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <SafeDataContext.Provider
      value={{
        errors,
        addError,
        clearErrors,
        isLoading,
        setLoading,
      }}
    >
      {children}
    </SafeDataContext.Provider>
  );
};

export const useSafeDataContext = () => {
  const context = useContext(SafeDataContext);
  if (context === undefined) {
    throw new Error('useSafeDataContext must be used within a SafeDataProvider');
  }
  return context;
};
