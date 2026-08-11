"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

const STORAGE_KEY = "reviewafs_selected_company_id";

interface CompanyContextValue {
  companies: Company[];
  selectedCompanyId: string | null;
  selectedCompany: Company | null;
  setSelectedCompanyId: (id: string | null) => void;
  createCompany: (name: string) => Promise<Company>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSelectedCompanyIdState(stored);

      fetch("/api/companies")
        .then((res) => res.json())
        .then((data) => setCompanies(data.companies ?? []))
        .finally(() => setLoading(false));
    }
    init();
  }, []);

  function setSelectedCompanyId(id: string | null) {
    setSelectedCompanyIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  async function createCompany(name: string): Promise<Company> {
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Không thể tạo công ty.");
    }
    const data = await res.json();
    setCompanies((prev) => [...prev, data.company].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedCompanyId(data.company.id);
    return data.company;
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  return (
    <CompanyContext.Provider
      value={{ companies, selectedCompanyId, selectedCompany, setSelectedCompanyId, createCompany, refresh, loading }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
