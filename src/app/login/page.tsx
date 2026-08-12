"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const res = await signIn("credentials", { identifier: id, password: pw, redirect: false });
    setLoading(false);
    if (res?.error) { setErr("NIS/Email atau password salah."); return; }
    r.push("/");
    r.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-[var(--palette-background)]">
      {/* header-shape + logo — exact whip-login-form pulse */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[280px] rounded-b-[24px]" style={{ background: "var(--palette-primary)" }} />
        <div className="relative z-10 flex flex-col items-center px-6 pt-12">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[16px] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.1),0_4px_10px_rgba(0,0,0,0.05)]">
            <img src="/logo-hassina.jpg" alt="SMK HASSINA" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="mt-4 text-[28px] font-bold leading-tight" style={{ color: "var(--palette-foreground-inverse, #fff)" }}>PKL HASSINA</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>portal.smkhassina.sch.id</p>
          <p className="mt-1 text-center text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.95)" }}>Masuk untuk monitoring PKL/Magang</p>
        </div>
      </div>

      {/* card — exact whip */}
      <div className="relative z-20 mx-3 mt-6 flex flex-1 flex-col justify-between rounded-[24px] bg-white p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="ml-2 block text-sm font-semibold" style={{ color: "var(--palette-foreground-secondary)" }}>NIS / Email</label>
            <input
              value={id} onChange={(e) => setId(e.target.value)} placeholder="NIS (siswa) atau email (pembimbing)"
              className="mt-1 w-full rounded-[20px] border-none px-5 py-4 text-[15px] outline-none placeholder:text-[#9CA3AF] focus:shadow-[0_0_0_2px_var(--palette-primary)]"
              style={{ background: "var(--palette-surface-hover, #f3f4f6)", color: "var(--palette-foreground)" }}
            />
          </div>
          <div>
            <label className="ml-2 block text-sm font-semibold" style={{ color: "var(--palette-foreground-secondary)" }}>Password</label>
            <div className="relative mt-1">
              <input
                value={pw} onChange={(e) => setPw(e.target.value)} type={show ? "text" : "password"} placeholder="••••••••"
                className="w-full rounded-[20px] border-none px-5 py-4 pr-12 text-[15px] outline-none placeholder:text-[#9CA3AF] focus:shadow-[0_0_0_2px_var(--palette-primary)]"
                style={{ background: "var(--palette-surface-hover, #f3f4f6)", color: "var(--palette-foreground)" }}
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#607080]">
                <i className={show ? "far fa-eye-slash" : "far fa-eye"} />
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <span className="text-sm font-medium" style={{ color: "var(--palette-foreground-muted)" }}>Lupa password? Hubungi pembimbing.</span>
          </div>
          {err && <p className="text-center text-sm font-medium text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--palette-primary)] py-4 text-base font-semibold text-white transition hover:bg-[var(--palette-primary-hover)] active:scale-[0.98] disabled:opacity-60">
            {loading ? "Memproses..." : "Login to Account"}
          </button>
        </form>

        <div className="mt-6">
          <div className="flex items-center py-4">
            <div className="h-px flex-1" style={{ background: "var(--palette-border)" }} />
            <span className="mx-4 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--palette-foreground-muted)" }}>Siswa · Pembimbing · Admin</span>
            <div className="h-px flex-1" style={{ background: "var(--palette-border)" }} />
          </div>
          <p className="pb-2 text-center text-xs leading-snug" style={{ color: "var(--palette-foreground-muted)" }}>
            Password awal siswa: <b>123456</b> (wajib ganti) · Pembimbing pakai email sekolah
          </p>
        </div>
      </div>
      <p className="px-6 py-4 text-center text-xs" style={{ color: "var(--palette-foreground-muted)" }}>© SMK HASSINA Sukabumi</p>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}
