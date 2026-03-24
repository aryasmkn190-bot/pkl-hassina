"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  X,
  Plus,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ArrowLeft,
  Users,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  industry_type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  radius_meter: number;
  is_active: boolean;
  student_count?: number;
}

/* ── Company Form Modal ───────────────────────────────── */

function CompanyForm({
  company,
  onClose,
  onSave,
}: {
  company: Partial<Company> | null;
  onClose: () => void;
  onSave: (data: Partial<Company>) => Promise<void>;
}) {
  const isEdit = !!company?.id;
  const [form, setForm] = useState<Partial<Company>>(
    company ?? { radius_meter: 200, is_active: true }
  );
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Company, v: unknown) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error("Nama perusahaan wajib diisi"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-[60px] bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="w-4.5 h-4.5 text-slate-700" strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-bold text-slate-900 flex-1">
          {isEdit ? "Edit Perusahaan" : "Tambah Perusahaan"}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </header>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4 pb-8">
        {[
          { key: "name", label: "Nama Perusahaan *", placeholder: "PT. Contoh Maju", type: "text" },
          { key: "industry_type", label: "Bidang Usaha", placeholder: "Teknologi Informasi", type: "text" },
          { key: "address", label: "Alamat", placeholder: "Jl. Contoh No. 1", type: "text" },
          { key: "city", label: "Kota", placeholder: "Bandung", type: "text" },
          { key: "phone", label: "Telepon", placeholder: "022-1234567", type: "tel" },
          { key: "email", label: "Email", placeholder: "hr@perusahaan.id", type: "email" },
          { key: "contact_person", label: "Contact Person", placeholder: "Bapak/Ibu...", type: "text" },
        ].map((f) => (
          <div key={f.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{f.label}</p>
            <input
              type={f.type}
              value={(form[f.key as keyof Company] as string) ?? ""}
              onChange={(e) => set(f.key as keyof Company, e.target.value)}
              placeholder={f.placeholder}
              className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
            />
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Radius Geofencing (meter)</p>
          <input
            type="number"
            value={form.radius_meter ?? 200}
            onChange={(e) => set("radius_meter", parseInt(e.target.value) || 200)}
            className="w-full text-sm text-slate-800 outline-none bg-transparent"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Status Perusahaan</p>
              <p className={cn("text-xs mt-0.5", form.is_active ? "text-emerald-600" : "text-red-500")}>
                {form.is_active ? "Aktif — dapat menerima siswa" : "Tidak aktif"}
              </p>
            </div>
            <button
              onClick={() => set("is_active", !form.is_active)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors flex items-center px-1",
                form.is_active ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white shadow transition-transform",
                form.is_active ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function AdminPerusahaanPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Partial<Company> | null | undefined>(undefined);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: compData, error: compError } = await supabase
        .from("companies")
        .select("id, name, industry_type, address, city, phone, email, contact_person, radius_meter, is_active")
        .order("name");

      if (compError) throw compError;

      // Hitung jumlah siswa aktif per perusahaan
      const { data: countData } = await supabase
        .from("pkl_assignments")
        .select("company_id")
        .eq("status", "active");

      const countMap = new Map<string, number>();
      (countData ?? []).forEach((r: { company_id: string }) => {
        countMap.set(r.company_id, (countMap.get(r.company_id) ?? 0) + 1);
      });

      setCompanies(
        (compData ?? []).map((c) => ({
          ...c,
          student_count: countMap.get(c.id) ?? 0,
        }))
      );
    } catch (err) {
      console.error("loadCompanies error:", err);
      toast.error("Gagal memuat data perusahaan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: Partial<Company>) => {
    try {
      if (data.id) {
        // Update
        const { error } = await supabase
          .from("companies")
          .update({
            name: data.name,
            industry_type: data.industry_type,
            address: data.address,
            city: data.city,
            phone: data.phone,
            email: data.email,
            contact_person: data.contact_person,
            radius_meter: data.radius_meter,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
        setCompanies((prev) => prev.map((c) => c.id === data.id ? { ...c, ...data } as Company : c));
        toast.success("Perusahaan berhasil diperbarui ✅");
      } else {
        // Insert
        const { data: newData, error } = await supabase
          .from("companies")
          .insert({
            name: data.name!,
            industry_type: data.industry_type,
            address: data.address,
            city: data.city,
            phone: data.phone,
            email: data.email,
            contact_person: data.contact_person,
            radius_meter: data.radius_meter ?? 200,
            is_active: data.is_active ?? true,
          })
          .select()
          .single();
        if (error) throw error;
        setCompanies((prev) => [{ ...newData, student_count: 0 } as Company, ...prev]);
        toast.success("Perusahaan berhasil ditambahkan ✅");
      }
      setEditTarget(undefined);
    } catch (err) {
      console.error("saveCompany error:", err);
      toast.error("Gagal menyimpan data perusahaan");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}"? Data tidak dapat dikembalikan.`)) return;
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus — mungkin masih ada siswa yang terkait");
    } else {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast.success("Perusahaan dihapus");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q));
  }, [companies, search]);

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Perusahaan Mitra</h1>
              <p className="text-xs text-slate-400 mt-px">{companies.length} perusahaan</p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => loadData(true)} disabled={refreshing} className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </motion.button>
              <button
                onClick={() => setEditTarget(null)}
                className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 h-12 rounded-2xl bg-white border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input type="search" placeholder="Cari perusahaan atau kota..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center"><X className="w-3 h-3 text-slate-500" /></button>}
          </div>

          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Tidak ada perusahaan ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", c.is_active ? "bg-blue-50" : "bg-slate-100")}>
                      <Building2 className={cn("w-5.5 h-5.5", c.is_active ? "text-blue-600" : "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-bold text-slate-900 flex-1 truncate">{c.name}</p>
                        {!c.is_active && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full flex-shrink-0">Nonaktif</span>}
                      </div>
                      {c.industry_type && <p className="text-[11px] text-blue-600 font-medium mt-0.5">{c.industry_type}</p>}
                      <div className="space-y-0.5 mt-1">
                        {(c.address || c.city) && (
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-500">{[c.address, c.city].filter(Boolean).join(", ")}</span></div>
                        )}
                        {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /><span className="text-[11px] text-slate-500">{c.phone}</span></div>}
                        <div className="flex items-center gap-3">
                          {(c.student_count ?? 0) > 0 && <div className="flex items-center gap-1"><Users className="w-3 h-3 text-emerald-500" /><span className="text-[11px] text-emerald-600 font-semibold">{c.student_count} siswa aktif</span></div>}
                          <span className="text-[11px] text-slate-400">Radius: {c.radius_meter}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setEditTarget(c)}
                      className="flex-1 h-8 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-50"
                    >
                      <Pencil className="w-3 h-3" />Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={(c.student_count ?? 0) > 0}
                      className="flex-1 h-8 rounded-xl border border-red-200 text-xs font-semibold text-red-500 flex items-center justify-center gap-1.5 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3" />Hapus
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {editTarget !== undefined && (
          <CompanyForm
            company={editTarget}
            onClose={() => setEditTarget(undefined)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  );
}
