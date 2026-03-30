"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Search, X, MapPin, Phone, Mail,
  ChevronRight, ArrowLeft, Users, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  industry_type: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  is_active: boolean;
  student_count: number;
}


function CompanyDetail({ company, onClose }: { company: Company; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1 truncate">{company.name}</h1>
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", company.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          {company.is_active ? "Aktif" : "Nonaktif"}
        </span>
      </header>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{company.name}</h2>
              <p className="text-sm text-blue-600 font-medium">{company.industry_type}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><p className="text-sm text-slate-700">{company.address}, {company.city}</p></div>
            {company.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-700">{company.phone}</p></div>}
            {company.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-700">{company.email}</p></div>}
            {company.contact_person && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /><p className="text-sm text-slate-700">{company.contact_person} (Kontak Person)</p></div>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{company.student_count}</p><p className="text-xs text-slate-500">Siswa sedang PKL</p></div>
        </div>
      </div>
    </motion.div>
  );
}

export default function KajurPerusahaanPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const { data: compData, error } = await supabase
        .from("companies")
        .select("id, name, industry_type, address, city, phone, email, contact_person, is_active")
        .order("name");
      if (error) throw error;

      // Hitung siswa aktif per perusahaan
      const { data: assignData } = await supabase
        .from("pkl_assignments")
        .select("company_id")
        .eq("status", "active");

      const cMap = new Map<string, number>();
      (assignData ?? []).forEach((a: { company_id: string | null }) => {
        if (a.company_id) cMap.set(a.company_id, (cMap.get(a.company_id) ?? 0) + 1);
      });

      setCompanies((compData ?? []).map((c) => ({ ...c, student_count: cMap.get(c.id) ?? 0 })));
    } catch {
      toast.error("Gagal memuat data perusahaan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Cari perusahaan atau kota..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>

          {loading ? (
            <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />)}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((company, i) => (
                <motion.button
                  key={company.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(company)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", company.is_active ? "bg-blue-50" : "bg-slate-100")}>
                      <Building2 className={cn("w-5.5 h-5.5", company.is_active ? "text-blue-600" : "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-bold text-slate-900 flex-1 truncate">{company.name}</p>
                        {!company.is_active && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full flex-shrink-0">Nonaktif</span>}
                      </div>
                      <p className="text-[11px] text-blue-600 font-medium mt-0.5">{company.industry_type}</p>
                      <div className="flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-500">{company.city}</span></div>
                      {company.student_count > 0 && <p className="text-[11px] text-emerald-600 font-semibold mt-1">{company.student_count} siswa aktif</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {selected && <CompanyDetail company={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}
