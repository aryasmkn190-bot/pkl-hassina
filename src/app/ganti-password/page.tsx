"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function GantiPasswordPage() {
  const r = useRouter();
  const [cur, setCur] = useState("");
  const [nxt, setNxt] = useState("");
  const [nxt2, setNxt2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (nxt !== nxt2) { setErr("Konfirmasi password baru tidak sama."); return; }
    if (nxt.length < 6) { setErr("Password baru minimal 6 karakter."); return; }
    setLoading(true);
    const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: cur, newPassword: nxt }) });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setErr(j.error ?? "Gagal ganti password."); return; }
    setOk(true);
    setTimeout(() => { signOut({ callbackUrl: "/login" }); }, 1200);
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-[var(--palette-background)] px-6 pt-10">
      <h1 className="text-xl font-bold" style={{ color: "var(--palette-foreground-ink)" }}>Ganti Password</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--palette-foreground-muted)" }}>Password awal 123456 wajib diganti saat login pertama.</p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-[24px] bg-white p-6 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
        <label className="ml-2 block text-sm font-semibold" style={{ color: "var(--palette-foreground-secondary)" }}>Password lama</label>
        <input value={cur} onChange={(e) => setCur(e.target.value)} type="password" placeholder="••••••••" className="w-full rounded-[20px] border-none px-5 py-4 text-sm outline-none" style={{ background: "var(--palette-surface-hover, #f3f4f6)" }} />
        <label className="ml-2 block text-sm font-semibold" style={{ color: "var(--palette-foreground-secondary)" }}>Password baru</label>
        <input value={nxt} onChange={(e) => setNxt(e.target.value)} type="password" placeholder="Minimal 6 karakter" className="w-full rounded-[20px] border-none px-5 py-4 text-sm outline-none" style={{ background: "var(--palette-surface-hover, #f3f4f6)" }} />
        <label className="ml-2 block text-sm font-semibold" style={{ color: "var(--palette-foreground-secondary)" }}>Ulangi password baru</label>
        <input value={nxt2} onChange={(e) => setNxt2(e.target.value)} type="password" placeholder="••••••••" className="w-full rounded-[20px] border-none px-5 py-4 text-sm outline-none" style={{ background: "var(--palette-surface-hover, #f3f4f6)" }} />
        {err && <p className="text-sm font-medium text-red-600">{err}</p>}
        {ok && <p className="text-sm font-medium text-green-600">Berhasil — mengarahkan ke login...</p>}
        <button disabled={loading} className="w-full rounded-full bg-[var(--palette-primary)] py-4 font-semibold text-white disabled:opacity-60">{loading ? "Memproses..." : "Simpan password baru"}</button>
        <button type="button" onClick={() => r.push("/siswa")} className="w-full rounded-full border border-[var(--palette-border)] bg-white py-3 font-semibold" style={{ color: "var(--palette-foreground)" }}>Kembali</button>
      </form>
    </div>
  );
}
