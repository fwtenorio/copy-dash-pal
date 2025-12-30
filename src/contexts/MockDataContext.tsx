import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface MockDataContextType {
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
  mockChargebackRate: number | null;
  setMockChargebackRate: (value: number | null) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

const STORAGE_KEY = "chargemind_use_mock_data";
const CB_RATE_KEY = "chargemind_mock_chargeback_rate";

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [useMockData, setUseMockDataState] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : false; // Default to production mode
  });
  const [mockChargebackRate, setMockChargebackRateState] = useState<number | null>(() => {
    const stored = localStorage.getItem(CB_RATE_KEY);
    if (stored === null) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const setUseMockData = (value: boolean) => {
    setUseMockDataState(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  };

  const setMockChargebackRate = (value: number | null) => {
    setMockChargebackRateState(value);
    if (value === null) {
      localStorage.removeItem(CB_RATE_KEY);
    } else {
      localStorage.setItem(CB_RATE_KEY, String(value));
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(useMockData));
  }, [useMockData]);

  useEffect(() => {
    if (mockChargebackRate === null) {
      localStorage.removeItem(CB_RATE_KEY);
    } else {
      localStorage.setItem(CB_RATE_KEY, String(mockChargebackRate));
    }
  }, [mockChargebackRate]);

  return (
    <MockDataContext.Provider value={{ useMockData, setUseMockData, mockChargebackRate, setMockChargebackRate }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockDataContext() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockDataContext must be used within a MockDataProvider");
  }
  return context;
}
